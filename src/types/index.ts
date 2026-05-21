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

export type Batch = BaseEntity;

export interface Course extends BaseEntity {
  batchId: string;
}

export interface Test extends BaseEntity {
  batchId: string;
  questions?: Question[];
}

export interface Section extends BaseEntity {
  testId: string;
  order?: number;
}

export interface Option {
  id?: string;
  text: string;
  image?: string;
}

export interface Question extends BaseEntity {
  id?: string;
  testId: string;
  text: string;
  options: Option[];
  correctOptionIndex?: number;
  correctOptionIndexes?: number[];
  marks?: number;
  negativeMarks?: number;
  solution?: string;
}

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
