import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { UsersService } from '../../users/users.service';
import { AuditLogsService } from '../../audit-logs/audit-logs.service';
import { LedgerService } from '../../integrations/ledger/ledger.service';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class ApiKeyAuthMiddleware implements NestMiddleware {
  constructor(
    private readonly usersService: UsersService,
    private readonly auditLogsService: AuditLogsService,
    private readonly ledgerService: LedgerService
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const apiKey = req.headers['x-api-key'] as string;
    const orgApiKey = req.headers['x-org-api-key'] as string;

    const throwAndLog = async (orgId?: string, sub?: string, username?: string) => {
      if (orgId) {
        await this.auditLogsService.logEvent({
          user_id: sub || 'UNKNOWN',
          organisation_id: orgId,
          username: username || 'API_USER',
          action: 'Suspicious API Activity',
          details: `Failed dual authentication from IP: ${req.ip}`,
          ip_address: req.ip,
          mac_address: 'UNKNOWN',
          breach_flag: false
        });
        
        // Log to Fabric (AC-5.07)
        await this.ledgerService.logApiKeyOperation(orgId, 'UNKNOWN', req.ip || 'UNKNOWN', 'FAILED_USAGE');
      }
      throw new ForbiddenException('Dual authentication failed');
    };

    if (!apiKey || !orgApiKey) {
      return throwAndLog();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return throwAndLog();
    }

    const token = authHeader.split(' ')[1];
    let decoded: any;
    try {
      decoded = jwt.decode(token);
    } catch (e) {
      return throwAndLog();
    }

    const orgId = decoded?.organisation_id;
    if (!orgId) {
      return throwAndLog();
    }

    const isValid = await this.usersService.validateApiKeys(orgId, apiKey, orgApiKey);

    if (!isValid) {
      return throwAndLog(orgId, decoded.sub, decoded.username);
    }

    // Success -> Log to Fabric (AC-5.07)
    await this.ledgerService.logApiKeyOperation(orgId, 'UNKNOWN', req.ip || 'UNKNOWN', 'SUCCESSFUL_USAGE');

    next();
  }
}
