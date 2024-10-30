import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import cluster from 'cluster';
import { AppModule } from './app.module';
import { ClientModule } from './client/client.module';
import { ClientService } from './client/client.service';
import { AppConfig } from './util/config/appConfig';

async function bootstrap() {
  console.log(`Process ID: ${process.pid}, isPrimary: ${cluster.isPrimary}...`);

  if (cluster.isPrimary) {
    const appServer = await NestFactory.createMicroservice(AppModule, {
      transport: Transport.TCP,
      options: { host: AppConfig.host, port: AppConfig.port },
    });

    await appServer.listen();
    console.log(`Server started on port ${AppConfig.port}.`);

    Array.from({ length: AppConfig.clientCount }).forEach(() => cluster.fork());
  } else {
    const appClient = await NestFactory.createApplicationContext(ClientModule);
    appClient.get(ClientService);
    console.log(`Client process started with PID: ${process.pid}`);
  }
}

bootstrap();
