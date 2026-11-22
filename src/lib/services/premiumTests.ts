import { ApiService } from '../api-service';
import {
  createDocument,
  getDocument,
  updateDocument,
  deleteDocument,
  listDocuments,
} from '../firestore-service';
import {
  PremiumTest,
  PremiumPurchase,
  PremiumBanner,
  PremiumCoupon,
  PaginatedResponse,
} from '@/types';

export const premiumTestService = {
  // ==========================================
  // 1. TESTS (Goal-wise & Pricing)
  // ==========================================
  async listTests(page = 1, limit = 50, examGoal?: string): Promise<PaginatedResponse<PremiumTest>> {
    try {
      const filters: any[] = [{ field: 'isPremium', operator: '==', value: true }];
      if (examGoal && examGoal !== 'ALL') {
        filters.push({ field: 'examGoal', operator: '==', value: examGoal });
      }
      const res = await listDocuments<PremiumTest>(
        'tests',
        page,
        limit,
        filters,
        'createdAt',
        'desc'
      );
      return res;
    } catch (e) {
      console.error('[premiumTestService.listTests] Error:', e);
      return { data: [], total: 0, page, limit, totalPages: 0 };
    }
  },

  async getTest(id: string): Promise<PremiumTest | null> {
    return getDocument<PremiumTest>('tests', id);
  },

  async createTest(data: Omit<PremiumTest, 'id'>, userId: string): Promise<string> {
    const payload: any = {
      ...data,
      isPremium: true,
      price: Number(data.price) || 0,
      originalPrice: Number(data.originalPrice) || Number(data.price) || 0,
      duration: Number(data.duration) || 180,
      totalMarks: Number(data.totalMarks) || 300,
      totalQuestions: Number(data.totalQuestions) || 50,
      validity: data.validity || '1 Year Validity',
      language: data.language || 'Hindi & English',
      isDemoAvailable: data.isDemoAvailable ?? true,
      status: data.status || 'active',
    };

    // Calculate discount if not provided
    if (!payload.discount && payload.originalPrice > payload.price && payload.price > 0) {
      const pct = Math.round(((payload.originalPrice - payload.price) / payload.originalPrice) * 100);
      payload.discount = `${pct}% OFF`;
    }

    return createDocument<PremiumTest>('tests', payload, userId);
  },

  async updateTest(id: string, data: Partial<PremiumTest>, userId: string): Promise<void> {
    const payload: any = { ...data };
    if (payload.price !== undefined) payload.price = Number(payload.price);
    if (payload.originalPrice !== undefined) payload.originalPrice = Number(payload.originalPrice);
    if (payload.duration !== undefined) payload.duration = Number(payload.duration);
    if (payload.totalMarks !== undefined) payload.totalMarks = Number(payload.totalMarks);
    if (payload.totalQuestions !== undefined) payload.totalQuestions = Number(payload.totalQuestions);

    if (payload.price !== undefined && payload.originalPrice !== undefined && payload.originalPrice > payload.price) {
      const pct = Math.round(((payload.originalPrice - payload.price) / payload.originalPrice) * 100);
      payload.discount = `${pct}% OFF`;
    }

    return updateDocument<PremiumTest>('tests', id, payload, userId);
  },

  async updatePriceRealtime(id: string, price: number, originalPrice?: number, discount?: string): Promise<any> {
    try {
      const res = await ApiService.put(`/admin/premium-tests/${id}/price`, {
        price,
        originalPrice,
        discount,
      });
      return res;
    } catch (e) {
      // Fallback to updateDocument
      const pct = originalPrice && originalPrice > price ? `${Math.round(((originalPrice - price) / originalPrice) * 100)}% OFF` : discount;
      return updateDocument('tests', id, { price, originalPrice, discount: pct } as any, 'admin');
    }
  },

  async deleteTest(id: string): Promise<void> {
    return deleteDocument('tests', id);
  },

  // ==========================================
  // 2. PURCHASES ("kis kis na purchase kiya")
  // ==========================================
  async listPurchases(page = 1, limit = 50, testId?: string): Promise<PaginatedResponse<PremiumPurchase>> {
    try {
      const filters: any[] = [];
      if (testId && testId !== 'ALL') {
        filters.push({ field: 'testId', operator: '==', value: testId });
      }
      return listDocuments<PremiumPurchase>(
        'premium_purchases',
        page,
        limit,
        filters.length > 0 ? filters : undefined,
        'createdAt',
        'desc'
      );
    } catch (e) {
      console.error('[premiumTestService.listPurchases] Error:', e);
      return { data: [], total: 0, page, limit, totalPages: 0 };
    }
  },

  async createPurchase(data: Omit<PremiumPurchase, 'id'>, userId = 'admin'): Promise<string> {
    return createDocument<PremiumPurchase>('premium_purchases', data as any, userId);
  },

  // ==========================================
  // 3. BANNERS (Video / GIF / Image)
  // ==========================================
  async listBanners(): Promise<PremiumBanner[]> {
    try {
      const res = await listDocuments<PremiumBanner>('premium_banners', 1, 50, undefined, 'order', 'asc');
      return res.data;
    } catch (e) {
      console.error('[premiumTestService.listBanners] Error:', e);
      return [];
    }
  },

  async createBanner(data: Omit<PremiumBanner, 'id'>, userId = 'admin'): Promise<string> {
    return createDocument<PremiumBanner>('premium_banners', data as any, userId);
  },

  async deleteBanner(id: string): Promise<void> {
    return deleteDocument('premium_banners', id);
  },

  // ==========================================
  // 4. COUPONS (Test-wise discount)
  // ==========================================
  async listCoupons(): Promise<PremiumCoupon[]> {
    try {
      const res = await listDocuments<PremiumCoupon>('premium_coupons', 1, 100, undefined, 'createdAt', 'desc');
      return res.data;
    } catch (e) {
      console.error('[premiumTestService.listCoupons] Error:', e);
      return [];
    }
  },

  async createCoupon(data: Omit<PremiumCoupon, 'id'>, userId = 'admin'): Promise<string> {
    return createDocument<PremiumCoupon>('premium_coupons', data as any, userId);
  },

  async deleteCoupon(id: string): Promise<void> {
    return deleteDocument('premium_coupons', id);
  },

  // ==========================================
  // 5. TEST-WISE LEADERBOARD & ANALYTICS
  // ==========================================
  async getLeaderboard(testId = 'all'): Promise<{
    test: any;
    leaderboard: any[];
    summary: { totalAttempts: number; highestScore: number; avgScore: number; passPercentage: number };
  }> {
    try {
      const res = await ApiService.get(`/admin/premium-tests/leaderboard/${testId}`);
      if (res && res.success) {
        return {
          test: res.test || null,
          leaderboard: res.leaderboard || [],
          summary: res.summary || { totalAttempts: 0, highestScore: 0, avgScore: 0, passPercentage: 0 },
        };
      }
      return { test: null, leaderboard: [], summary: { totalAttempts: 0, highestScore: 0, avgScore: 0, passPercentage: 0 } };
    } catch (e) {
      console.error('[premiumTestService.getLeaderboard] Error:', e);
      return { test: null, leaderboard: [], summary: { totalAttempts: 0, highestScore: 0, avgScore: 0, passPercentage: 0 } };
    }
  },

  async getAnalytics(): Promise<any> {
    try {
      const res = await ApiService.get('/admin/premium-tests/analytics');
      if (res && res.success) {
        return res.data;
      }
      return null;
    } catch (e) {
      console.error('[premiumTestService.getAnalytics] Error:', e);
      return null;
    }
  },
};
