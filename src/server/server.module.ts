import { Module } from '@nestjs/common';
import { ServerController } from './server.controller';
import { ServerService } from './server.service';

@Module({
  providers: [ServerService],
  controllers: [ServerController],
})
export class ServerModule {}
