import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { ServerService } from './server.service';

@Controller()
export class ServerController {
  constructor(private readonly serverService: ServerService) {}

  @MessagePattern('register')
  handleClientRegistration(data: any) {
    return this.serverService.handleClientRegistration(data);
  }

  @MessagePattern('prime')
  handlePrimeSubmission(data: any) {
    return this.serverService.handlePrimeSubmission(data);
  }

  @MessagePattern('get_current_index')
  handleGetCurrentIndex() {
    return this.serverService.handleGetCurrentIndex();
  }

  @MessagePattern('ping')
  handlePing(): string {
    console.log('pong');
    return 'pong';
  }
}
