'use client';

import React, { useEffect, useState, useCallback, FormEvent } from 'react';
import { 
  Users, 
  UserCheck, 
  Loader2, 
  RefreshCw, 
  Smartphone, 
  Search, 
  X, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  Phone, 
  Copy, 
  Check, 
  Clock, 
  Ban, 
  AlertTriangle, 
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

interface TrackingStats {
  totalLogins: number;
  liveNow: number;
  blocked: number;
  suspended: number;
}

interface StudentUser {
  id: string;
  phoneNumber: string;
  name: string;
  email?: string;
  lastActive?: string;
  createdAt?: string;
  status: 'active' | 'inactive' | 'blocked' | 'suspended';
  isBlocked: boolean;
  blockReason?: string;
  isSuspended: boolean;
  suspendReason?: string;
  suspendedUntil?: string;
}

const getApiBaseUrl = (): string => {
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '');
  }
  return 'http://201.18.192.154:3001/api';
};

async function apiRequest<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as any),
  };

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || data.error || `HTTP ${res.status}: ${res.statusText}`);
  }
  return data as T;
}

function formatDate(dateStr?: string | Date | null): string {
  if (!dateStr) return 'Not available';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  } catch (_) {
    return String(dateStr);
  }
}

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  colorClass: string;
}

function StatCard({ icon: Icon, label, value, colorClass }: StatCardProps) {
  const bgClass = colorClass.replace('border-', 'bg-').replace('text-', 'bg-');
  const textClass = colorClass.replace('border-', 'text-');

  return (
    <div className={`bg-white rounded-xl shadow-sm border p-6 border-l-4 ${colorClass}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm font-medium">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`p-4 rounded-xl ${bgClass} bg-opacity-10`}>
          <Icon className={`w-7 h-7 ${textClass}`} />
        </div>
      </div>
    </div>
  );
}

export default function StudentTrackingPage() {
  const [stats, setStats] = useState<TrackingStats>({
    totalLogins: 0,
    liveNow: 0,
    blocked: 0,
    suspended: 0,
  });
  const [students, setStudents] = useState<StudentUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Search & Filter state
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'blocked' | 'suspended'>('all');
  const [pageSize, setPageSize] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalStudents, setTotalStudents] = useState<number>(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal State
  const [activeModal, setActiveModal] = useState<'block' | 'suspend' | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<StudentUser | null>(null);
  const [reasonText, setReasonText] = useState('');
  const [suspendDuration, setSuspendDuration] = useState<'1h' | '1d' | '3d' | '7d' | '30d' | 'custom'>('1d');
  const [customUntilDate, setCustomUntilDate] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setFeedbackMessage({ type, text });
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 4500);
  };

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (searchQuery.trim()) queryParams.set('search', searchQuery.trim());
      if (statusFilter !== 'all') queryParams.set('status', statusFilter);
      queryParams.set('page', currentPage.toString());
      queryParams.set('limit', pageSize.toString());

      const res = await apiRequest<any>(`/admin/students?${queryParams.toString()}`);

      if (res && res.success) {
        setStudents(res.students || []);
        setTotalStudents(res.total || 0);
        setTotalPages(res.totalPages || 1);
        if (res.stats) {
          setStats({
            totalLogins: res.stats.totalLogins || 0,
            liveNow: res.stats.liveNow || 0,
            blocked: res.stats.blocked || 0,
            suspended: res.stats.suspended || 0,
          });
        }
      } else {
        throw new Error(res?.error || res?.message || 'Failed to fetch students data');
      }
    } catch (err: any) {
      console.error('Error fetching students:', err);
      showToast('error', err.message || 'Unable to connect to backend.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, currentPage, pageSize]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleSearchSubmit = (e?: FormEvent) => {
    if (e) e.preventDefault();
    setSearchQuery(searchInput);
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (status: 'all' | 'active' | 'inactive' | 'blocked' | 'suspended') => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  // Block Student
  const handleOpenBlockModal = (student: StudentUser) => {
    setSelectedStudent(student);
    setReasonText('Violated terms of service');
    setActiveModal('block');
  };

  const handleConfirmBlock = async () => {
    if (!selectedStudent) return;
    setActionLoading(true);
    try {
      const res = await apiRequest<any>(`/admin/students/${selectedStudent.id}/block`, {
        method: 'POST',
        body: JSON.stringify({
          reason: reasonText.trim() || 'Account blocked by administrator',
        }),
      });

      if (res && res.success) {
        showToast('success', `${selectedStudent.name || 'Student'} has been blocked and logged out.`);
        setActiveModal(null);
        fetchStudents();
      } else {
        throw new Error(res?.message || 'Failed to block student');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Error blocking student');
    } finally {
      setActionLoading(false);
    }
  };

  // Unblock Student
  const handleUnblock = async (student: StudentUser) => {
    if (!confirm(`Are you sure you want to unblock ${student.name || 'this student'}? They will be allowed to log in again.`)) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await apiRequest<any>(`/admin/students/${student.id}/unblock`, {
        method: 'POST',
      });
      if (res && res.success) {
        showToast('success', `${student.name || 'Student'} has been unblocked.`);
        fetchStudents();
      } else {
        throw new Error(res?.message || 'Failed to unblock student');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Error unblocking student');
    } finally {
      setActionLoading(false);
    }
  };

  // Suspend Student
  const handleOpenSuspendModal = (student: StudentUser) => {
    setSelectedStudent(student);
    setReasonText('Temporary suspension for review / policy violation');
    setSuspendDuration('1d');
    setCustomUntilDate('');
    setActiveModal('suspend');
  };

  const handleConfirmSuspend = async () => {
    if (!selectedStudent) return;
    setActionLoading(true);
    try {
      const payload: any = {
        reason: reasonText.trim() || 'Account temporarily suspended',
      };

      if (suspendDuration === '1h') payload.durationHours = 1;
      else if (suspendDuration === '1d') payload.durationDays = 1;
      else if (suspendDuration === '3d') payload.durationDays = 3;
      else if (suspendDuration === '7d') payload.durationDays = 7;
      else if (suspendDuration === '30d') payload.durationDays = 30;
      else if (suspendDuration === 'custom' && customUntilDate) {
        payload.until = new Date(customUntilDate).toISOString();
      } else {
        payload.durationDays = 1;
      }

      const res = await apiRequest<any>(`/admin/students/${selectedStudent.id}/suspend`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res && res.success) {
        showToast('success', res.message || `${selectedStudent.name || 'Student'} has been suspended.`);
        setActiveModal(null);
        fetchStudents();
      } else {
        throw new Error(res?.message || 'Failed to suspend student');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Error suspending student');
    } finally {
      setActionLoading(false);
    }
  };

  // Unsuspend Student
  const handleUnsuspend = async (student: StudentUser) => {
    if (!confirm(`Are you sure you want to remove suspension for ${student.name || 'this student'}?`)) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await apiRequest<any>(`/admin/students/${student.id}/unsuspend`, {
        method: 'POST',
      });
      if (res && res.success) {
        showToast('success', `Suspension removed for ${student.name || 'Student'}.`);
        fetchStudents();
      } else {
        throw new Error(res?.message || 'Failed to unsuspend student');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Error unsuspending student');
    } finally {
      setActionLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const exportToCSV = () => {
    if (students.length === 0) return;
    const headers = ['ID', 'Name', 'Phone Number', 'Email', 'Status', 'Blocked', 'Block Reason', 'Suspended', 'Suspend Reason', 'Suspended Until', 'Last Active', 'Registered'];
    const rows = students.map((s) => [
      `"${s.id}"`,
      `"${(s.name || '').replace(/"/g, '""')}"`,
      `"${s.phoneNumber}"`,
      `"${s.email || ''}"`,
      `"${s.status}"`,
      `"${s.isBlocked ? 'Yes' : 'No'}"`,
      `"${(s.blockReason || '').replace(/"/g, '""')}"`,
      `"${s.isSuspended ? 'Yes' : 'No'}"`,
      `"${(s.suspendReason || '').replace(/"/g, '""')}"`,
      `"${s.suspendedUntil || ''}"`,
      `"${s.lastActive || ''}"`,
      `"${s.createdAt || ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `students_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {feedbackMessage && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border text-sm font-medium animate-in slide-in-from-top ${
            feedbackMessage.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {feedbackMessage.type === 'success' ? (
            <Check className="w-5 h-5 text-green-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600" />
          )}
          <span>{feedbackMessage.text}</span>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="ml-2 text-gray-400 hover:text-gray-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Student Tracking & Control</h1>
          <p className="text-gray-500 text-sm mt-1">
            Real-time VPS student monitoring, search, blocking with reason, and timed suspensions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportToCSV}
            disabled={students.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-40 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4 text-gray-500" />
            Export CSV
          </button>
          <button
            onClick={fetchStudents}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard 
          icon={Smartphone} 
          label="Total Registered Users" 
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
          icon={Ban} 
          label="Blocked Students" 
          value={stats.blocked} 
          colorClass="border-red-500" 
        />
        <StatCard 
          icon={AlertTriangle} 
          label="Suspended Students" 
          value={stats.suspended} 
          colorClass="border-amber-500" 
        />
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Filter and Search Bar */}
        <div className="p-5 border-b border-gray-100 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by student name, phone (+91...), ID..."
                className="w-full pl-10 pr-20 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {searchInput && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="submit"
                  className="px-2.5 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700"
                >
                  Search
                </button>
              </div>
            </form>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg flex-wrap">
              <button
                onClick={() => handleStatusFilterChange('all')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  statusFilter === 'all'
                    ? 'bg-white text-gray-900 shadow-sm font-semibold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                All ({stats.totalLogins})
              </button>
              <button
                onClick={() => handleStatusFilterChange('active')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  statusFilter === 'active'
                    ? 'bg-white text-green-700 shadow-sm font-semibold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Active ({stats.liveNow})
              </button>
              <button
                onClick={() => handleStatusFilterChange('inactive')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  statusFilter === 'inactive'
                    ? 'bg-white text-gray-900 shadow-sm font-semibold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Inactive
              </button>
              <button
                onClick={() => handleStatusFilterChange('blocked')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  statusFilter === 'blocked'
                    ? 'bg-white text-red-700 shadow-sm font-semibold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Blocked ({stats.blocked})
              </button>
              <button
                onClick={() => handleStatusFilterChange('suspended')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  statusFilter === 'suspended'
                    ? 'bg-white text-amber-700 shadow-sm font-semibold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Suspended ({stats.suspended})
              </button>
            </div>
          </div>

          {/* Results Summary and Page Size */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-gray-500 pt-1 gap-2">
            <span>
              Showing {students.length} of {totalStudents} {totalStudents === 1 ? 'student' : 'students'}
              {statusFilter !== 'all' && ` (Filter: ${statusFilter})`}
              {searchQuery && ` matching "${searchQuery}"`}
            </span>
            
            <div className="flex items-center gap-2">
              <span>Show per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-gray-50 border border-gray-200 text-gray-700 text-xs rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={-1}>All ({totalStudents})</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table / Loader */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
              <p className="text-gray-600 text-sm font-medium">Loading students from VPS backend...</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50/80 text-gray-600 text-xs uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3.5 font-semibold">Student Name</th>
                  <th className="px-6 py-3.5 font-semibold">Phone Number</th>
                  <th className="px-6 py-3.5 font-semibold">Status / Restrictions</th>
                  <th className="px-6 py-3.5 font-semibold">Last Active</th>
                  <th className="px-6 py-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      <Users className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                      <p className="font-medium text-gray-700">No students found</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {searchQuery || statusFilter !== 'all' 
                          ? 'Try clearing your search query or status filter.' 
                          : 'No user records currently exist.'}
                      </p>
                      {(searchQuery || statusFilter !== 'all') && (
                        <button
                          onClick={() => {
                            setSearchInput('');
                            setSearchQuery('');
                            setStatusFilter('all');
                          }}
                          className="mt-3 text-xs text-blue-600 hover:underline font-medium"
                        >
                          Reset filters
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  students.map((student) => {
                    const firstLetter = (student.name || 'S').trim().charAt(0).toUpperCase();
                    const isCopied = copiedId === student.id;

                    return (
                      <tr key={student.id} className="hover:bg-blue-50/30 transition-colors">
                        {/* Name & ID */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full text-white font-bold text-sm flex items-center justify-center flex-shrink-0 shadow-xs ${
                              student.isBlocked
                                ? 'bg-red-600'
                                : student.isSuspended
                                ? 'bg-amber-600'
                                : 'bg-gradient-to-tr from-blue-600 to-indigo-600'
                            }`}>
                              {firstLetter}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-gray-900 truncate">
                                {student.name || 'Student'}
                              </div>
                              <div className="text-xs text-gray-400 flex items-center gap-1.5 font-mono">
                                <span className="truncate max-w-[140px] sm:max-w-none">ID: {student.id}</span>
                                <button
                                  onClick={() => copyToClipboard(student.id, student.id)}
                                  className="text-gray-400 hover:text-gray-600 p-0.5"
                                  title="Copy Student ID"
                                >
                                  {isCopied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Phone */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-gray-700 font-medium">
                            <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span>{student.phoneNumber}</span>
                            {student.phoneNumber && student.phoneNumber !== 'N/A' && (
                              <button
                                onClick={() => copyToClipboard(student.phoneNumber, `phone-${student.id}`)}
                                className="text-gray-400 hover:text-gray-600 p-0.5"
                                title="Copy Phone Number"
                              >
                                {copiedId === `phone-${student.id}` ? (
                                  <Check className="w-3 h-3 text-green-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Status & Restriction details */}
                        <td className="px-6 py-4">
                          {student.isBlocked ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                                <Ban className="w-3 h-3 text-red-600" />
                                Blocked
                              </span>
                              {student.blockReason && (
                                <p className="text-xs text-red-600 italic max-w-xs truncate" title={student.blockReason}>
                                  Reason: {student.blockReason}
                                </p>
                              )}
                            </div>
                          ) : student.isSuspended ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                Suspended
                              </span>
                              {student.suspendedUntil && (
                                <p className="text-xs text-amber-700">
                                  Until: {formatDate(student.suspendedUntil)}
                                </p>
                              )}
                              {student.suspendReason && (
                                <p className="text-xs text-amber-600 italic max-w-xs truncate" title={student.suspendReason}>
                                  Reason: {student.suspendReason}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium capitalize
                                ${
                                  student.status === 'active'
                                    ? 'bg-green-50 text-green-700 border border-green-200'
                                    : 'bg-gray-100 text-gray-700 border border-gray-200'
                                }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  student.status === 'active'
                                    ? 'bg-green-500 animate-pulse'
                                    : 'bg-gray-400'
                                }`}
                              />
                              {student.status}
                            </span>
                          )}
                        </td>

                        {/* Last Active */}
                        <td className="px-6 py-4 text-gray-600 text-xs">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            <span>{formatDate(student.lastActive)}</span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {student.isBlocked ? (
                              <button
                                onClick={() => handleUnblock(student)}
                                disabled={actionLoading}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 border border-green-300 rounded-lg text-xs font-medium transition-colors"
                                title="Unblock Student"
                              >
                                <ShieldCheck className="w-3.5 h-3.5" />
                                Unblock
                              </button>
                            ) : student.isSuspended ? (
                              <button
                                onClick={() => handleUnsuspend(student)}
                                disabled={actionLoading}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-300 rounded-lg text-xs font-medium transition-colors"
                                title="Remove Suspension"
                              >
                                <ShieldCheck className="w-3.5 h-3.5" />
                                Unsuspend
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleOpenSuspendModal(student)}
                                  disabled={actionLoading}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-300 rounded-lg text-xs font-medium transition-colors"
                                  title="Suspend Student with Duration"
                                >
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  Suspend
                                </button>
                                <button
                                  onClick={() => handleOpenBlockModal(student)}
                                  disabled={actionLoading}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 border border-red-300 rounded-lg text-xs font-medium transition-colors"
                                  title="Permanently Block Student"
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                  Block
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {pageSize !== -1 && totalPages > 1 && (
          <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between text-sm">
            <div className="text-gray-500 text-xs">
              Page {currentPage} of {totalPages} ({totalStudents} total students)
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1 || loading}
                className="p-1.5 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = i + 1;
                if (totalPages > 5 && currentPage > 3) {
                  pageNum = Math.min(currentPage - 2 + i, totalPages - (4 - i));
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-md text-xs font-medium transition-colors ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || loading}
                className="p-1.5 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Block Confirmation Modal */}
      {activeModal === 'block' && selectedStudent && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-red-600">
                <Ban className="w-5 h-5" />
                <h3 className="font-bold text-lg text-gray-900">Block Student</h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                You are about to block <strong className="text-gray-900">{selectedStudent.name || 'Student'}</strong> ({selectedStudent.phoneNumber}).
              </p>
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                ⚠️ The student will be <strong>instantly logged out</strong> of their active mobile app session and prevented from logging in.
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Reason for blocking (shown to student):
                </label>
                <textarea
                  rows={3}
                  value={reasonText}
                  onChange={(e) => setReasonText(e.target.value)}
                  placeholder="e.g. Account suspended due to policy violation or misconduct."
                  className="w-full p-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBlock}
                disabled={actionLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm Block & Force Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend Confirmation Modal */}
      {activeModal === 'suspend' && selectedStudent && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-amber-600">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-bold text-lg text-gray-900">Suspend Student</h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Temporary suspension for <strong className="text-gray-900">{selectedStudent.name || 'Student'}</strong> ({selectedStudent.phoneNumber}).
              </p>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Suspension Duration:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: '1h', label: '1 Hour' },
                    { id: '1d', label: '24 Hours' },
                    { id: '3d', label: '3 Days' },
                    { id: '7d', label: '7 Days' },
                    { id: '30d', label: '30 Days' },
                    { id: 'custom', label: 'Custom Date' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSuspendDuration(opt.id as any)}
                      className={`py-1.5 px-2 text-xs font-medium rounded-lg border text-center transition-all ${
                        suspendDuration === opt.id
                          ? 'bg-amber-500 text-white border-amber-600 font-semibold shadow-xs'
                          : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {suspendDuration === 'custom' && (
                  <div className="mt-2">
                    <label className="block text-xs text-gray-500 mb-1">Suspended Until:</label>
                    <input
                      type="datetime-local"
                      value={customUntilDate}
                      onChange={(e) => setCustomUntilDate(e.target.value)}
                      className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Reason for suspension (shown to student):
                </label>
                <textarea
                  rows={2}
                  value={reasonText}
                  onChange={(e) => setReasonText(e.target.value)}
                  placeholder="e.g. Account suspended for spamming doubts / violation."
                  className="w-full p-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                ⏳ The student will be <strong>instantly logged out</strong> and cannot log in until the suspension period expires or an admin unsuspends them.
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSuspend}
                disabled={actionLoading || (suspendDuration === 'custom' && !customUntilDate)}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-semibold hover:bg-amber-700 disabled:opacity-50 flex items-center gap-2"
              >
                {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm Suspend & Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
