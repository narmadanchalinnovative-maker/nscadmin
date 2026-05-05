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
    return createDocument<Test>(COLLECTION_NAME, data, userId);
  },

  async get(id: string) {
    return getDocument<Test>(COLLECTION_NAME, id);
  },

  async update(id: string, data: Partial<Test>, userId: string) {
    return updateDocument<Test>(COLLECTION_NAME, id, data, userId);
  },

  async delete(id: string) {
    return deleteDocument(COLLECTION_NAME, id);
  },

  async toggleStatus(id: string, currentStatus: 'active' | 'inactive', userId: string) {
    return toggleStatus(COLLECTION_NAME, id, currentStatus, userId);
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
};
