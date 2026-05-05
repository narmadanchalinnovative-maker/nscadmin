export type UserRole = 'super_admin' | 'admin' | 'editor';

export interface AdminUser {
  uid: string;
  email: string;
  role: UserRole;
  active: boolean;
  permissions: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BaseEntity {
  id?: string;
  title: string;
  description: string;
  status: 'active' | 'inactive';
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
}

export interface Event extends BaseEntity {
  thumbnail?: string;
}

export interface Batch extends BaseEntity {}

export interface Course extends BaseEntity {}

export interface Test extends BaseEntity {}

export interface AppConfig {
  key: string;
  value: unknown;
}

export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
  filters?: Record<string, unknown>;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
