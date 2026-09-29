import { Subject, PaginatedResponse } from '@/types';
import { subjectSchema } from '@/schemas';
import { ApiService } from '../api-service';

export const subjectService = {
  async create(data: Partial<Subject>, adminId: string): Promise<string> {
    const validated = subjectSchema.parse(data);
    const result = await ApiService.post('/admin/data/subjects', {
      ...validated,
      createdBy: adminId,
      updatedBy: adminId,
    });
    return result.data.id;
  },

  async update(id: string, data: Partial<Subject>, adminId: string): Promise<void> {
    await ApiService.put(`/admin/data/subjects/${id}`, {
      ...data,
      updatedBy: adminId,
    });
  },

  async get(id: string): Promise<Subject | null> {
    try {
      const res = await ApiService.get(`/admin/data/subjects/${id}`);
      return res.data;
    } catch {
      return null;
    }
  },

  async listByCourse(courseId: string, page = 1, limitCount = 100): Promise<PaginatedResponse<Subject & { id: string }>> {
    const res = await ApiService.get(`/admin/data/subjects?courseId=${courseId}`);
    let items = res.data || [];

    const total = items.length;
    const skipCount = (page - 1) * limitCount;
    items = items.slice(skipCount, skipCount + limitCount);

    return {
      data: items,
      total,
      page,
      limit: limitCount,
      totalPages: Math.ceil(total / limitCount)
    };
  },

  async delete(id: string): Promise<void> {
    await ApiService.delete(`/admin/data/subjects/${id}`);
  }
};
