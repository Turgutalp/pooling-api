import {
  HttpStatus,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import {
  ClientProxy,
  ClientProxyFactory,
  Transport,
} from '@nestjs/microservices';
import * as crypto from 'crypto';
import { firstValueFrom, interval, retry, tap } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { AppConfig } from '../util/config/appConfig';
import { GenericHttpException } from '../util/error';
import {
  GeneratePrimeNumberError,
  StartSendingPrimesError,
} from '../util/error/types';
import { getVariableInterval, signData } from '../util/helper/helper';

@Injectable()
export class ClientService implements OnModuleInit, OnModuleDestroy {
  private client: ClientProxy;
  private clientId: string;
  private publicKey: string;
  private privateKey: string;
  private logger: Logger = new Logger(ClientService.name);
  private order: number;
  private isActive: boolean = true;
  private pingInterval: any;

  constructor() {
    this.clientId = uuidv4();
    this.logger.log(`Client started. clientId: ${this.clientId}`);

    this.generateKeys();

    this.client = ClientProxyFactory.create({
      transport: Transport.TCP,
      options: { host: AppConfig.host, port: AppConfig.port },
    });
  }

  async onModuleDestroy() {
    this.isActive = false;
    this.logger.log('ClientService is shutting down.');
    if (this.pingInterval) {
      this.pingInterval.unsubscribe();
    }
  }

  async onModuleInit() {
    await this.client.connect();
    this.startPing();
    await this.register();
  }

  private async register() {
    const publicKeyBase64 = Buffer.from(this.publicKey).toString('base64');

    const response = await firstValueFrom(
      this.client.send('register', {
        clientId: this.clientId,
        publicKey: publicKeyBase64,
      }),
    );

    this.order = response.order;
    this.logger.log(`Registered to server. Order: ${this.order}`);

    if (AppConfig.autoStartSendingPrimes) {
      this.startSendingPrimes();
    }
  }

  async startSendingPrimes(iterationCount: number = Infinity) {
    try {
      let iterations = 0;
      while (this.isActive && iterations < iterationCount) {
        if (AppConfig.useRoundRobin) {
          this.logger.log('Round Robin scale active');
          const isMyTurn: boolean = await this.isMyTurn();
          if (isMyTurn) {
            await this.sendPrime();
          } else {
            await this.sleep(100);
          }
        } else {
          await this.sendPrime();
        }

        const primeInterval = AppConfig.varyClientSpeeds
          ? getVariableInterval(this.order)
          : AppConfig.primeGenerationInterval;

        await this.sleep(primeInterval);
        iterations++;
      }
    } catch (error) {
      this.logger.error(`Error occurred: ${error.message}`);
      throw new GenericHttpException(
        StartSendingPrimesError,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private async isMyTurn(): Promise<boolean> {
    const currentIndex = await firstValueFrom(
      this.client.send('get_current_index', {}),
    );
    return currentIndex === this.order;
  }

  private async sendPrime() {
    const prime = await this.generatePrime();
    const signature = signData(prime.toString(), this.privateKey);

    const response = await firstValueFrom(
      this.client
        .send('prime', {
          clientId: this.clientId,
          primeNumber: prime.toString(),
          signature: signature,
        })
        .pipe(
          retry({
            count: AppConfig.clientRetryCount,
            delay: (error, retryCount) => {
              this.logger.error(
                `Error occurred during submission to the server: ${error.message}. Retry count: ${retryCount}`,
              );
              return new Promise((resolve) =>
                setTimeout(resolve, AppConfig.clientRetryDelay),
              );
            },
          }),
        ),
    );

    this.logger.log(`Server response: ${response}`);
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private generateKeys() {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
    });

    this.publicKey = publicKey
      .export({ type: 'spki', format: 'pem' })
      .toString();
    this.privateKey = privateKey
      .export({ type: 'pkcs8', format: 'pem' })
      .toString();
  }

  private async generatePrime(): Promise<bigint> {
    return new Promise((resolve, reject) => {
      crypto.generatePrime(64, { bigint: true }, (err, prime) => {
        if (err) {
          this.logger.error(`${GeneratePrimeNumberError.message}: ${err}`);
          reject(err);
        } else {
          resolve(prime);
        }
      });
    });
  }

  private startPing() {
    this.pingInterval = interval(AppConfig.clientPingInterval)
      .pipe(
        tap(() => {
          this.logger.log('Ping sending...');
          this.client.send('ping', { clientId: this.clientId }).subscribe({
            next: (response) =>
              this.logger.log(`Ping response received: ${response}`),
            error: (err) => this.logger.error(`Ping error: ${err.message}`),
          });
        }),
      )
      .subscribe();
  }
}
