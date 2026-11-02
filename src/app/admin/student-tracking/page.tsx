'use client';

import { useEffect, useState } from 'react';
import { collection, getCountFromServer, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Users, UserCheck, UserX, Loader2, RefreshCw, Smartphone } from 'lucide-react';

interface TrackingStats {
  totalLogins: number;
  liveNow: number;
  uninstalled: number;
}

interface RecentStudent {
  id: string;
  phoneNumber: string;
  name?: string;
  lastActive?: Date;
  status: 'active' | 'inactive' | 'uninstalled';
}

export default function StudentTrackingPage() {
  const [stats, setStats] = useState<TrackingStats>({
    totalLogins: 0,
    liveNow: 0,
    uninstalled: 0,
  });
  const [recentStudents, setRecentStudents] = useState<RecentStudent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrackingData = async () => {
    if (!db) return;
    setLoading(true);
    try {
      const usersRef = collection(db, 'users');
      
      // Get total users (logged in apps)
      const totalSnapshot = await getCountFromServer(usersRef);
      const totalLogins = totalSnapshot.data().count;

      // Note: "Live Now" and "Uninstalled" usually require specific flags 
      // managed by the client app or cloud functions.
      // Assuming 'isOnline' = true for live, 'isUninstalled' = true for uninstalled
      const liveQuery = query(usersRef, where('isOnline', '==', true));
      const liveSnapshot = await getCountFromServer(liveQuery);
      const liveNow = liveSnapshot.data().count;

      const uninstallQuery = query(usersRef, where('isUninstalled', '==', true));
      const uninstallSnapshot = await getCountFromServer(uninstallQuery);
      const uninstalled = uninstallSnapshot.data().count;

      setStats({
        totalLogins,
        liveNow,
        uninstalled,
      });

      // Fetch a few recent users to show
      const recentQuery = query(usersRef, limit(10)); // Can add orderBy('createdAt', 'desc') if createdAt exists
      const recentDocs = await getDocs(recentQuery);
      const students: RecentStudent[] = [];
      recentDocs.forEach((doc) => {
        const data = doc.data();
        let status: 'active' | 'inactive' | 'uninstalled' = 'inactive';
        if (data.isOnline) status = 'active';
        if (data.isUninstalled) status = 'uninstalled';

        const parseDate = (d: any) => {
          if (!d) return undefined;
          if (typeof d?.toDate === 'function') return d.toDate();
          const parsed = new Date(d);
          return isNaN(parsed.getTime()) ? undefined : parsed;
        };

        students.push({
          id: doc.id,
          phoneNumber: data.phoneNumber || 'N/A',
          name: data.displayName || data.name || 'Unknown',
          status,
          lastActive: parseDate(data.lastLogin) || parseDate(data.lastActive),
        });
      });
      setRecentStudents(students);

    } catch (error) {
      console.error('Error fetching student tracking data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrackingData();
  }, []);

  const StatCard = ({ icon: Icon, label, value, colorClass }: any) => (
    <div className={`bg-white rounded-lg shadow p-6 border-l-4 ${colorClass}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`p-4 rounded-full bg-opacity-10 ${colorClass.replace('border-', 'bg-').replace('text-', 'bg-')}`}>
          <Icon className={`w-8 h-8 ${colorClass.replace('border-', 'text-')}`} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Student Tracking</h1>
          <p className="text-gray-600 mt-2">Monitor app installations and live active students</p>
        </div>
        <button
          onClick={fetchTrackingData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            <p className="text-gray-600">Loading tracking data...</p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard 
              icon={Smartphone} 
              label="Total App Logins" 
              value={stats.totalLogins} 
              colorClass="border-blue-500" 
            />
            <StatCard 
              icon={UserCheck} 
              label="Live / Active Now" 
              value={stats.liveNow} 
              colorClass="border-green-500" 
            />
            <StatCard 
              icon={UserX} 
              label="App Uninstalled" 
              value={stats.uninstalled} 
              colorClass="border-red-500" 
            />
          </div>

          <div className="bg-white rounded-lg shadow mt-8 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Recent Students Overview</h2>
              <p className="text-sm text-gray-500 mt-1">Snapshot of the users collection</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-600 text-sm">
                  <tr>
                    <th className="px-6 py-4 font-medium">Name</th>
                    <th className="px-6 py-4 font-medium">Phone Number</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Last Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentStudents.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                        No students found
                      </td>
                    </tr>
                  ) : (
                    recentStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{student.name}</div>
                          <div className="text-xs text-gray-400">ID: {student.id}</div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{student.phoneNumber}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                            ${student.status === 'active' ? 'bg-green-100 text-green-800' : 
                              student.status === 'uninstalled' ? 'bg-red-100 text-red-800' : 
                              'bg-gray-100 text-gray-800'}`}
                          >
                            {student.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600 text-sm">
                          {student.lastActive 
                            ? new Intl.DateTimeFormat('en-US', { 
                                dateStyle: 'medium', 
                                timeStyle: 'short' 
                              }).format(student.lastActive)
                            : 'Unknown'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
