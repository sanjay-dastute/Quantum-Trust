import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import * as crypto from 'crypto';

@Injectable()
export class ClientUserService {
  constructor(
    private readonly usersService: UsersService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async getStats(userId: string) {
    return {
      filesEncrypted: 42,
      activeKeys: 2,
      lastEncryptionTime: new Date().toISOString()
    };
  }

  async getLogs(userId: string, page: number, limit: number) {
    return this.auditLogsService.getLogsByUser(userId, page, limit);
  }

  async getActivity(userId: string) {
    return this.auditLogsService.getActivityTimelineByUser(userId);
  }

  async getSettings(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    return user.details?.settings || { theme: 'dark', language: 'en', field_preferences: [] };
  }

  async updateSettings(userId: string, settings: any) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    const newSettings = { ...(user.details?.settings || {}), ...settings };
    const details = { ...(user.details || {}), settings: newSettings };
    await this.usersService.updateUser(userId, { details });
    return newSettings;
  }

  async saveSupportTicket(userId: string, payload: any) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    const tickets = user.details?.tickets || [];
    const newTicket = { id: crypto.randomUUID(), ...payload, status: 'Open', date: new Date().toISOString() };
    tickets.push(newTicket);
    const details = { ...(user.details || {}), tickets };
    await this.usersService.updateUser(userId, { details });
    return newTicket;
  }

  async getKeys(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    return user.details?.keys || [
      { id: `k-user-${crypto.randomUUID().slice(0,6)}`, type: 'AES-256-GCM', status: 'Active', created: new Date().toISOString() }
    ];
  }
}
