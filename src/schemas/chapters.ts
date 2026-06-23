import { z } from 'zod';

export const createChapterFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  status: z.enum(['active', 'inactive']).default('active'),
});

export type CreateChapterFormSchema = z.infer<typeof createChapterFormSchema>;
