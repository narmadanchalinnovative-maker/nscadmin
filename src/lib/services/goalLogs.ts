import { getDocs, query, collection, orderBy, limit as limitConstraint, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export interface GoalLog {
  id: string;
  uid: string;
  studentName: string;
  phoneNumber?: string;
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
    const logs = snapshot.docs.map(d => ({
      id: d.id,
      ...d.data()
    })) as GoalLog[];

    // Fetch missing phone numbers from the users collection
    const userCache = new Map<string, string>();
    
    for (const log of logs) {
      if (!log.phoneNumber && log.uid) {
        if (!userCache.has(log.uid)) {
          try {
            const userSnap = await getDoc(doc(db, 'users', log.uid));
            if (userSnap.exists()) {
              const userData = userSnap.data();
              userCache.set(log.uid, userData.phoneNumber || 'N/A');
            } else {
              userCache.set(log.uid, 'N/A');
            }
          } catch (e) {
            userCache.set(log.uid, 'N/A');
          }
        }
        log.phoneNumber = userCache.get(log.uid);
      }
    }
    
    return logs;
  }
};
