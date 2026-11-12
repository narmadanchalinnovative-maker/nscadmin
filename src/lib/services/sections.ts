import { Section, PaginatedResponse } from '@/types';
import {
  createDocument,
  getDocument,
  updateDocument,
  deleteDocument,
  listDocuments,
  searchDocuments,
} from '../firestore-service';

const COLLECTION_NAME = 'sections';

export const sectionService = {
  async create(data: Omit<Section, 'id'>, userId: string) {
    const id = await createDocument<Section>(COLLECTION_NAME, data, userId);
    return id;
  },

  async get(id: string) {
    return getDocument<Section>(COLLECTION_NAME, id);
  },

  async update(id: string, data: Partial<Section>, userId: string) {
    return updateDocument<Section>(COLLECTION_NAME, id, data, userId);
  },

  async delete(id: string) {
    return deleteDocument(COLLECTION_NAME, id);
  },

  async list(page = 1, limit = 10, filters?: any): Promise<PaginatedResponse<Section & { id: string }>> {
    return listDocuments<Section>(COLLECTION_NAME, page, limit, filters);
  },

  async search(searchTerm: string, page = 1, limit = 10) {
    return searchDocuments<Section>(COLLECTION_NAME, 'title', searchTerm, page, limit);
  },
};
