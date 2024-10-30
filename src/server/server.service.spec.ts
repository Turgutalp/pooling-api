import { Test, TestingModule } from '@nestjs/testing';
import { AppConfig } from '../util/config/appConfig';
import { DuplicatePrimaryNumber, InvalidSignature } from '../util/error/types';
import * as Helper from '../util/helper/helper';
import { ServerService } from './server.service';

jest.mock('../util/config/appConfig', () => ({
  AppConfig: {
    clientCount: 3,
    primeLimit: 10,
    useRoundRobin: true,
  },
}));

jest.mock('../util/helper/helper', () => ({
  verifySignature: jest.fn(),
}));

describe('ServerService', () => {
  let service: ServerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ServerService],
    }).compile();

    service = module.get<ServerService>(ServerService);

    jest.spyOn(service['logger'], 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should handle client registration', () => {
    const data = {
      clientId: 'client1',
      publicKey: Buffer.from('publicKey1').toString('base64'),
    };

    const response = service.handleClientRegistration(data);

    expect(response).toEqual({
      message: 'Client registered successfully',
      order: 0,
    });
    expect(service['clients'].size).toBe(1);
  });

  it('should return message if client already registered', () => {
    const data = {
      clientId: 'client1',
      publicKey: Buffer.from('publicKey1').toString('base64'),
    };

    service.handleClientRegistration(data);

    const response = service.handleClientRegistration(data);

    expect(response).toEqual({
      message: 'Client already registered',
      order: 0,
    });
    expect(service['clients'].size).toBe(1);
  });

  it('should not register the same client twice', () => {
    const data = {
      clientId: 'client1',
      publicKey: Buffer.from('publicKey1').toString('base64'),
    };

    service.handleClientRegistration(data);
    const response = service.handleClientRegistration(data);

    expect(response).toEqual({
      message: 'Client already registered',
      order: 0,
    });
    expect(service['clients'].size).toBe(1);
  });

  it('should start processing after all clients registered', () => {
    const startProcessingSpy = jest.spyOn(service as any, 'startProcessing');

    const clientsData = [
      {
        clientId: 'client1',
        publicKey: Buffer.from('key1').toString('base64'),
      },
      {
        clientId: 'client2',
        publicKey: Buffer.from('key2').toString('base64'),
      },
      {
        clientId: 'client3',
        publicKey: Buffer.from('key3').toString('base64'),
      },
    ];

    clientsData.forEach((data) => {
      service.handleClientRegistration(data);
    });

    expect(startProcessingSpy).toHaveBeenCalled();
    expect(service['processingStarted']).toBe(true);
    expect(service['clientQueue'].length).toBe(3);
  });

  it('should handle prime submission in round-robin', () => {
    service['processingStarted'] = true;
    service['clientQueue'] = ['client1', 'client2', 'client3'];
    service['currentClientIndex'] = 0;

    const clientInfo = {
      clientId: 'client1',
      publicKey: 'publicKey1',
      score: 0,
      order: 0,
    };
    service['clients'].set('client1', clientInfo);

    (Helper.verifySignature as jest.Mock).mockReturnValue(true);

    const response = service.handlePrimeSubmission({
      clientId: 'client1',
      primeNumber: '17',
      signature: 'signature',
    });

    expect(response).toBe('Prime number added: 17');
    expect(service['currentClientIndex']).toBe(1);
  });

  it('should print results and exit when prime limit is reached', () => {
    service['startTime'] = Date.now();
    service['processingStarted'] = true;
    service['clientQueue'] = ['client1'];
    service['currentClientIndex'] = 0;

    const clientInfo = {
      clientId: 'client1',
      publicKey: 'publicKey1',
      score: 0,
      order: 0,
    };
    service['clients'].set('client1', clientInfo);

    (Helper.verifySignature as jest.Mock).mockReturnValue(true);

    AppConfig.primeLimit = 1;

    const exitSpy = jest
      .spyOn(process, 'exit')
      .mockImplementation((() => {}) as any);

    const printResultsSpy = jest
      .spyOn(service, 'printResults')
      .mockImplementation();

    const response = service.handlePrimeSubmission({
      clientId: 'client1',
      primeNumber: '17',
      signature: 'signature',
    });

    expect(response).toBe('Prime number added: 17');
    expect(printResultsSpy).toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  it("should reject submission if not client's turn", () => {
    service['processingStarted'] = true;
    service['clientQueue'] = ['client1', 'client2', 'client3'];
    service['currentClientIndex'] = 1;

    const response = service.handlePrimeSubmission({
      clientId: 'client1',
      primeNumber: '17',
      signature: 'signature',
    });

    expect(response).toBe('Current turn: client2');
  });

  it('should reject invalid signature', () => {
    service['processingStarted'] = true;
    service['clientQueue'] = ['client1', 'client2', 'client3'];
    service['currentClientIndex'] = 0;

    const clientInfo = {
      clientId: 'client1',
      publicKey: 'publicKey1',
      score: 0,
      order: 0,
    };
    service['clients'].set('client1', clientInfo);

    (Helper.verifySignature as jest.Mock).mockReturnValue(false);

    const response = service.handlePrimeSubmission({
      clientId: 'client1',
      primeNumber: '17',
      signature: 'invalid_signature',
    });

    expect(response).toBe(InvalidSignature.message);
    expect(service['currentClientIndex']).toBe(0);
  });

  it('should handle duplicate prime numbers', () => {
    service['processingStarted'] = true;
    service['clientQueue'] = ['client1', 'client2', 'client3'];
    service['currentClientIndex'] = 0;

    const clientInfo = {
      clientId: 'client1',
      publicKey: 'publicKey1',
      score: 0,
      order: 0,
    };
    service['clients'].set('client1', clientInfo);

    (Helper.verifySignature as jest.Mock).mockReturnValue(true);

    let response = service.handlePrimeSubmission({
      clientId: 'client1',
      primeNumber: '17',
      signature: 'signature',
    });

    expect(response).toBe('Prime number added: 17');
    expect(service['currentClientIndex']).toBe(1);

    service['currentClientIndex'] = 0;

    response = service.handlePrimeSubmission({
      clientId: 'client1',
      primeNumber: '17',
      signature: 'signature',
    });

    expect(response).toBe(DuplicatePrimaryNumber.message);
  });

  it('should return current client index', () => {
    service['currentClientIndex'] = 2;
    const index = service.handleGetCurrentIndex();
    expect(index).toBe(2);
  });
});
