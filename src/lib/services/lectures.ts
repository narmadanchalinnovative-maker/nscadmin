import { Lecture } from '@/types';
import {
  createDocument,
  getDocument,
  updateDocument,
  deleteDocument,
  toggleStatus,
  listDocuments,
  searchDocuments,
} from '../firestore-service';

const COLLECTION_NAME = 'lectures';

export const lectureService = {
  async create(data: Omit<Lecture, 'id'>, userId: string) {
    return createDocument<Lecture>(COLLECTION_NAME, data, userId);
  },

  async get(id: string) {
    return getDocument<Lecture>(COLLECTION_NAME, id);
  },

  async update(id: string, data: Partial<Lecture>, userId: string) {
    return updateDocument<Lecture>(COLLECTION_NAME, id, data, userId);
  },

  async delete(id: string) {
    return deleteDocument(COLLECTION_NAME, id);
  },

  async toggleStatus(id: string, currentStatus: 'active' | 'inactive', userId: string) {
    return toggleStatus(COLLECTION_NAME, id, currentStatus, userId);
  },

  async list(page = 1, limit = 10, filters?: Record<string, unknown>) {
    return listDocuments<Lecture>(
      COLLECTION_NAME,
      page,
      limit,
      filters,
      'createdAt',
      'asc' // Lectures should ideally be ordered chronologically or by order field
    );
  },

  async listByChapter(chapterId: string, page = 1, limit = 100) {
    return listDocuments<Lecture>(
      COLLECTION_NAME,
      page,
      limit,
      { chapterId },
      null, // Bypass firestore index
      'asc'
    );
  },

  async search(searchTerm: string, page = 1, limit = 10) {
    return searchDocuments<Lecture>(COLLECTION_NAME, 'title', searchTerm, page, limit);
  },
};
