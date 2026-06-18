import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class NotificationsService {
  async getNotifications(userId: string, role: string) {
    const notifications = [
      { id: crypto.randomUUID(), message: 'System maintenance scheduled for tonight at 2 AM', type: 'info', read: false, date: new Date().toISOString() },
    ];
    if (role === 'admin') {
      notifications.push({ id: crypto.randomUUID(), message: 'New user registration pending approval', type: 'warning', read: false, date: new Date().toISOString() });
    }
    return notifications;
  }
}
