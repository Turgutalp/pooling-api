import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';
import { AppConfig } from '../util/config/appConfig';
import { ClientService } from './client.service';

jest.mock('../util/config/appConfig', () => ({
  AppConfig: {
    host: 'localhost',
    port: 3000,
    clientRetryCount: 3,
    clientRetryDelay: 100,
    clientPingInterval: 1000,
    primeGenerationInterval: 1000,
    varyClientSpeeds: false,
    useRoundRobin: true,
    autoStartSendingPrimes: false,
  },
}));

describe('ClientService', () => {
  let service: ClientService;
  let clientProxyMock: {
    connect: jest.Mock<any, any, any>;
    send: jest.Mock<any, any, any>;
  };

  beforeEach(async () => {
    clientProxyMock = {
      connect: jest.fn().mockResolvedValue(undefined),
      send: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ClientService],
    })
      .overrideProvider('ClientProxy')
      .useValue(clientProxyMock)
      .compile();

    service = module.get<ClientService>(ClientService);

    jest.spyOn(service as any, 'generateKeys').mockImplementation(() => {
      service['publicKey'] = 'test-public-key';
      service['privateKey'] = 'test-private-key';
    });

    jest.spyOn(service['logger'], 'log').mockImplementation(() => {});
    jest.spyOn(service['logger'], 'error').mockImplementation(() => {});

    jest.spyOn(service as any, 'register').mockImplementation(async () => {
      service['order'] = 0;
    });

    jest
      .spyOn(service as any, 'startSendingPrimes')
      .mockImplementation(async () => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should initialize module correctly', async () => {
    const connectSpy = jest
      .spyOn(service['client'], 'connect')
      .mockResolvedValue(undefined);

    const startPingSpy = jest
      .spyOn(service as any, 'startPing')
      .mockImplementation();

    const registerSpy = jest
      .spyOn(service as any, 'register')
      .mockResolvedValue(undefined);

    await service.onModuleInit();

    expect(connectSpy).toHaveBeenCalled();
    expect(startPingSpy).toHaveBeenCalled();
    expect(registerSpy).toHaveBeenCalled();
  });

  it('should clean up on module destroy', async () => {
    const unsubscribeSpy = jest.fn();
    service['pingInterval'] = { unsubscribe: unsubscribeSpy };

    await service.onModuleDestroy();

    expect(service['isActive']).toBe(false);
    expect(unsubscribeSpy).toHaveBeenCalled();
  });

  it('should start pinging the server', () => {
    const loggerSpy = jest.spyOn(service['logger'], 'log');

    jest.spyOn(service['client'], 'send').mockReturnValue(of('pong'));

    jest.useFakeTimers();

    service['startPing']();

    jest.advanceTimersByTime(AppConfig.clientPingInterval);

    expect(loggerSpy).toHaveBeenCalledWith('Ping sending...');
    expect(loggerSpy).toHaveBeenCalledWith('Ping response received: pong');

    jest.useRealTimers();
  });

  it('should not send prime number when it is not my turn', async () => {
    jest.useFakeTimers();

    jest.spyOn(service as any, 'isMyTurn').mockResolvedValue(false);

    const sendPrimeSpy = jest
      .spyOn(service as any, 'sendPrime')
      .mockResolvedValue(undefined);

    service['isActive'] = true;

    const startSendingPrimesPromise = service.startSendingPrimes(1);

    jest.advanceTimersByTime(0);
    await Promise.resolve();

    await startSendingPrimesPromise;

    expect(sendPrimeSpy).not.toHaveBeenCalled();

    jest.useRealTimers();
  });
});
