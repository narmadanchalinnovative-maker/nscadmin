import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';
import { Section, PaginatedResponse } from '@/types';
import {
  createDocument,
  getDocument,
  updateDocument,
  deleteDocument,
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
    const pageNum = Math.max(1, page);
    const pageSize = Math.min(limit, 100);
    const skipCount = (pageNum - 1) * pageSize;

    if (!db) {
      return { data: [], total: 0, page: pageNum, limit: pageSize, totalPages: 1 };
    }

    try {
      const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);

      let data = (snapshot?.docs || []).map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as (Section & { id: string })[];

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
        totalPages: Math.ceil(total / pageSize) || 1,
      };
    } catch (error) {
      console.error('Error fetching sections:', error);
      return { data: [], total: 0, page: pageNum, limit: pageSize, totalPages: 1 };
    }
  },

  async search(searchTerm: string, page = 1, limit = 10) {
    return searchDocuments<Section>(COLLECTION_NAME, 'title', searchTerm, page, limit);
  },
};
