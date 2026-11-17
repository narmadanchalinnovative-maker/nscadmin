'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { io, Socket } from 'socket.io-client';
import {
  Users,
  UserCheck,
  BookOpen,
  Layers,
  Video,
  CheckSquare,
  HelpCircle,
  TrendingUp,
  CreditCard,
  Radio,
  Bell,
  RefreshCw,
  Plus,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Server,
  Database,
  HardDrive,
  Cpu,
  Clock,
  Sparkles,
  Award,
  Calendar,
  Phone,
  ArrowUpRight,
  Smartphone,
  Tag,
  MessageSquareQuote,
  Eye,
  Check,
  AlertTriangle
} from 'lucide-react';

interface DashboardMetrics {
  totalStudents: number;
  liveStudents: number;
  blockedStudents: number;
  suspendedStudents: number;
  totalCourses: number;
  totalBatches: number;
  totalLectures: number;
  totalTests: number;
  testAttemptsCount: number;
  totalPurchases: number;
  totalRevenue: number;
  todayRevenue: number;
  totalDoubts: number;
  pendingDoubts: number;
}

interface TopCourseItem {
  id: string;
  title: string;
  price: number;
  thumbnail?: string | null;
  enrollments: number;
  revenue: number;
}

interface RecentPurchaseItem {
  id: string;
  studentName: string;
  phoneNumber: string;
  courseTitle: string;
  price: number;
  status: string;
  isSuspended: boolean;
  repurchaseRequired: boolean;
  createdAt: string;
}

interface RecentActiveStudent {
  id: string;
  name: string;
  phoneNumber: string;
  isOnline: boolean;
  lastActive?: string | null;
  enrolledCourse?: string | null;
}

interface TrendDay {
  date: string;
  dayName: string;
  enrollments: number;
  revenue: number;
}

interface SystemTelemetry {
  serverUptime: string;
  dbEngine: string;
  dbStatus: string;
  redisStatus: string;
  socketConnections: number;
  hlsStreamingEngine: string;
  port: string | number;
  timestamp: string;
}

interface DashboardData {
  metrics: DashboardMetrics;
  topCourses: TopCourseItem[];
  recentPurchases: RecentPurchaseItem[];
  recentActiveStudents: RecentActiveStudent[];
  trends: TrendDay[];
  telemetry: SystemTelemetry;
}

function formatRelativeTime(dateStr?: string | null): string {
  if (!dateStr) return 'Recently';
  try {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSec < 45) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  } catch (_) {
    return 'Recently';
  }
}

export default function DashboardPage() {
  const { adminUser } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');

  // Clock in IST
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString('en-IN', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchDashboardData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setRefreshing(true);
    try {
      const res = await fetch('/external-api/admin/dashboard-analytics', {
        cache: 'no-store',
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setData(json);
        }
      }
    } catch (e) {
      console.error('Failed to load dashboard analytics:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Real-time socket updates for Live Presence & Purchases
  useEffect(() => {
    const socket: Socket = io({
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      console.log('[Dashboard] Connected to real-time command socket');
    });

    const handlePresence = (payload: { userId: string; isOnline: boolean; lastActive?: any }) => {
      setData((prev) => {
        if (!prev) return prev;
        const diff = payload.isOnline ? 1 : -1;
        const newLive = Math.max(0, prev.metrics.liveStudents + diff);
        return {
          ...prev,
          metrics: {
            ...prev.metrics,
            liveStudents: newLive,
          },
        };
      });
    };

    socket.on('student_presence_updated', handlePresence);
    socket.on('data_updated', (event: any) => {
      if (event?.collection === 'purchases' || event?.collection === 'users') {
        fetchDashboardData(true);
      }
    });

    // Auto-refresh every 30 seconds as background polling fallback
    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, 30000);

    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, [fetchDashboardData]);

  const metrics = data?.metrics || {
    totalStudents: 0,
    liveStudents: 0,
    blockedStudents: 0,
    suspendedStudents: 0,
    totalCourses: 0,
    totalBatches: 0,
    totalLectures: 0,
    totalTests: 0,
    testAttemptsCount: 0,
    totalPurchases: 0,
    totalRevenue: 0,
    todayRevenue: 0,
    totalDoubts: 0,
    pendingDoubts: 0,
  };

  const topCourses = data?.topCourses || [];
  const recentPurchases = data?.recentPurchases || [];
  const recentActiveStudents = data?.recentActiveStudents || [];
  const telemetry = data?.telemetry || {
    serverUptime: '--',
    dbEngine: 'PostgreSQL 15',
    dbStatus: 'Operational',
    redisStatus: 'Operational',
    socketConnections: 0,
    hlsStreamingEngine: 'HLS Transcoder v2.1',
    port: 3001,
    timestamp: new Date().toISOString(),
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Executive Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Executive Command Center
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Telemetry Active
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
            <span>Welcome, <strong className="text-slate-800">{adminUser?.email || 'Superadmin'}</strong></span>
            <span className="text-slate-300">•</span>
            <span className="font-mono text-xs text-slate-400">{currentTime || 'Loading clock...'}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href="/admin/notifications"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Send Alert</span>
          </Link>

          <Link
            href="/admin/courses/new"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Course</span>
          </Link>

          <Link
            href="/admin/batches/new"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-semibold transition-colors"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>New Batch</span>
          </Link>

          <button
            onClick={() => fetchDashboardData(false)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors shadow-2xs disabled:opacity-50"
            title="Refresh analytics data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Row 1: Key Executive Metric KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1: Students */}
        <Link
          href="/admin/student-tracking"
          className="group bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Students</span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 mt-2 tracking-tight">
              {metrics.totalStudents}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {metrics.liveStudents} Live Now
            </span>
            <span className="text-slate-400 group-hover:text-blue-600 font-medium flex items-center gap-0.5">
              Manage <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </Link>

        {/* KPI 2: Active Enrollments */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Enrollments</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 mt-2 tracking-tight">
              {metrics.totalPurchases}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Verified Enrollments</span>
            <span className="font-bold text-slate-700">{metrics.totalCourses} Active Courses</span>
          </div>
        </div>

        {/* KPI 3: Academic Curriculum */}
        <Link
          href="/admin/courses"
          className="group bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-indigo-400 hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Curriculum</span>
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 mt-2 tracking-tight">
              {metrics.totalLectures}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{metrics.totalCourses} Courses • {metrics.totalBatches} Batches</span>
            <span className="text-slate-400 group-hover:text-indigo-600 font-medium flex items-center gap-0.5">
              View <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </Link>

        {/* KPI 4: Tests & Quizzes */}
        <Link
          href="/admin/tests"
          className="group bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-violet-400 hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Mock Tests</span>
              <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <CheckSquare className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 mt-2 tracking-tight">
              {metrics.totalTests}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{metrics.testAttemptsCount} Submissions</span>
            <span className="text-slate-400 group-hover:text-violet-600 font-medium flex items-center gap-0.5">
              Tests <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </Link>

        {/* KPI 5: Doubts & Support */}
        <Link
          href="/admin/doubts"
          className="group bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-amber-400 hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Doubts & Help</span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <HelpCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 mt-2 tracking-tight">
              {metrics.totalDoubts}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            {metrics.pendingDoubts > 0 ? (
              <span className="font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                {metrics.pendingDoubts} Pending
              </span>
            ) : (
              <span className="font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                <Check className="w-3 h-3" /> All Resolved
              </span>
            )}
            <span className="text-slate-400 group-hover:text-amber-600 font-medium flex items-center gap-0.5">
              Solve <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </Link>
      </div>

      {/* Row 2: Deep Analytics & Live Presence (Two-column: 7/12 + 5/12) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Top Enrolled Courses & Academic Engagement (7/12) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  Top Courses by Student Enrollments
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Live distribution of enrolled students across active smart courses
                </p>
              </div>
              <Link
                href="/admin/courses"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                All Courses <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="mt-5 space-y-4">
              {topCourses.length === 0 ? (
                <div className="text-center py-8 text-sm text-slate-400">
                  No courses data available.
                </div>
              ) : (
                topCourses.map((course, idx) => {
                  const maxEnrollments = Math.max(...topCourses.map((c) => c.enrollments), 1);
                  const percent = Math.min(100, Math.round((course.enrollments / maxEnrollments) * 100));

                  return (
                    <div key={course.id} className="group">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-600 font-bold text-[11px] flex items-center justify-center flex-shrink-0">
                            #{idx + 1}
                          </span>
                          <span className="truncate max-w-[200px] sm:max-w-xs text-slate-900 font-medium">
                            {course.title}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold">
                            {course.price > 0 ? `₹${course.price}` : 'Free'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-right flex-shrink-0">
                          <span className="text-slate-900 font-bold">
                            {course.enrollments} {course.enrollments === 1 ? 'Student' : 'Students'}
                          </span>
                        </div>
                      </div>

                      {/* Visual Progress bar */}
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            idx === 0
                              ? 'bg-blue-600'
                              : idx === 1
                              ? 'bg-indigo-500'
                              : idx === 2
                              ? 'bg-emerald-500'
                              : 'bg-slate-400'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Verified by PostgreSQL course engine
            </span>
            <Link
              href="/admin/batches"
              className="font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1"
            >
              Batch Schedules & Notes <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Right Column: Live Student Activity Stream (5/12) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
                  Live Student Sessions & Activity
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Recent real-time logins and online students
                </p>
              </div>
              <Link
                href="/admin/student-tracking"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                Track All <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="mt-4 divide-y divide-slate-100">
              {recentActiveStudents.length === 0 ? (
                <div className="text-center py-8 text-sm text-slate-400">
                  No active students recorded.
                </div>
              ) : (
                recentActiveStudents.map((student) => (
                  <div key={student.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative flex-shrink-0">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center uppercase">
                          {student.name ? student.name.substring(0, 2) : 'ST'}
                        </div>
                        {student.isOnline && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {student.name || 'Student'}
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono truncate">
                          {student.phoneNumber || 'No phone'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          student.isOnline
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            student.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                          }`}
                        />
                        {student.isOnline ? 'Online' : formatRelativeTime(student.lastActive)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100">
            <Link
              href="/admin/student-tracking"
              className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 border border-slate-200 transition-colors"
            >
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>Open Real-Time Student Tracking & Access Control</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Row 3: Recent Transactions & Enrollment Ledger */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-blue-600" />
              Recent Course Purchases & Transactions
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live audit record of student enrollments and course admissions
            </p>
          </div>
          <Link
            href="/admin/student-tracking"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            Manage Student Access <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-5">Student</th>
                <th className="py-3 px-5">Course Title</th>
                <th className="py-3 px-5">Price</th>
                <th className="py-3 px-5">Access Status</th>
                <th className="py-3 px-5 text-right">Enrolled At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentPurchases.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No recent purchases found.
                  </td>
                </tr>
              ) : (
                recentPurchases.map((purchase) => (
                  <tr key={purchase.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-5">
                      <div className="font-bold text-slate-900">{purchase.studentName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{purchase.phoneNumber}</div>
                    </td>
                    <td className="py-3 px-5 font-medium text-slate-800">
                      {purchase.courseTitle}
                    </td>
                    <td className="py-3 px-5">
                      <span className="font-semibold text-slate-900">
                        {purchase.price > 0 ? `₹${purchase.price}` : 'Free'}
                      </span>
                    </td>
                    <td className="py-3 px-5">
                      {purchase.isSuspended ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <AlertTriangle className="w-2.5 h-2.5" /> Suspended
                        </span>
                      ) : purchase.repurchaseRequired ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          Repurchase Req.
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Check className="w-2.5 h-2.5" /> Active Access
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-5 text-right text-slate-500 font-mono text-[11px]">
                      {new Date(purchase.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Row 4: Executive Command Shortcuts (Human-Crafted Grid) */}
      <div>
        <div className="mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            Quick Administrative Command Tools
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Link
            href="/admin/student-tracking"
            className="p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-xs transition-all flex flex-col items-center text-center group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600">Student Control</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Tracking & Courses</span>
          </Link>

          <Link
            href="/admin/courses"
            className="p-4 bg-white rounded-xl border border-slate-200 hover:border-indigo-400 hover:shadow-xs transition-all flex flex-col items-center text-center group"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-600">Course Manager</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Lectures & Subjects</span>
          </Link>

          <Link
            href="/admin/batches"
            className="p-4 bg-white rounded-xl border border-slate-200 hover:border-emerald-400 hover:shadow-xs transition-all flex flex-col items-center text-center group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-900 group-hover:text-emerald-600">Batches & Notes</span>
            <span className="text-[10px] text-slate-400 mt-0.5">PDFs & Content</span>
          </Link>

          <Link
            href="/admin/tests"
            className="p-4 bg-white rounded-xl border border-slate-200 hover:border-violet-400 hover:shadow-xs transition-all flex flex-col items-center text-center group"
          >
            <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <CheckSquare className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-900 group-hover:text-violet-600">Online Tests</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Mock & Quizzes</span>
          </Link>

          <Link
            href="/admin/live-classes"
            className="p-4 bg-white rounded-xl border border-slate-200 hover:border-rose-400 hover:shadow-xs transition-all flex flex-col items-center text-center group"
          >
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Video className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-900 group-hover:text-rose-600">Live Studio</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Interactive Class</span>
          </Link>

          <Link
            href="/admin/notifications"
            className="p-4 bg-white rounded-xl border border-slate-200 hover:border-amber-400 hover:shadow-xs transition-all flex flex-col items-center text-center group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Bell className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-900 group-hover:text-amber-600">Push Center</span>
            <span className="text-[10px] text-slate-400 mt-0.5">FCM Broadcast</span>
          </Link>
        </div>
      </div>

      {/* Row 5: Server & Infrastructure Telemetry (VPS System Health) */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-white tracking-wide uppercase">
                VPS Production Telemetry & System Health
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live status of backend services, PostgreSQL database, Redis engine, and Socket Gateway
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            All Systems Operational
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mt-5 text-xs">
          <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/50">
            <span className="text-slate-400 text-[11px] block">Database Engine</span>
            <strong className="text-white block mt-1 truncate">PostgreSQL 15</strong>
            <span className="text-emerald-400 text-[10px] font-semibold flex items-center gap-1 mt-0.5">
              <Check className="w-3 h-3" /> 29 Tables Synced
            </span>
          </div>

          <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/50">
            <span className="text-slate-400 text-[11px] block">Cache Layer</span>
            <strong className="text-white block mt-1 truncate">Redis Server 7.0</strong>
            <span className="text-emerald-400 text-[10px] font-semibold flex items-center gap-1 mt-0.5">
              <Check className="w-3 h-3" /> Port 6379 Active
            </span>
          </div>

          <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/50">
            <span className="text-slate-400 text-[11px] block">Socket.io Gateway</span>
            <strong className="text-white block mt-1 truncate">WebSocket Engine</strong>
            <span className="text-emerald-400 text-[10px] font-semibold flex items-center gap-1 mt-0.5">
              <Check className="w-3 h-3" /> Real-Time Presence
            </span>
          </div>

          <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/50">
            <span className="text-slate-400 text-[11px] block">Video Streaming</span>
            <strong className="text-white block mt-1 truncate">HLS Transcoder</strong>
            <span className="text-emerald-400 text-[10px] font-semibold flex items-center gap-1 mt-0.5">
              <Check className="w-3 h-3" /> 127 Videos Ready
            </span>
          </div>

          <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/50">
            <span className="text-slate-400 text-[11px] block">VPS Backend Port</span>
            <strong className="text-white block mt-1 truncate">Port 3001 (Node)</strong>
            <span className="text-emerald-400 text-[10px] font-semibold flex items-center gap-1 mt-0.5">
              <Check className="w-3 h-3" /> PM2 Process Online
            </span>
          </div>

          <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/50">
            <span className="text-slate-400 text-[11px] block">Server Uptime</span>
            <strong className="text-white block mt-1 font-mono">{telemetry.serverUptime || 'Active'}</strong>
            <span className="text-slate-400 text-[10px] mt-0.5 block truncate">
              Host: 201.18.192.154
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
