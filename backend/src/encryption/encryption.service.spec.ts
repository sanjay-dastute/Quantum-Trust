import { Test, TestingModule } from '@nestjs/testing';
import { EncryptionService } from './encryption.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TemporaryMetadata } from '../entities/temp-metadata.entity';
import { CryptoService } from '../crypto/crypto.service';
import { StorageService } from '../integrations/storage/storage.service';
import { LedgerService } from '../integrations/ledger/ledger.service';
import { HsmService } from '../hsm/hsm.service';
import { KeysService } from '../keys/keys.service';
import { UsersService } from '../users/users.service';
import { MetricsService } from '../metrics/metrics.service';

describe('EncryptionService', () => {
  let service: EncryptionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EncryptionService,
        { provide: getRepositoryToken(TemporaryMetadata), useValue: {} },
        { provide: CryptoService, useValue: {} },
        { provide: StorageService, useValue: {} },
        { provide: LedgerService, useValue: {} },
        { provide: HsmService, useValue: {} },
        { provide: KeysService, useValue: {} },
        { provide: UsersService, useValue: {} },
        { provide: MetricsService, useValue: {} },
      ],
    }).compile();

    service = module.get<EncryptionService>(EncryptionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
