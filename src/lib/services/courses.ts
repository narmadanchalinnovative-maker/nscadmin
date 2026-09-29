import { Course } from '@/types';
import {
  createDocument,
  getDocument,
  updateDocument,
  deleteDocument,
  toggleStatus,
  listDocuments,
  searchDocuments,
} from '../firestore-service';

const COLLECTION_NAME = 'courses';

export const courseService = {
  async create(data: Omit<Course, 'id'>, userId: string) {
    const id = await createDocument<Course>(COLLECTION_NAME, data, userId);
    return id;
  },

  async get(id: string) {
    return getDocument<Course>(COLLECTION_NAME, id);
  },

  async update(id: string, data: Partial<Course>, userId: string) {
    await updateDocument<Course>(COLLECTION_NAME, id, data, userId);
  },

  async delete(id: string) {
    return deleteDocument(COLLECTION_NAME, id);
  },

  async toggleStatus(id: string, currentStatus: 'active' | 'inactive', userId: string) {
    await toggleStatus(COLLECTION_NAME, id, currentStatus, userId);
  },

  async list(page = 1, limit = 10, filters?: any) {
    return listDocuments<Course>(
      COLLECTION_NAME,
      page,
      limit,
      filters as any,
      'createdAt',
      'desc'
    );
  },

  async search(searchTerm: string, page = 1, limit = 10) {
    return searchDocuments<Course>(COLLECTION_NAME, 'title', searchTerm, page, limit);
  },
};
