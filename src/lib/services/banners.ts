import { ApiService } from '../api-service';

export interface Banner {
  id: string;
  imageUrl: string;
  routeName: string;
  order: number;
  status: 'active' | 'inactive';
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const bannerService = {
  async create(data: Omit<Banner, 'id'>) {
    return ApiService.post('/admin/data/banners', data);
  },

  async get(id: string) {
    return ApiService.get(`/admin/data/banners/${id}`);
  },

  async update(id: string, data: Partial<Banner>) {
    return ApiService.put(`/admin/data/banners/${id}`, data);
  },

  async delete(id: string) {
    return ApiService.delete(`/admin/data/banners/${id}`);
  },

  async listAll() {
    try {
      const response: any = await ApiService.get('/admin/data/banners');
      const allBanners: Banner[] = Array.isArray(response?.data) ? response.data : (Array.isArray(response) ? response : []);
      // Sort locally by order
      allBanners.sort((a, b) => (a.order || 0) - (b.order || 0));
      return allBanners;
    } catch (error) {
      console.error('Error fetching banners:', error);
      return [];
    }
  },
};
