import { Test, TestingModule } from '@nestjs/testing';
import { StorageService } from './storage.service';
import { CryptoService } from '../../crypto/crypto.service';

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        { provide: CryptoService, useValue: {} },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
