import { ApiService } from '../api-service';

export interface GoalLog {
  id: string;
  uid?: string;
  userId?: string;
  studentName: string;
  phoneNumber?: string;
  previousGoal: string;
  newGoal: string;
  timestamp: any;
  createdAt?: any;
}

export const goalLogsService = {
  async list(limit = 100): Promise<GoalLog[]> {
    try {
      const res = await ApiService.get(`/admin/data/goal_logs?limit=${limit}`);
      const rawData = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      return rawData.map((d: any) => ({
        id: d.id,
        uid: d.userId || d.uid,
        studentName: d.studentName || 'Student',
        phoneNumber: d.phoneNumber || 'N/A',
        previousGoal: d.previousGoal || 'None',
        newGoal: d.newGoal || '',
        timestamp: d.createdAt || d.timestamp || new Date().toISOString(),
      }));
    } catch (error) {
      console.error('Error fetching goal logs from API:', error);
      return [];
    }
  }
};
