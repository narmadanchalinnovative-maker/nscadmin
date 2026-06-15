import { ExamGoal } from '@/types';
import {
  createDocument,
  getDocument,
  updateDocument,
  deleteDocument,
  listDocuments,
  toggleStatus,
} from '../firestore-service';

const COLLECTION_NAME = 'app_pages/_change-exam-goal/options';

export const examGoalService = {
  async create(data: Omit<ExamGoal, 'id'>, userId: string) {
    return createDocument<ExamGoal>(COLLECTION_NAME, data, userId);
  },

  async get(id: string) {
    return getDocument<ExamGoal>(COLLECTION_NAME, id);
  },

  async update(id: string, data: Partial<ExamGoal>, userId: string) {
    return updateDocument<ExamGoal>(COLLECTION_NAME, id, data, userId);
  },

  async delete(id: string) {
    return deleteDocument(COLLECTION_NAME, id);
  },

  async toggleStatus(id: string, currentStatus: 'active' | 'inactive', userId: string) {
    return toggleStatus(COLLECTION_NAME, id, currentStatus, userId);
  },

  async list(page = 1, limit = 10, filters?: Record<string, any>) {
    return listDocuments<ExamGoal>(
      COLLECTION_NAME,
      page,
      limit,
      filters,
      'order',
      'asc'
    );
  },
};
