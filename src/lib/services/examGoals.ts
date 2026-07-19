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

  async listAll() {
    try {
      const db = (await import('../firebase')).db;
      const collectionRef = (await import('firebase/firestore')).collection(db, COLLECTION_NAME);
      const q = (await import('firebase/firestore')).query(
        collectionRef
      );
      const snapshot = await (await import('firebase/firestore')).getDocs(q);
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as (ExamGoal & { id: string })[];
      
      return docs
        .filter(doc => doc.status !== 'inactive')
        .sort((a, b) => (a.order || 0) - (b.order || 0));
    } catch (error) {
      console.error('Error fetching all exam goals:', error);
      return [];
    }
  },
};
