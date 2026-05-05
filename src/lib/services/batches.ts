import { Batch } from '@/types';
import {
  createDocument,
  getDocument,
  updateDocument,
  deleteDocument,
  toggleStatus,
  listDocuments,
  searchDocuments,
} from '../firestore-service';

const COLLECTION_NAME = 'batches';

export const batchService = {
  async create(data: Omit<Batch, 'id'>, userId: string) {
    return createDocument<Batch>(COLLECTION_NAME, data, userId);
  },

  async get(id: string) {
    return getDocument<Batch>(COLLECTION_NAME, id);
  },

  async update(id: string, data: Partial<Batch>, userId: string) {
    return updateDocument<Batch>(COLLECTION_NAME, id, data, userId);
  },

  async delete(id: string) {
    return deleteDocument(COLLECTION_NAME, id);
  },

  async toggleStatus(id: string, currentStatus: 'active' | 'inactive', userId: string) {
    return toggleStatus(COLLECTION_NAME, id, currentStatus, userId);
  },

  async list(page = 1, limit = 10, filters?: Record<string, any>) {
    return listDocuments<Batch>(
      COLLECTION_NAME,
      page,
      limit,
      filters,
      'createdAt',
      'desc'
    );
  },

  async search(searchTerm: string, page = 1, limit = 10) {
    return searchDocuments<Batch>(COLLECTION_NAME, 'title', searchTerm, page, limit);
  },
};
