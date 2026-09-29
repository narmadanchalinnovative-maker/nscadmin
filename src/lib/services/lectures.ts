import { Lecture, PaginatedResponse } from '@/types';
import { ApiService } from '../api-service';

export const lectureService = {
  async create(data: Omit<Lecture, 'id'>, userId: string): Promise<string> {
    const result = await ApiService.post('/admin/data/lectures', {
      ...data,
      createdBy: userId,
      updatedBy: userId,
    });
    return result.data.id;
  },

  async get(id: string): Promise<Lecture | null> {
    try {
      const res = await ApiService.get(`/admin/data/lectures/${id}`);
      return res.data;
    } catch {
      return null;
    }
  },

  async update(id: string, data: Partial<Lecture>, userId: string): Promise<void> {
    await ApiService.put(`/admin/data/lectures/${id}`, {
      ...data,
      updatedBy: userId,
    });
  },

  async delete(id: string): Promise<void> {
    await ApiService.delete(`/admin/data/lectures/${id}`);
  },

  async toggleStatus(id: string, currentStatus: 'active' | 'inactive', userId: string): Promise<void> {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    await this.update(id, { status: newStatus }, userId);
  },

  async list(page = 1, limit = 10, filters?: any): Promise<PaginatedResponse<Lecture & { id: string }>> {
    let query = '?';
    if (filters) {
      for (const [k, v] of Object.entries(filters)) {
        query += `${k}=${v}&`;
      }
    }
    const res = await ApiService.get(`/admin/data/lectures${query}`);
    let items = res.data || [];

    const total = items.length;
    const skipCount = (page - 1) * limit;
    items = items.slice(skipCount, skipCount + limit);

    return {
      data: items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  },

  async listByChapter(chapterId: string, page = 1, limit = 100): Promise<PaginatedResponse<Lecture & { id: string }>> {
    const res = await ApiService.get(`/admin/data/lectures?chapterId=${chapterId}`);
    let items = res.data || [];
    const total = items.length;
    const skipCount = (page - 1) * limit;
    items = items.slice(skipCount, skipCount + limit);
    return { data: items, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async search(searchTerm: string, page = 1, limit = 10): Promise<PaginatedResponse<Lecture & { id: string }>> {
    return this.list(page, limit); // Fallback for naive search
  },

  async listByCourse(courseId: string, page = 1, limit = 100): Promise<PaginatedResponse<Lecture & { id: string }>> {
    const res = await ApiService.get(`/admin/data/lectures?courseId=${courseId}`);
    let items = res.data || [];
    const total = items.length;
    const skipCount = (page - 1) * limit;
    items = items.slice(skipCount, skipCount + limit);
    return { data: items, total, page, limit, totalPages: Math.ceil(total / limit) };
  },
};
