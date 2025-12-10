import type { User } from './user';

export interface LoginPayload {
  phone: string;
  password: string;
  remember?: boolean;
}

export interface RegisterPayload {
  phone: string;
  password: string;
  fullName: string;
  email?: string;
  secretQuestion: string;
  secretAnswer: string;
  role?: 'user' | 'agent';
}

export interface AuthResponse {
  user: User;
  token?: string;
}

