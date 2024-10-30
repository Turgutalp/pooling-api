import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import * as net from 'net';
import * as crypto from 'crypto';

describe('E2E Testing', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.listen(3000);
  });

  it('should allow a client to register and send a prime number', (done) => {
    const client = new net.Socket();

    client.connect(3000, '127.0.0.1', () => {
      const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
      });
      const publicPem = publicKey
        .export({ type: 'spki', format: 'pem' })
        .toString();
      const privatePem = privateKey
        .export({ type: 'pkcs8', format: 'pem' })
        .toString();

      const clientId = 'e2e-test-client';

      // Kayıt isteği gönder
      const registrationPayload = JSON.stringify({
        pattern: 'register',
        data: {
          clientId,
          publicKey: Buffer.from(publicPem).toString('base64'),
        },
      });

      client.write(registrationPayload);

      setTimeout(() => {
        const primeNumber = '13';
        const signature = crypto
          .createSign('sha256')
          .update(primeNumber)
          .sign(privatePem, 'hex');

        const primePayload = JSON.stringify({
          pattern: 'prime',
          data: {
            clientId,
            primeNumber,
            signature,
          },
        });

        client.write(primePayload);
        client.destroy();
        done();
      }, 1000);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
