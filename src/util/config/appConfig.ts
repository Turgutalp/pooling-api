import * as dotenv from 'dotenv';
dotenv.config();
function parseBoolean(value: string, defaultValue: boolean): boolean {
  if (value === undefined) {
    return defaultValue;
  }
  return value.toLowerCase() === 'true';
}

export const AppConfig = {
  port: parseInt(process.env.PORT) || 3000,
  host: process.env.HOST || '0.0.0.0',
  primeLimit: parseInt(process.env.PRIME_LIMIT) || 120,
  clientCount: parseInt(process.env.CLIENT_COUNT) || 3,
  autoStartSendingPrimes: parseBoolean(
    process.env.AUTO_START_SENDING_PRIMES,
    true,
  ),
  primeGenerationInterval: parseInt(process.env.PRIME_INTERVAL) || 1000,
  useRoundRobin: parseBoolean(process.env.USE_ROUND_ROBIN, true),
  varyClientSpeeds: parseBoolean(process.env.VARY_CLIENT_SPEEDS, true),
  minClientInterval: parseInt(process.env.MIN_CLIENT_INTERVAL) || 50,
  maxClientInterval: parseInt(process.env.MAX_CLIENT_INTERVAL) || 200,
  clientRetryCount: parseInt(process.env.CLIENT_RETRY_COUNT) || 5,
  clientPingInterval: parseInt(process.env.CLIENT_PING_INTERVAL) || 20000,
  clientRetryDelay: parseInt(process.env.CLIENT_RETRY_DELAY) || 1000,
};
