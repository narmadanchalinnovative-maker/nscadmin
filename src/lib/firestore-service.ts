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
    throw new Error(res.message || 'Failed to create document');
  }
  return res.data?.id;
}

export async function getDocument<T extends Record<string, any>>(
  collectionName: string,
  docId: string
): Promise<(T & { id: string }) | null> {
  try {
    const res = await ApiService.get(`/admin/data/${collectionName}/${docId}`);
    return res.data;
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
  const res = await ApiService.get(`/admin/data/${collectionName}`);
  let data = res.data || [];
  
  // Client-side filtering/pagination for now
  if (filters && filters.length > 0) {
    filters.forEach((f) => {
      data = data.filter((item: any) => {
        if (f.operator === '==') return item[f.field] === f.value;
        if (f.operator === 'array-contains') return item[f.field]?.includes(f.value);
        return true;
      });
    });
  }
  
  if (sortBy) {
    data.sort((a: any, b: any) => {
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
    totalPages: Math.ceil(data.length / limit),
  };
}

export async function searchDocuments<T extends Record<string, any>>(
  collectionName: string,
  searchField: string,
  searchTerm: string,
  page: number = 1,
  limit: number = 10
): Promise<PaginatedResponse<T & { id: string }>> {
  const res = await ApiService.get(`/admin/data/${collectionName}`);
  let data = res.data || [];

  data = data.filter((item: any) => 
    item[searchField] && item[searchField].toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pageNum = Math.max(1, page);
  const skipCount = (pageNum - 1) * limit;
  const paginatedData = data.slice(skipCount, skipCount + limit);

  return {
    data: paginatedData,
    total: data.length,
    page: pageNum,
    limit,
    totalPages: Math.ceil(data.length / limit),
  };
}

export async function batchDelete(
  collectionName: string,
  docIds: string[]
): Promise<void> {
  // A simple implementation: delete one by one
  for (const docId of docIds) {
    await ApiService.delete(`/admin/data/${collectionName}/${docId}`);
  }
}

export async function findDocumentInCollectionGroup<T extends BaseEntity>(
  collectionName: string,
  docId: string
): Promise<(T & { id: string; ref?: any }) | null> {
  // We don't have collection groups in Postgres, we just search the table
  try {
    const res = await ApiService.get(`/admin/data/${collectionName}/${docId}`);
    return res.data;
  } catch (error) {
    return null;
  }
}

// Stubs for remaining functions
export const collectionGroup = {} as any;
export const getDocs = {} as any;
export const query = {} as any;
export const where = {} as any;
export const documentId = {} as any;
export const limit = {} as any;
export const doc = {} as any;

export async function sendDoubtMessage(doubtId: string, text: string, mediaUrl?: string, mediaType?: 'image' | 'video', senderName: string = 'Admin'): Promise<void> {
  // TODO: Add API endpoint for this
}

export async function uploadChatMedia(doubtId: string, file: File): Promise<string> {
  // TODO: Add API endpoint for this
  return "";
}

export async function sendSupportTicketMessage(ticketId: string, text: string, mediaUrl?: string, mediaType?: 'image' | 'video', senderName: string = 'Admin'): Promise<void> {
  // TODO: Add API endpoint for this
}

export async function uploadSupportChatMedia(ticketId: string, file: File): Promise<string> {
  // TODO: Add API endpoint for this
  return "";
}
