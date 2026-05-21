import { Course } from '@/types';
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
} from '../firestore-service';

const COLLECTION_NAME = 'courses';

export const courseService = {
  async create(data: Omit<Course, 'id'>, userId: string) {
    const id = await createDocument<Course>(COLLECTION_NAME, data, userId);
    const savedCourse = await getDocument<Course>(COLLECTION_NAME, id);
    if (savedCourse) {
      await setBatchChildDocument(COLLECTION_NAME, id, savedCourse);
    }
    return id;
  },

  async get(id: string) {
    return getDocument<Course>(COLLECTION_NAME, id);
  },

  async update(id: string, data: Partial<Course>, userId: string) {
    const existingCourse = await getDocument<Course>(COLLECTION_NAME, id);
    await updateDocument<Course>(COLLECTION_NAME, id, data, userId);
    const updatedCourse = await getDocument<Course>(COLLECTION_NAME, id);
    if (updatedCourse) {
      await setBatchChildDocument(COLLECTION_NAME, id, updatedCourse);
      if (existingCourse?.batchId && existingCourse.batchId !== updatedCourse.batchId) {
        await deleteBatchChildDocument(COLLECTION_NAME, existingCourse.batchId, id);
      }
    }
  },

  async delete(id: string) {
    const existingCourse = await getDocument<Course>(COLLECTION_NAME, id);
    if (existingCourse?.batchId) {
      await deleteBatchChildDocument(COLLECTION_NAME, existingCourse.batchId, id);
    }
    return deleteDocument(COLLECTION_NAME, id);
  },

  async toggleStatus(id: string, currentStatus: 'active' | 'inactive', userId: string) {
    await toggleStatus(COLLECTION_NAME, id, currentStatus, userId);
    const updatedCourse = await getDocument<Course>(COLLECTION_NAME, id);
    if (updatedCourse) {
      await setBatchChildDocument(COLLECTION_NAME, id, updatedCourse);
    }
  },

  async list(page = 1, limit = 10, filters?: Record<string, unknown>) {
    return listDocuments<Course>(
      COLLECTION_NAME,
      page,
      limit,
      filters,
      'createdAt',
      'desc'
    );
  },

  async search(searchTerm: string, page = 1, limit = 10) {
    return searchDocuments<Course>(COLLECTION_NAME, 'title', searchTerm, page, limit);
  },
};
