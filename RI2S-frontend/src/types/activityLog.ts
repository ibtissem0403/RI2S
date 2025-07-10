// src/types/activityLog.ts

export type ActivityAction = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'EXPORT';

export type EntityType = 'WeakSignal' | 'Beneficiary' | 'ClinicalData' | 'User' | 'System';

export interface User {
  _id: string;
  fullName: string;
  email: string;
}

export interface ActivityLog {
  _id: string;
  user: User;
  action: ActivityAction;
  entityType: EntityType;
  entityId?: string;
  description: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLogResponse {
  total: number;
  page: number;
  totalPages: number;
  limit: number;
  data: ActivityLog[];
}

export interface ActivitySummaryPeriod {
  start: string;
  end: string;
}

export interface ActivityCountStat {
  _id: string;
  count: number;
}

export interface UserActivityStat {
  user: {
    fullName: string;
    email: string;
  };
  count: number;
}

export interface DailyActivityStat {
  date: string;
  count: number;
}

export interface ActivitySummary {
  period: ActivitySummaryPeriod;
  byAction: ActivityCountStat[];
  byEntity: ActivityCountStat[];
  byUser: UserActivityStat[];
  byDay: DailyActivityStat[];
  total: number;
}