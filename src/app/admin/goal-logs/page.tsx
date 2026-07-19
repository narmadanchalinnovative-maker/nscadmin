'use client';

import { useEffect, useState } from 'react';
import { goalLogsService, GoalLog } from '@/lib/services/goalLogs';
import { toast } from 'sonner';

export default function GoalLogsPage() {
  const [logs, setLogs] = useState<GoalLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    try {
      setLoading(true);
      const data = await goalLogsService.list(100);
      setLogs(data);
    } catch (error) {
      console.error('Error fetching goal logs:', error);
      toast.error('Failed to fetch goal logs');
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    // Handle Firestore Timestamp
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
    } catch (e) {
      return 'Invalid Date';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Goal Logs</h1>
          <p className="text-gray-600 mt-1">Track which students changed their exam goals</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No goal logs found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900">Student Name</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900">Previous Goal</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900">New Goal</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      <div>{log.studentName || 'Unknown Student'}</div>
                      {log.phoneNumber && (
                        <div className="text-xs text-gray-500 font-normal mt-0.5">{log.phoneNumber}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {log.previousGoal || 'None'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {log.newGoal || 'None'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {formatDate(log.timestamp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
