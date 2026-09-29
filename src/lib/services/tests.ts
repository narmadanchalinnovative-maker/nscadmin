import { Test } from '@/types';
import {
  createDocument,
  getDocument,
  updateDocument,
  deleteDocument,
  toggleStatus,
  listDocuments,
  searchDocuments,
} from '../firestore-service';

const COLLECTION_NAME = 'tests';

export const testService = {
  async create(data: Omit<Test, 'id'>, userId: string) {
    const id = await createDocument<Test>(COLLECTION_NAME, data, userId);
    return id;
  },

  async get(id: string) {
    return getDocument<Test>(COLLECTION_NAME, id);
  },

  async update(id: string, data: Partial<Test>, userId: string, existingTest?: Test | null) {
    const currentTest = existingTest || await getDocument<Test>(COLLECTION_NAME, id);
    if (!currentTest) {
      throw new Error('Test not found');
    }

    const mergedTest = {
      ...currentTest,
      ...data,
    } as Test;

    await updateDocument<Test>(COLLECTION_NAME, id, mergedTest, userId);
  },

  async delete(id: string) {
    return deleteDocument(COLLECTION_NAME, id);
  },

  async toggleStatus(id: string, currentStatus: 'active' | 'inactive', userId: string) {
    await toggleStatus(COLLECTION_NAME, id, currentStatus, userId);
  },

  async list(page = 1, limit = 10, filters?: any) {
    return listDocuments<Test>(
      COLLECTION_NAME,
      page,
      limit,
      filters as any,
      'createdAt',
      'desc'
    );
  },

  async search(searchTerm: string, page = 1, limit = 10) {
    return searchDocuments<Test>(COLLECTION_NAME, 'title', searchTerm, page, limit);
  },

  async createWithBulkQuestions(
    testData: Omit<Test, 'id'>,
    questions: Array<{
      text: string;
      options: Array<{ text: string; image?: string }>;
      correctOptionIndex?: number;
      marks?: number;
      negativeMarks?: number;
      solution?: string;
    }>,
    userId: string
  ) {
    // Create the test
    const testId = await this.create(testData, userId);

    // Import question service
    const { questionService } = await import('./questions');

    // Create all questions
    const createdQuestionIds: string[] = [];
    for (const question of questions) {
      try {
        const questionId = await questionService.create({
          text: question.text,
          testId,
          status: 'active',
          options: question.options,
          correctOptionIndex: question.correctOptionIndex,
          marks: question.marks || 4,
          negativeMarks: question.negativeMarks || 1,
          solution: question.solution,
        } as any, userId);
        createdQuestionIds.push(questionId);
      } catch (error) {
        console.error('Failed to create question:', error);
        throw new Error(`Failed to create question: ${error}`);
      }
    }

    return { testId, createdQuestionIds };
  },
};
