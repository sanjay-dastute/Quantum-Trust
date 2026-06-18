import { Test, TestingModule } from '@nestjs/testing';
import { AuditLogsService } from './audit-logs.service';
import { getModelToken } from '@nestjs/mongoose';
import { AuditLog } from '../entities/audit-log.schema';
import { LedgerService } from '../integrations/ledger/ledger.service';
import { MetricsService } from '../metrics/metrics.service';

describe('AuditLogsService', () => {
  let service: AuditLogsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLogsService,
        { provide: getModelToken(AuditLog.name), useValue: {} },
        { provide: LedgerService, useValue: {} },
        { provide: MetricsService, useValue: {} },
      ],
    }).compile();

    service = module.get<AuditLogsService>(AuditLogsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
