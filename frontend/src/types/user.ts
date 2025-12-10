import { BaseEntity } from './common';

export type UserRole = 'user' | 'agent' | 'admin';

export interface User extends BaseEntity {
  phone: string;
  email?: string;
  fullName: string;
  avatarUrl?: string;
  roles: UserRole[];
  defaultCargoId?: string;
  cardBalance?: number;
  cardProgress?: number;
  completedOrdersCount?: number;
  isActive: boolean;
  lastLoginAt?: string | Date;
}

