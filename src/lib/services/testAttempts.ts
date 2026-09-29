import { TestAttempt } from '@/types';
import {
  getDocument,
  deleteDocument,
  listDocuments,
  searchDocuments,
} from '../firestore-service';

const COLLECTION_NAME = 'test_attempts';

export const testAttemptService = {
  async get(id: string) {
    return getDocument<TestAttempt>(COLLECTION_NAME, id);
  },

  async delete(id: string) {
    return deleteDocument(COLLECTION_NAME, id);
  },

  async list(page = 1, limit = 10, filters?: any) {
    return listDocuments<TestAttempt>(
      COLLECTION_NAME,
      page,
      limit,
      filters as any,
      'submittedAt',
      'desc'
    );
  },

  async search(searchTerm: string, page = 1, limit = 10) {
    return searchDocuments<TestAttempt>(COLLECTION_NAME, 'userName', searchTerm, page, limit);
  },
};
