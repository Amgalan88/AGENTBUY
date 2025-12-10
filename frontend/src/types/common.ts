// Common types used across the application

export interface BaseEntity {
  _id: string;
  createdAt: string;
  updatedAt: string;
}

export type Status =
  | 'DRAFT'
  | 'PUBLISHED'
  | 'AGENT_LOCKED'
  | 'AGENT_RESEARCHING'
  | 'REPORT_SUBMITTED'
  | 'WAITING_USER_REVIEW'
  | 'USER_REJECTED'
  | 'WAITING_PAYMENT'
  | 'PAYMENT_CONFIRMED'
  | 'ORDER_PLACED'
  | 'CARGO_IN_TRANSIT'
  | 'ARRIVED_AT_CARGO'
  | 'COMPLETED'
  | 'CANCELLED_BY_USER'
  | 'CANCELLED_BY_ADMIN'
  | 'CANCELLED_NO_AGENT'
  | 'PAYMENT_EXPIRED';

export interface StatusConfig {
  label: string;
  color: string;
}

export type Theme = 'light' | 'dark';
export type View = 'mobile' | 'tablet' | 'desktop';

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface ApiError extends Error {
  status?: number;
}

