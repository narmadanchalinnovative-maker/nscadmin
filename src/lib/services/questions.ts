import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';
import { Question, PaginatedResponse } from '@/types';
import {
  createDocument,
  getDocument,
  updateDocument,
  deleteDocument,
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

  async list(page = 1, limit = 10, filters?: Record<string, unknown>): Promise<PaginatedResponse<Question & { id: string }>> {
    const pageNum = Math.max(1, page);
    const pageSize = Math.min(limit, 100);
    const skipCount = (pageNum - 1) * pageSize;

    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    let data = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    })) as (Question & { id: string })[];

    if (filters) {
      data = data.filter((item) =>
        Object.entries(filters).every(([key, value]) => {
          if (value === undefined || value === null) return true;
          const record = item as unknown as Record<string, unknown>;
          return record[key] === value;
        })
      );
    }

    const total = data.length;
    const paginated = data.slice(skipCount, skipCount + pageSize);

    return {
      data: paginated,
      total,
      page: pageNum,
      limit: pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  },

  async search(searchTerm: string, page = 1, limit = 10) {
    return searchDocuments<Question>(COLLECTION_NAME, 'text', searchTerm, page, limit);
  },
};
