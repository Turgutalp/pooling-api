import * as crypto from 'crypto';
import { signData, verifySignature } from './helper';

describe('Helper', () => {
  it('should sign and verify data correctly', () => {
    const data = 'test-data';
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
    });

    const privatePem = privateKey
      .export({ type: 'pkcs8', format: 'pem' })
      .toString();
    const publicPem = publicKey
      .export({ type: 'spki', format: 'pem' })
      .toString();

    const signature = signData(data, privatePem);
    const isValid = verifySignature(data, signature, publicPem);

    expect(isValid).toBe(true);
  });

  it('should fail verification with incorrect signature', () => {
    const data = 'test-data';
    const { publicKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
    });

    const publicPem = publicKey
      .export({ type: 'spki', format: 'pem' })
      .toString();

    const invalidSignature = 'invalid-signature';
    const isValid = verifySignature(data, invalidSignature, publicPem);

    expect(isValid).toBe(false);
  });
});
