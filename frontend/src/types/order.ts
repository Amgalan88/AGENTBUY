import { BaseEntity, Status } from './common';

export type MarketplaceApp = 'taobao' | 'pinduoduo' | '1688' | 'dewu';

export interface OrderItem {
  title: string;
  imageUrl?: string;
  images?: string[];
  sourceUrl?: string;
  quantity?: number;
  userNotes?: string;
  agentPrice?: number;
  agentCurrency?: string;
  agentTotal?: number;
  packageIndex?: number;
  app?: string;
}

export interface OrderComment {
  senderId: string;
  senderRole: 'user' | 'agent';
  message: string;
  attachments?: string[];
  createdAt: string | Date;
}

export interface OrderReport {
  items: OrderItem[];
  pricing: {
    productTotalCny?: number;
    domesticShippingCny?: number;
    serviceFeeCny?: number;
    otherFeesCny?: number;
    grandTotalCny?: number;
    exchangeRate?: number;
    grandTotalMnt?: number;
  };
  agentComment?: string;
  submittedAt?: string | Date;
}

export interface TrackingInfo {
  code?: string;
  carrierName?: string;
  lastStatus?: string;
  lastUpdatedAt?: string | Date;
}

export interface Cargo {
  _id: string;
  name: string;
  address?: string;
}

export interface Order extends BaseEntity {
  userId: string;
  agentId?: string;
  cargoId?: string | Cargo;
  customName?: string;
  status: Status;
  isPackage?: boolean;
  items: OrderItem[];
  userNote?: string;
  agentNote?: string;
  lock?: {
    lockedByAgentId?: string;
    lockedAt?: string | Date;
    expiresAt?: string | Date;
    extensionCount?: number;
  };
  pricing?: {
    productTotalCny?: number;
    domesticShippingCny?: number;
    serviceFeeCny?: number;
    otherFeesCny?: number;
    grandTotalCny?: number;
    exchangeRate?: number;
    grandTotalMnt?: number;
  };
  payment?: {
    status?: string;
    invoiceId?: string;
    paidAt?: string | Date;
    amountMnt?: number;
    method?: string;
    providerTxnId?: string;
    deadline?: string | Date;
  };
  tracking?: TrackingInfo | string;
  report?: OrderReport;
  comments?: OrderComment[];
  ratingByUser?: {
    score?: number;
    comment?: string;
  };
  ratingByAgent?: {
    score?: number;
    comment?: string;
  };
}

export interface OrderWithDetails extends Order {
  // Additional fields when populated
}

export interface OrderFilters {
  status?: Status;
  search?: string;
}

