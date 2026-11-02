import { ApiService } from './api-service';
import { BaseEntity, PaginatedResponse } from '@/types';

export async function createDocument<T extends Record<string, any>>(
  collectionName: string,
  data: Omit<T, 'id'>,
  userId: string
): Promise<string> {
  const res = await ApiService.post(`/admin/data/${collectionName}`, {
    ...data,
    createdBy: userId,
    updatedBy: userId,
  });
  if (res.success === false) {
    throw new Error(res.message || res.error || 'Failed to create document');
  }
  return res.data?.id || res.id || '';
}

export async function getDocument<T extends Record<string, any>>(
  collectionName: string,
  docId: string
): Promise<(T & { id: string }) | null> {
  try {
    const res = await ApiService.get(`/admin/data/${collectionName}/${docId}`);
    return res.data || null;
  } catch (error) {
    return null;
  }
}

export async function updateDocument<T extends Record<string, any>>(
  collectionName: string,
  docId: string,
  data: Partial<T>,
  userId: string
): Promise<void> {
  await ApiService.put(`/admin/data/${collectionName}/${docId}`, {
    ...data,
    updatedBy: userId,
  });
}

export async function deleteDocument(
  collectionName: string,
  docId: string
): Promise<void> {
  await ApiService.delete(`/admin/data/${collectionName}/${docId}`);
}

export async function toggleStatus(
  collectionName: string,
  docId: string,
  currentStatus: 'active' | 'inactive',
  userId: string
): Promise<void> {
  const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
  await updateDocument<BaseEntity>(collectionName, docId, { status: newStatus }, userId);
}

export async function listDocuments<T extends Record<string, any>>(
  collectionName: string,
  page: number = 1,
  limit: number = 10,
  filters?: { field: string; operator: string; value: any }[],
  sortBy?: string,
  sortOrder: 'asc' | 'desc' = 'desc'
): Promise<PaginatedResponse<T & { id: string }>> {
  try {
    const res = await ApiService.get(`/admin/data/${collectionName}`);
    let data: any[] = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);

    // Filtering
    if (filters && filters.length > 0) {
      filters.forEach((f) => {
        data = data.filter((item: any) => {
          if (!item) return false;
          if (f.operator === '==') return item[f.field] === f.value;
          if (f.operator === 'array-contains') {
            return Array.isArray(item[f.field]) && item[f.field]?.includes(f.value);
          }
          return true;
        });
      });
    }

    // Sorting
    if (sortBy) {
      data.sort((a: any, b: any) => {
        if (!a || !b) return 0;
        if (a[sortBy] < b[sortBy]) return sortOrder === 'asc' ? -1 : 1;
        if (a[sortBy] > b[sortBy]) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    const pageNum = Math.max(1, page);
    const skipCount = (pageNum - 1) * limit;
    const paginatedData = data.slice(skipCount, skipCount + limit);

    return {
      data: paginatedData,
      total: data.length,
      page: pageNum,
      limit,
      totalPages: Math.ceil(data.length / limit) || 1,
    };
  } catch (error) {
    console.error(`Error in listDocuments for ${collectionName}:`, error);
    return {
      data: [],
      total: 0,
      page: Math.max(1, page),
      limit,
      totalPages: 1,
    };
  }
}

export async function searchDocuments<T extends Record<string, any>>(
  collectionName: string,
  searchField: string,
  searchTerm: string,
  page: number = 1,
  limit: number = 10
): Promise<PaginatedResponse<T & { id: string }>> {
  try {
    const res = await ApiService.get(`/admin/data/${collectionName}`);
    let data: any[] = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);

    const term = (searchTerm || '').toLowerCase();
    data = data.filter((item: any) => {
      if (!item || !item[searchField]) return false;
      return String(item[searchField]).toLowerCase().includes(term);
    });

    const pageNum = Math.max(1, page);
    const skipCount = (pageNum - 1) * limit;
    const paginatedData = data.slice(skipCount, skipCount + limit);

    return {
      data: paginatedData,
      total: data.length,
      page: pageNum,
      limit,
      totalPages: Math.ceil(data.length / limit) || 1,
    };
  } catch (error) {
    console.error(`Error in searchDocuments for ${collectionName}:`, error);
    return {
      data: [],
      total: 0,
      page: Math.max(1, page),
      limit,
      totalPages: 1,
    };
  }
}

export async function batchDelete(
  collectionName: string,
  docIds: string[]
): Promise<void> {
  if (!Array.isArray(docIds)) return;
  for (const docId of docIds) {
    try {
      await ApiService.delete(`/admin/data/${collectionName}/${docId}`);
    } catch (e) {
      console.warn(`Failed to delete ${docId} from ${collectionName}:`, e);
    }
  }
}

export async function findDocumentInCollectionGroup<T extends BaseEntity>(
  collectionName: string,
  docId: string
): Promise<(T & { id: string; ref?: any }) | null> {
  try {
    const res = await ApiService.get(`/admin/data/${collectionName}/${docId}`);
    return res.data || null;
  } catch (error) {
    return null;
  }
}

// Callable stubs so any legacy or unexpected call will not crash
export const collectionGroup = (...args: any[]): any => ({});
export const getDocs = async (...args: any[]): Promise<any> => ({ docs: [], empty: true, size: 0 });
export const query = (...args: any[]): any => ({});
export const where = (...args: any[]): any => ({});
export const documentId = (...args: any[]): any => ({});
export const limit = (...args: any[]): any => ({});
export const doc = (...args: any[]): any => ({});

export async function sendDoubtMessage(
  doubtId: string,
  text: string,
  mediaUrl?: string,
  mediaType?: 'image' | 'video',
  senderName: string = 'Admin'
): Promise<void> {
  try {
    await ApiService.post(`/admin/data/doubts/${doubtId}/messages`, {
      text,
      mediaUrl,
      mediaType,
      senderName,
      createdAt: new Date().toISOString(),
    });
  } catch (e) {
    console.warn('sendDoubtMessage fallback warning:', e);
  }
}

export async function uploadChatMedia(doubtId: string, file: File): Promise<string> {
  return '';
}

export async function sendSupportTicketMessage(
  ticketId: string,
  text: string,
  mediaUrl?: string,
  mediaType?: 'image' | 'video',
  senderName: string = 'Admin'
): Promise<void> {
  try {
    await ApiService.post(`/admin/data/support_tickets/${ticketId}/messages`, {
      text,
      mediaUrl,
      mediaType,
      senderName,
      createdAt: new Date().toISOString(),
    });
  } catch (e) {
    console.warn('sendSupportTicketMessage fallback warning:', e);
  }
}

export async function uploadSupportChatMedia(ticketId: string, file: File): Promise<string> {
  return '';
}
