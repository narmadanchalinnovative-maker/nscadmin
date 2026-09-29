import { Event } from '@/types';
import {
  createDocument,
  getDocument,
  updateDocument,
  deleteDocument,
  toggleStatus,
  listDocuments,
  searchDocuments,
} from '../firestore-service';

const COLLECTION_NAME = 'events';

export const eventService = {
  async create(data: Omit<Event, 'id'>, userId: string) {
    return createDocument<Event>(COLLECTION_NAME, data, userId);
  },

  async get(id: string) {
    return getDocument<Event>(COLLECTION_NAME, id);
  },

  async update(id: string, data: Partial<Event>, userId: string) {
    return updateDocument<Event>(COLLECTION_NAME, id, data, userId);
  },

  async delete(id: string) {
    return deleteDocument(COLLECTION_NAME, id);
  },

  async toggleStatus(id: string, currentStatus: 'active' | 'inactive', userId: string) {
    return toggleStatus(COLLECTION_NAME, id, currentStatus, userId);
  },

  async list(page = 1, limit = 10, filters?: any) {
    return listDocuments<Event>(
      COLLECTION_NAME,
      page,
      limit,
      filters as any,
      'createdAt',
      'desc'
    );
  },

  async search(searchTerm: string, page = 1, limit = 10) {
    return searchDocuments<Event>(COLLECTION_NAME, 'title', searchTerm, page, limit);
  },
};
