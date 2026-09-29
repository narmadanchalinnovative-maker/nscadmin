import { Chapter, PaginatedResponse } from '@/types';
import { ApiService } from '../api-service';

export const chapterService = {
  async list(page = 1, pageSize = 100, subjectId?: string): Promise<PaginatedResponse<Chapter & { id: string }>> {
    const query = subjectId ? `?subjectId=${subjectId}` : '';
    const res = await ApiService.get(`/admin/data/chapters${query}`);
    let items = res.data || [];

    const total = items.length;
    const skipCount = (page - 1) * pageSize;
    items = items.slice(skipCount, skipCount + pageSize);

    return {
      data: items,
      total,
      page,
      limit: pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  },

  async get(id: string): Promise<Chapter | null> {
    try {
      const res = await ApiService.get(`/admin/data/chapters/${id}`);
      return res.data;
    } catch {
      return null;
    }
  },

  async create(data: Omit<Chapter, 'id'>, adminUid: string): Promise<string> {
    const result = await ApiService.post('/admin/data/chapters', {
      ...data,
      createdBy: adminUid,
      updatedBy: adminUid,
    });
    return result.data.id;
  },

  async update(id: string, data: Partial<Chapter>, adminUid: string): Promise<void> {
    await ApiService.put(`/admin/data/chapters/${id}`, {
      ...data,
      updatedBy: adminUid,
    });
  },

  async delete(id: string): Promise<void> {
    await ApiService.delete(`/admin/data/chapters/${id}`);
  }
};
