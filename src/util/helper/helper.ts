import * as crypto from 'crypto';
import { AppConfig } from '../config/appConfig';
import { VerifySignatureError } from '../error/types';

export function getVariableInterval(order: number): number {
  if (AppConfig.clientCount === 1) {
    return AppConfig.minClientInterval;
  }

  const intervalRange: number =
    AppConfig.maxClientInterval - AppConfig.minClientInterval;
  const intervalPerClient = intervalRange / (AppConfig.clientCount - 1);
  const interval = AppConfig.minClientInterval + order * intervalPerClient;

  return Math.round(interval);
}

export function signData(data: string, privateKey: string): string {
  const signer = crypto.createSign('sha256');
  signer.update(data);
  signer.end();
  const signature = signer.sign(privateKey, 'hex');
  return signature;
}

export function verifySignature(
  data: string,
  signature: string,
  publicKey: string,
): boolean {
  try {
    const verifier = crypto.createVerify('sha256');
    verifier.update(data);
    verifier.end();
    const isValid = verifier.verify(publicKey, signature, 'hex');
    return isValid;
  } catch (error) {
    console.log(`${VerifySignatureError.message}: ${error}`);
    return false;
  }
}
