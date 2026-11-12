import { Question, PaginatedResponse } from '@/types';
import {
  createDocument,
  getDocument,
  updateDocument,
  deleteDocument,
  listDocuments,
  searchDocuments,
} from '../firestore-service';

const COLLECTION_NAME = 'questions';

export const questionService = {
  async create(data: Omit<Question, 'id'>, userId: string) {
    const id = await createDocument<Question>(COLLECTION_NAME, data, userId);
    return id;
  },

  async get(id: string) {
    return getDocument<Question>(COLLECTION_NAME, id);
  },

  async update(id: string, data: Partial<Question>, userId: string) {
    return updateDocument<Question>(COLLECTION_NAME, id, data, userId);
  },

  async delete(id: string) {
    return deleteDocument(COLLECTION_NAME, id);
  },

  async list(page = 1, limit = 10, filters?: any): Promise<PaginatedResponse<Question & { id: string }>> {
    return listDocuments<Question>(COLLECTION_NAME, page, limit, filters);
  },

  async search(searchTerm: string, page = 1, limit = 10) {
    return searchDocuments<Question>(COLLECTION_NAME, 'text', searchTerm, page, limit);
  },
};
