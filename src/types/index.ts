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
  price?: number;
  status: 'active' | 'inactive';
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
}

export interface Event extends BaseEntity {
  thumbnail?: string;
}

export interface LiveClass extends Omit<BaseEntity, 'status'> {
  status?: 'active' | 'inactive' | 'live' | 'completed';
  startTime?: Date;
  duration?: number; // in minutes
  meetingUrl?: string;
  instructor?: string;
  courseId?: string;
  batchId?: string;
  sessionType?: string;
  zoomMeetingId?: string;
  zoomPassword?: string;
  isLive?: boolean;
  recordingUrl?: string;
}

export interface Batch extends BaseEntity {
  thumbnail?: string;
  examGoalId?: string;
  examGoalLabel?: string;
}

export interface Course extends BaseEntity {
  batchId: string;
  videoUrl?: string;
  pdfUrl?: string;
}

export interface Subject extends BaseEntity {
  courseId: string;
  order?: number;
}

export interface Chapter extends BaseEntity {
  courseId: string;
  subjectId: string;
  order?: number;
}

export interface Lecture extends BaseEntity {
  courseId: string;
  subjectId: string;
  chapterId: string;
  videoUrl: string;
  videoPath?: string;
  videoProcessingStatus?: 'PROCESSING' | 'COMPLETED' | 'ERROR' | 'QUEUED';
  pdfUrl?: string;
  order?: number;
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

export interface ExamGoal {
  id: string;
  label: string;
  order: number;
  status?: 'active' | 'inactive';
}

export interface TestAttempt {
  id?: string;
  testId: string;
  testTitle: string;
  userId: string;
  userName: string;
  userPhone?: string;
  score: number;
  totalMarks: number;
  correctCount: number;
  incorrectCount: number;
  skippedCount: number;
  totalQuestions: number;
  timeTaken?: string;
  percentile?: number;
  submittedAt?: any;
}

export interface PremiumTest extends BaseEntity {
  isPremium?: boolean;
  price?: number;
  originalPrice?: number;
  discount?: string;
  examGoalId?: string;
  examGoal?: string;
  duration?: number;
  totalMarks?: number;
  totalQuestions?: number;
  validity?: string;
  language?: string;
  isDemoAvailable?: boolean;
  demoTestId?: string;
  features?: string[];
  batchId?: string;
  questions?: Question[];
}

export interface PremiumPurchase {
  id: string;
  userId?: string;
  userName: string;
  userPhone: string;
  userEmail?: string;
  testId: string;
  testTitle: string;
  examGoal?: string;
  amountPaid: number;
  originalPrice?: number;
  discountApplied?: number;
  couponCode?: string;
  paymentId?: string;
  orderId?: string;
  status: string;
  purchaseDate?: any;
  createdAt?: any;
}

export interface PremiumBanner {
  id?: string;
  title: string;
  subtitle?: string;
  mediaType: 'image' | 'video' | 'gif';
  imageUrl?: string;
  videoUrl?: string;
  gifUrl?: string;
  examGoal?: string;
  badgeText?: string;
  order?: number;
  status: 'active' | 'inactive';
  createdAt?: any;
}

export interface PremiumCoupon {
  id?: string;
  code: string;
  description?: string;
  discountType: 'PERCENT' | 'FLAT';
  discountValue: number;
  maxDiscount?: number;
  testId?: string;
  testTitle?: string;
  examGoal?: string;
  minOrderAmount?: number;
  expiresAt?: string;
  isActive: boolean;
  usedCount?: number;
  createdAt?: any;
}


