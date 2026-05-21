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

export const batchSchema = baseEntitySchema;

export const courseSchema = baseEntitySchema;

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
  status: statusSchema.default('active'),
});

export const createCourseFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().min(1, 'Description is required').max(2000),
  status: statusSchema.default('active'),
});

export const createTestFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  batchId: z.string().min(1, 'Batch is required'),
  description: z.string().min(1, 'Description is required').max(2000),
  status: statusSchema.default('active'),
});

export type AdminUserSchema = z.infer<typeof adminUserSchema>;
export type EventSchema = z.infer<typeof eventSchema>;
export type BatchSchema = z.infer<typeof batchSchema>;
export type CourseSchema = z.infer<typeof courseSchema>;
export type TestSchema = z.infer<typeof testSchema>;
export type SectionSchema = z.infer<typeof sectionSchema>;
export type OptionSchema = z.infer<typeof optionSchema>;
export type QuestionSchema = z.infer<typeof questionSchema>;
export type CreateEventFormSchema = z.infer<typeof createEventFormSchema>;
export type CreateBatchFormSchema = z.infer<typeof createBatchFormSchema>;
export type CreateCourseFormSchema = z.infer<typeof createCourseFormSchema>;
export type CreateTestFormSchema = z.infer<typeof createTestFormSchema>;
