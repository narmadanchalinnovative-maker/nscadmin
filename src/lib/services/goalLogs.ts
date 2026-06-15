import { getDocs, query, collection, orderBy, limit as limitConstraint } from 'firebase/firestore';
import { db } from '../firebase';

export interface GoalLog {
  id: string;
  uid: string;
  studentName: string;
  previousGoal: string;
  newGoal: string;
  timestamp: any;
}

export const goalLogsService = {
  async list(limit = 50): Promise<GoalLog[]> {
    const q = query(
      collection(db, 'goal_change_logs'),
      orderBy('timestamp', 'desc'),
      limitConstraint(limit)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as GoalLog[];
  }
};
