import { Test, TestingModule } from '@nestjs/testing';
import { OrgService } from './org.service';
import { UsersService } from '../users/users.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { CryptoService } from '../crypto/crypto.service';
import { LedgerService } from '../integrations/ledger/ledger.service';
import { StorageService } from '../integrations/storage/storage.service';
import { HsmService } from '../hsm/hsm.service';

describe('OrgService', () => {
  let service: OrgService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrgService,
        { provide: UsersService, useValue: {} },
        { provide: AuditLogsService, useValue: {} },
        { provide: CryptoService, useValue: {} },
        { provide: LedgerService, useValue: {} },
        { provide: StorageService, useValue: {} },
        { provide: HsmService, useValue: {} },
      ],
    }).compile();

    service = module.get<OrgService>(OrgService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
