import { Test, TestingModule } from '@nestjs/testing';
import { KeysService } from './keys.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Key } from '../entities/key.entity';
import { RecoverySession } from '../entities/recovery-session.entity';
import { CryptoService } from '../crypto/crypto.service';
import { LedgerService } from '../integrations/ledger/ledger.service';
import { UsersService } from '../users/users.service';
import { MetricsService } from '../metrics/metrics.service';

describe('KeysService', () => {
  let service: KeysService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KeysService,
        { provide: getRepositoryToken(Key), useValue: {} },
        { provide: getRepositoryToken(RecoverySession), useValue: {} },
        { provide: CryptoService, useValue: {} },
        { provide: LedgerService, useValue: {} },
        { provide: UsersService, useValue: {} },
        { provide: MetricsService, useValue: {} },
      ],
    }).compile();

    service = module.get<KeysService>(KeysService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
