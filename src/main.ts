import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const natsMS = await app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.NATS,
    options: {
      //local usage
      servers: ['nats://localhost:4222'],
      //docker usage on Windows machine
      // servers: ['nats://host.docker.internal:4222'],
      timeout: 600000,
    },
  });
  //
  natsMS.listen();
  await app.listen(3000);
}
bootstrap();
