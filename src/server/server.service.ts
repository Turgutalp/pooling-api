import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { AppConfig } from '../util/config/appConfig';
import {
  ClientNotFound,
  DuplicatePrimaryNumber,
  InvalidSignature,
} from '../util/error/types';
import { verifySignature } from '../util/helper/helper';
import { IClientInfo } from './server.interface';

@Injectable()
export class ServerService implements OnModuleInit {
  private logger: Logger = new Logger(ServerService.name);
  private primeNumbers: Set<string> = new Set();
  private clients: Map<string, IClientInfo> = new Map();
  private clientQueue: string[] = [];
  private currentClientIndex = 0;
  private startTime: number;
  private processingStarted: boolean = false;

  onModuleInit() {
    this.startTime = Date.now();
    this.logger.log(`Server started... -> ${this.startTime}`);
  }

  @MessagePattern('register')
  handleClientRegistration(data: any): any {
    const { clientId, publicKey } = data;
    this.logger.log(
      `Client registration request received. clientId: ${clientId}`,
    );
    if (this.clients.has(clientId)) {
      return {
        message: 'Client already registered',
        order: this.clients.get(clientId).order,
      };
    }

    const clientInfo: IClientInfo = {
      clientId,
      publicKey: Buffer.from(publicKey, 'base64').toString(),
      score: 0,
      order: this.clients.size,
    };

    this.clients.set(clientId, clientInfo);

    if (this.clients.size >= AppConfig.clientCount && !this.processingStarted) {
      this.startProcessing();
    }

    return {
      message: 'Client registered successfully',
      order: clientInfo.order,
    };
  }

  startProcessing() {
    this.processingStarted = true;
    this.logger.log('All clients have registered. Starting processing...');

    if (AppConfig.useRoundRobin) {
      this.clientQueue = Array.from(this.clients.keys());
      this.logger.log('Client queue: ' + this.clientQueue.join(', '));
    }
  }

  @MessagePattern('prime')
  handlePrimeSubmission(data: any): string {
    const { clientId, primeNumber, signature } = data;
    if (!this.processingStarted) {
      return 'Processing has not started yet. Please wait.';
    }
    if (AppConfig.useRoundRobin) {
      const expectedClientId = this.clientQueue[this.currentClientIndex];
      if (clientId !== expectedClientId) {
        return `Current turn: ${expectedClientId}`;
      }

      const result = this.addPrimeNumber(clientId, primeNumber, signature);
      if (result.startsWith('Prime number added')) {
        this.currentClientIndex =
          (this.currentClientIndex + 1) % this.clientQueue.length;
      }
      return result;
    } else {
      return this.addPrimeNumber(clientId, primeNumber, signature);
    }
  }

  @MessagePattern('get_current_index')
  handleGetCurrentIndex() {
    return this.currentClientIndex;
  }

  addPrimeNumber(
    clientId: string,
    primeNumber: string,
    signature: string,
  ): string {
    const client = this.clients.get(clientId);
    if (!client) return ClientNotFound.message as string;

    const isValid = verifySignature(primeNumber, signature, client.publicKey);
    if (!isValid) return InvalidSignature.message as string;

    if (this.primeNumbers.has(primeNumber))
      return DuplicatePrimaryNumber.message as string;

    this.primeNumbers.add(primeNumber);
    client.score += 1;

    this.logger.log(
      `Prime number added. clientId:${clientId}, primeNumber:${primeNumber}`,
    );

    if (this.primeNumbers.size >= AppConfig.primeLimit) {
      this.printResults();
      process.exit(0);
    }

    return `Prime number added: ${primeNumber}`;
  }

  printResults() {
    const endTime = Date.now();
    const duration = endTime - this.startTime;

    this.logger.log('---PRIME NUMBERS: ---');
    this.logger.log(Array.from(this.primeNumbers));
    this.logger.log('--- RESULT ---');
    this.clients.forEach((client) => {
      this.logger.log(
        `clientId:${client.clientId}: ${client.score} prime numbers sent`,
      );
    });
    this.logger.log(
      '*********************************************************',
    );
    this.logger.log(
      `Total execution time: ${duration} ms (${(duration / 1000).toFixed(
        2,
      )} seconds)`,
    );
    this.logger.log(
      '*********************************************************',
    );
  }
}
