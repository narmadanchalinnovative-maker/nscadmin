import { Test } from '@/types';
import { doc } from 'firebase/firestore';
import {
  createDocument,
  getDocument,
  updateDocument,
  deleteDocument,
  setBatchChildDocument,
  deleteBatchChildDocument,
  toggleStatus,
  listDocuments,
  searchDocuments,
  findDocumentInCollectionGroup,
} from '../firestore-service';
import { db } from '../firebase';

const COLLECTION_NAME = 'tests';

async function findTestDocRef(id: string) {
  const directRef = doc(db, COLLECTION_NAME, id);
  const directSnap = await getDocument<Test>(COLLECTION_NAME, id);
  if (directSnap) {
    return { id, ref: directRef, data: directSnap };
  }

  const foundInGroup = await findDocumentInCollectionGroup<Test>(COLLECTION_NAME, id);
  if (!foundInGroup) return null;

  return {
    id: foundInGroup.id,
    ref: foundInGroup.ref,
    data: foundInGroup as Test & { id: string },
  };
}

export const testService = {
  async create(data: Omit<Test, 'id'>, userId: string) {
    const id = await createDocument<Test>(COLLECTION_NAME, data, userId);
    const savedTest = await getDocument<Test>(COLLECTION_NAME, id);
    if (savedTest) {
      await setBatchChildDocument(COLLECTION_NAME, id, savedTest);
    }
    return id;
  },

  async get(id: string) {
    const found = await findTestDocRef(id);
    return found?.data ?? null;
  },

  async update(id: string, data: Partial<Test>, userId: string, existingTest?: Test | null) {
    const located = existingTest
      ? { data: existingTest, ref: doc(db, COLLECTION_NAME, id) }
      : await findTestDocRef(id);
    const currentTest = located?.data ?? null;
    if (!currentTest) {
      throw new Error('Test not found');
    }

    const mergedTest = {
      ...currentTest,
      ...data,
    } as Test;

    await updateDocument<Test>(COLLECTION_NAME, id, mergedTest, userId);
    const updatedTest = await findTestDocRef(id);
    if (updatedTest) {
      await setBatchChildDocument(COLLECTION_NAME, id, updatedTest.data);
      if (currentTest?.batchId && currentTest.batchId !== updatedTest.data.batchId) {
        await deleteBatchChildDocument(COLLECTION_NAME, currentTest.batchId, id);
      }
    }
  },

  async delete(id: string) {
    const existingTest = await findTestDocRef(id);
    if (existingTest?.data.batchId) {
      await deleteBatchChildDocument(COLLECTION_NAME, existingTest.data.batchId, id);
    }
    return deleteDocument(COLLECTION_NAME, id);
  },

  async toggleStatus(id: string, currentStatus: 'active' | 'inactive', userId: string) {
    await toggleStatus(COLLECTION_NAME, id, currentStatus, userId);
    const updatedTest = await findTestDocRef(id);
    if (updatedTest) {
      await setBatchChildDocument(COLLECTION_NAME, id, updatedTest.data);
    }
  },

  async list(page = 1, limit = 10, filters?: Record<string, any>) {
    return listDocuments<Test>(
      COLLECTION_NAME,
      page,
      limit,
      filters,
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
