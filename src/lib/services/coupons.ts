import { ApiService } from '../api-service';

export interface Coupon {
  id: string;
  code?: string;
  description: string;
  discountAmount: number;
  isActive: boolean;
  scope: 'ALL_COURSES' | 'SINGLE_COURSE';
  courseId?: string | null;
  terms: string;
  createdAt?: string;
  updatedAt?: string;
}

export const couponService = {
  async create(data: Omit<Coupon, 'id'>, userId: string) {
    const payload: any = { ...data, code: data.code || (data as any).id };
    delete payload.id; // Prisma doesn't have 'id' for Coupon, it uses 'code'
    return ApiService.post('/admin/data/coupons', payload);
  },

  async get(id: string) {
    return ApiService.get(`/admin/data/coupons/${id}`);
  },

  async update(id: string, data: Partial<Coupon>, userId: string) {
    const payload = { ...data };
    delete payload.id;
    return ApiService.put(`/admin/data/coupons/${id}`, payload);
  },

  async delete(id: string) {
    return ApiService.delete(`/admin/data/coupons/${id}`);
  },

  async list(page = 1, limit = 50, filters?: any) {
    const response: any = await ApiService.get('/admin/data/coupons');
    // Admin data controller returns { success: true, data: [...] }
    const allCoupons: Coupon[] = Array.isArray(response?.data) ? response.data : (Array.isArray(response) ? response : []);
    
    const start = (page - 1) * limit;
    const end = start + limit;
    
    let filtered = allCoupons;
    if (filters?.isActive !== undefined) {
      filtered = filtered.filter(g => g.isActive === filters.isActive);
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
      const response: any = await ApiService.get('/admin/data/coupons');
      const allCoupons: any[] = Array.isArray(response?.data) ? response.data : (Array.isArray(response) ? response : []);
      // map 'code' to 'id' for frontend compatibility
      return allCoupons.map(c => ({ ...c, id: c.code }));
    } catch (error) {
      console.error('Error fetching all coupons:', error);
      return [];
    }
  },
};
