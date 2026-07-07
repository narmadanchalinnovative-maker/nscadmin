import { Chapter } from '@/types';
import {
  createDocument,
  getDocument,
  updateDocument,
  deleteDocument,
  listDocuments,
} from '../firestore-service';

const COLLECTION_NAME = 'chapters';

export const chapterService = {
  async list(page = 1, pageSize = 100, subjectId?: string) {
    const filters = subjectId ? { subjectId } : undefined;
    return listDocuments<Chapter>(
      COLLECTION_NAME,
      page,
      pageSize,
      filters,
      null, // bypass firestore index
      'desc'
    );
  },

  async get(id: string) {
    return getDocument<Chapter>(COLLECTION_NAME, id);
  },

  async create(data: Omit<Chapter, 'id'>, adminUid: string) {
    return createDocument<Chapter>(COLLECTION_NAME, data, adminUid);
  },

  async update(id: string, data: Partial<Chapter>, adminUid: string) {
    return updateDocument<Chapter>(COLLECTION_NAME, id, data, adminUid);
  },

  async delete(id: string) {
    return deleteDocument(COLLECTION_NAME, id);
  }
};
