'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { eventService } from '@/lib/services/events';
import { batchService } from '@/lib/services/batches';
import { courseService } from '@/lib/services/courses';
import { testService } from '@/lib/services/tests';
import { Calendar, Users, BookOpen, CheckSquare, Loader2 } from 'lucide-react';

interface Stats {
  events: number;
  batches: number;
  courses: number;
  tests: number;
}

export default function DashboardPage() {
  const { adminUser } = useAuth();
  const [stats, setStats] = useState<Stats>({
    events: 0,
    batches: 0,
    courses: 0,
    tests: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [eventsData, batchesData, coursesData, testsData] = await Promise.all([
          eventService.list(1, 1),
          batchService.list(1, 1),
          courseService.list(1, 1),
          testService.list(1, 1),
        ]);

        setStats({
          events: eventsData.total,
          batches: batchesData.total,
          courses: coursesData.total,
          tests: testsData.total,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const StatCard = ({ icon: Icon, label, value }: any) => (
    <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-600">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className="p-3 bg-blue-100 rounded-lg">
          <Icon className="w-6 h-6 text-blue-600" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back, {adminUser?.email}</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            <p className="text-gray-600">Loading statistics...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard icon={Calendar} label="Total Events" value={stats.events} />
          <StatCard icon={Users} label="Total Batches" value={stats.batches} />
          <StatCard icon={BookOpen} label="Total Courses" value={stats.courses} />
          <StatCard icon={CheckSquare} label="Total Tests" value={stats.tests} />
        </div>
      )}

      {/* Quick Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Stats</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-4 border-b">
              <span className="text-gray-600">Total Items</span>
              <span className="text-2xl font-bold">
                {stats.events + stats.batches + stats.courses + stats.tests}
              </span>
            </div>
            <div className="flex items-center justify-between pb-4 border-b">
              <span className="text-gray-600">Admin Role</span>
              <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full capitalize">
                {adminUser?.role}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Account Status</span>
              <span className="text-sm font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full">
                {adminUser?.active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg shadow p-6 text-white">
          <h2 className="text-lg font-bold mb-4">Admin Panel Info</h2>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-blue-300 mt-1">✓</span>
              <span>Full CRUD management for all modules</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-300 mt-1">✓</span>
              <span>Real-time Firestore synchronization</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-300 mt-1">✓</span>
              <span>Role-based access control</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-300 mt-1">✓</span>
              <span>Search, filter, and pagination support</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
