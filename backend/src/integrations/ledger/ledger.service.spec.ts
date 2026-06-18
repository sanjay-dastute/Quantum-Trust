import { Test, TestingModule } from '@nestjs/testing';
import { LedgerService } from './ledger.service';
import { getModelToken } from '@nestjs/mongoose';
import { AuditLog } from '../../entities/audit-log.schema';

describe('LedgerService', () => {
  let service: LedgerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LedgerService,
        { provide: getModelToken(AuditLog.name), useValue: {} },
      ],
    }).compile();

    service = module.get<LedgerService>(LedgerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
