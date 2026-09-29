import { z } from 'zod';

export const userRoleSchema = z.enum(['super_admin', 'admin', 'editor']);

export const statusSchema = z.enum(['active', 'inactive']);

export const adminUserSchema = z.object({
  uid: z.string(),
  email: z.string().email(),
  role: userRoleSchema,
  active: z.boolean(),
  permissions: z.array(z.string()),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const baseEntitySchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().min(1, 'Description is required').max(2000),
  status: statusSchema,
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  createdBy: z.string().optional(),
  updatedBy: z.string().optional(),
});

export const eventSchema = baseEntitySchema.extend({
  thumbnail: z.string().url().optional(),
});

export const batchSchema = baseEntitySchema.extend({
  thumbnail: z.string().url().optional().or(z.literal('')),
  language: z.string().optional(),
  mode: z.string().optional(),
  rating: z.string().optional(),
  startDate: z.string().optional(),
  duration: z.string().optional(),
  instructor: z.string().optional(),
  feature1Title: z.string().optional(),
  feature1Desc: z.string().optional(),
  feature2Title: z.string().optional(),
  feature2Desc: z.string().optional(),
  feature3Title: z.string().optional(),
  feature3Desc: z.string().optional(),
});

export const courseSchema = baseEntitySchema.extend({
  batchId: z.string().min(1, 'Batch is required'),
  price: z.number().min(0, 'Price must be 0 or more').optional().default(0),
  videoUrl: z.string().url().optional().or(z.literal('')),
  pdfUrl: z.string().url().optional().or(z.literal('')),
});

export const subjectSchema = baseEntitySchema.extend({
  courseId: z.string().min(1, 'Course is required'),
  order: z.number().optional(),
});

export const lectureSchema = baseEntitySchema.extend({
  courseId: z.string().min(1, 'Course is required'),
  subjectId: z.string().min(1, 'Subject is required'),
  chapterId: z.string().min(1, 'Chapter is required'),
  videoUrl: z.string().url().optional().or(z.literal('')),
  videoPath: z.string().optional().or(z.literal('')),
  order: z.number().optional(),
});

export const testSchema = baseEntitySchema.extend({
  batchId: z.string().min(1, 'Batch is required'),
  questions: z.array(z.any()).optional(),
});

export const sectionSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().max(2000).optional().or(z.literal('')),
  testId: z.string().min(1, 'Test is required'),
  order: z.number().optional(),
  status: statusSchema.default('active'),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const optionSchema = z.object({
  id: z.string().optional(),
  text: z.string().min(1),
  image: z.string().url().optional(),
});

export const questionSchema = baseEntitySchema.extend({
  testId: z.string().min(1, 'Test is required'),
  text: z.string().min(1, 'Question text is required'),
  options: z.array(optionSchema).min(2, 'At least two options required'),
  correctOptionIndex: z.number().int().optional(),
  correctOptionIndexes: z.array(z.number().int()).optional(),
  marks: z.number().optional().default(4),
  negativeMarks: z.number().optional().default(1),
  solution: z.string().max(5000).optional().or(z.literal('')),
});

export const appConfigSchema = z.object({
  key: z.string().min(1),
  value: z.unknown(),
});

// Form validation schemas
export const createEventFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().min(1, 'Description is required').max(2000),
  thumbnail: z.string().url('Invalid URL').optional().or(z.literal('')),
  status: statusSchema.default('active'),
});

export const createBatchFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().min(1, 'Description is required').max(2000),
  thumbnail: z.string().url('Invalid URL').optional().or(z.literal('')),
  examGoalId: z.string().min(1, 'Exam Goal is required'),
  examGoalLabel: z.string().optional(),
  status: statusSchema.default('active'),
});

export const createCourseFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  batchId: z.string().min(1, 'Batch is required'),
  description: z.string().min(1, 'Description is required').max(2000),
  price: z.number().min(0, 'Price must be 0 or more').optional().default(0),
  status: statusSchema.default('active'),
  videoUrl: z.string().url().optional().or(z.literal('')),
  pdfUrl: z.string().url().optional().or(z.literal('')),
});

export const createSubjectFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().min(1, 'Description is required').max(2000),
  courseId: z.string().optional(),
  status: statusSchema.default('active'),
});

export const createChapterFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().min(1, 'Description is required').max(2000),
  courseId: z.string().optional(),
  subjectId: z.string().optional(),
  status: statusSchema.default('active'),
});

export const createLectureFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().min(1, 'Description is required').max(2000),
  subjectId: z.string().optional().nullable(),
  courseId: z.string().optional().nullable(),
  chapterId: z.string().optional().nullable(),
  videoUrl: z.string().url('Invalid URL').optional().nullable().or(z.literal('')),
  videoUploadUrl: z.string().optional().nullable().or(z.literal('')),
  thumbnailUrl: z.string().url('Invalid URL').optional().nullable().or(z.literal('')),
  pdfUrl: z.string().url('Invalid URL').optional().nullable().or(z.literal('')),
  status: z.enum(['active', 'inactive']).optional().nullable().default('active'),
});

export const createTestFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  batchId: z.string().min(1, 'Batch is required'),
  description: z.string().min(1, 'Description is required').max(2000),
  status: statusSchema.default('active'),
});

export const liveClassSchema = baseEntitySchema.extend({
  startTime: z.date().optional(),
  duration: z.number().optional(),
  meetingUrl: z.string().url().optional().or(z.literal('')),
  instructor: z.string().optional().or(z.literal('')),
  courseId: z.string().optional().or(z.literal('')),
  batchId: z.string().optional().or(z.literal('')),
  isLive: z.boolean().optional(),
  recordingUrl: z.string().url().optional().or(z.literal('')),
});

export const createLiveClassFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().min(1, 'Description is required').max(2000),
  startTime: z.string().optional().or(z.literal('')),
  duration: z.number().optional(),
  instructor: z.string().optional().or(z.literal('')),
  courseId: z.string().optional().or(z.literal('')),
  batchId: z.string().optional().or(z.literal('')),
  status: statusSchema.default('active'),
});

export const examGoalSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1, 'Label is required'),
  order: z.number().optional().default(0),
});

export const createExamGoalFormSchema = z.object({
  label: z.string().min(1, 'Label is required'),
  order: z.number().optional().default(0),
});

export type AdminUserSchema = z.infer<typeof adminUserSchema>;
export type EventSchema = z.infer<typeof eventSchema>;
export type BatchSchema = z.infer<typeof batchSchema>;
export type CourseSchema = z.infer<typeof courseSchema>;
export type SubjectSchema = z.infer<typeof subjectSchema>;
export type LectureSchema = z.infer<typeof lectureSchema>;
export type TestSchema = z.infer<typeof testSchema>;
export type SectionSchema = z.infer<typeof sectionSchema>;
export type OptionSchema = z.infer<typeof optionSchema>;
export type QuestionSchema = z.infer<typeof questionSchema>;
export type CreateEventFormSchema = z.infer<typeof createEventFormSchema>;
export type CreateBatchFormSchema = z.infer<typeof createBatchFormSchema>;
export type CreateCourseFormSchema = z.infer<typeof createCourseFormSchema>;
export type CreateSubjectFormSchema = z.infer<typeof createSubjectFormSchema>;
export type CreateChapterFormSchema = z.infer<typeof createChapterFormSchema>;
export type CreateLectureFormSchema = z.infer<typeof createLectureFormSchema>;
export type CreateTestFormSchema = z.infer<typeof createTestFormSchema>;
export type CreateLiveClassFormSchema = z.infer<typeof createLiveClassFormSchema>;
export type ExamGoalSchema = z.infer<typeof examGoalSchema>;
export type CreateExamGoalFormSchema = z.infer<typeof createExamGoalFormSchema>;

export const testAttemptSchema = z.object({
  id: z.string().optional(),
  testId: z.string(),
  testTitle: z.string(),
  userId: z.string(),
  userName: z.string(),
  score: z.number(),
  totalMarks: z.number(),
  correctCount: z.number(),
  incorrectCount: z.number(),
  skippedCount: z.number(),
  totalQuestions: z.number(),
  submittedAt: z.any().optional(),
});

export type TestAttemptSchema = z.infer<typeof testAttemptSchema>;

