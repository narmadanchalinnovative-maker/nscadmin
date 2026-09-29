import { LiveClass } from '@/types';
import {
  createDocument,
  getDocument,
  updateDocument,
  deleteDocument,
  toggleStatus,
  listDocuments,
  searchDocuments,
} from '../firestore-service';

const COLLECTION_NAME = 'live_classes';

export const liveClassService = {
  async create(data: Omit<LiveClass, 'id'>, userId: string) {
    return createDocument<LiveClass>(COLLECTION_NAME, data, userId);
  },

  async get(id: string) {
    return getDocument<LiveClass>(COLLECTION_NAME, id);
  },

  async update(id: string, data: Partial<LiveClass>, userId: string) {
    return updateDocument<LiveClass>(COLLECTION_NAME, id, data, userId);
  },

  async delete(id: string) {
    return deleteDocument(COLLECTION_NAME, id);
  },

  async toggleStatus(id: string, currentStatus: 'active' | 'inactive', userId: string) {
    return toggleStatus(COLLECTION_NAME, id, currentStatus, userId);
  },

  async list(page = 1, limit = 10, filters?: any) {
    return listDocuments<LiveClass>(
      COLLECTION_NAME,
      page,
      limit,
      filters as any,
      'createdAt',
      'desc'
    );
  },

  async search(searchTerm: string, page = 1, limit = 10) {
    return searchDocuments<LiveClass>(COLLECTION_NAME, 'title', searchTerm, page, limit);
  },

  async start(id: string, userId: string, meetingUrl?: string) {
    const isInHouse = meetingUrl === 'in-house-stream';
    return updateDocument<LiveClass>(COLLECTION_NAME, id, {
      status: 'live',
      sessionType: isInHouse ? 'in-house-stream' : 'zoom',
      isLive: true,
      meetingUrl: isInHouse ? '' : (meetingUrl || ''),
      startTime: new Date(),
    }, userId);
  },

  async stop(id: string, userId: string, recordingUrl?: string) {
    return updateDocument<LiveClass>(COLLECTION_NAME, id, {
      status: 'completed',
      isLive: false,
      recordingUrl: recordingUrl || '',
    }, userId);
  },
};

export default liveClassService;
