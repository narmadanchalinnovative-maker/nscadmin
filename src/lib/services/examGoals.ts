import { ExamGoal } from '@/types';
import { ApiService } from '../api-service';

export const examGoalService = {
  async create(data: Omit<ExamGoal, 'id'>, userId: string) {
    return ApiService.post('/exam-goals', data);
  },

  async get(id: string) {
    return ApiService.get(`/exam-goals/${id}`);
  },

  async update(id: string, data: Partial<ExamGoal>, userId: string) {
    return ApiService.put(`/exam-goals/${id}`, data);
  },

  async delete(id: string) {
    return ApiService.delete(`/exam-goals/${id}`);
  },

  async toggleStatus(id: string, currentStatus: 'active' | 'inactive', userId: string) {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    return ApiService.put(`/exam-goals/${id}`, { status: newStatus });
  },

  async list(page = 1, limit = 10, filters?: any) {
    // The current admin component expects { items: [], total: 0 }
    const response: any = await ApiService.get('/exam-goals');
    const allGoals: ExamGoal[] = Array.isArray(response) ? response : (response.data || []);
    
    // Manual pagination since our basic API returns all goals
    const start = (page - 1) * limit;
    const end = start + limit;
    
    let filtered = allGoals;
    if (filters?.status) {
      filtered = filtered.filter(g => g.status === filters.status);
    }

    return {
      data: filtered.slice(start, end),
      total: filtered.length,
      page,
      limit,
      totalPages: Math.ceil(filtered.length / limit)
    };
  },

  async listAll() {
    try {
      const response: any = await ApiService.get('/exam-goals');
      const allGoals: ExamGoal[] = Array.isArray(response) ? response : (response.data || []);
      return allGoals
        .filter(doc => doc.status !== 'inactive')
        .sort((a, b) => (a.order || 0) - (b.order || 0));
    } catch (error) {
      console.error('Error fetching all exam goals:', error);
      return [];
    }
  },
};
