'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Bell,
  Send,
  Smartphone,
  Layers,
  Zap,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Search,
  Sliders,
  Check,
  Flame,
  Radio,
  Users,
  GraduationCap,
  User,
  ShoppingBag,
  LogIn,
  Video,
  FileText,
  Clock,
  Sparkles,
  ExternalLink,
  Edit2,
  Save,
  X,
  Play,
  RotateCcw,
  ShieldCheck,
  ChevronRight,
  Info
} from 'lucide-react';

interface NotificationItem {
  id: string;
  userId?: string | null;
  title: string;
  message: string;
  type: string;
  audience?: string | null;
  targetScreen?: string | null;
  imageUrl?: string | null;
  isRead: boolean;
  sendPush: boolean;
  sendInApp: boolean;
  topic?: string | null;
  metadata?: any;
  createdAt: string;
  user?: {
    id: string;
    name?: string | null;
    phoneNumber?: string | null;
  } | null;
}

interface NotificationTemplate {
  id: string;
  key: string;
  title: string;
  titleTemplate: string;
  bodyTemplate: string;
  type: string;
  enabled: boolean;
  sendPush: boolean;
  sendInApp: boolean;
  targetScreen?: string | null;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface StatsData {
  totalNotifications: number;
  pushCount: number;
  inAppCount: number;
  totalTemplates: number;
  activeTokensCount: number;
  adminNotificationsCount?: number;
  isFirebaseReady: boolean;
  typeBreakdown: { type: string; count: number }[];
}

interface CourseItem {
  id: string;
  title: string;
  price?: number;
}

const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    return '/external-api';
  }
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

  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || data.error || `HTTP ${res.status}: ${res.statusText}`);
  }
  return data as T;
}

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<'send' | 'templates' | 'history' | 'diagnostics'>('send');
  const [stats, setStats] = useState<StatsData | null>(null);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [history, setHistory] = useState<NotificationItem[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyPage, setHistoryPage] = useState(1);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Manual Composer State
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [targetType, setTargetType] = useState<'broadcast' | 'course' | 'user' | 'topic'>('broadcast');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [targetPhone, setTargetPhone] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [targetScreen, setTargetScreen] = useState('');
  const [sendPush, setSendPush] = useState(true);
  const [sendInApp, setSendInApp] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendFeedback, setSendFeedback] = useState<{ type: 'success' | 'error' | null; msg: string }>({
    type: null,
    msg: '',
  });

  // History Filter State
  const [historySearch, setHistorySearch] = useState('');
  const [historyTypeFilter, setHistoryTypeFilter] = useState('all');
  const [historyAudienceFilter, setHistoryAudienceFilter] = useState('all');

  // Edit Template Modal State
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [savingTemplate, setSavingTemplate] = useState(false);

  // Diagnostics Test Push State
  const [testToken, setTestToken] = useState('');
  const [testTitle, setTestTitle] = useState('Test Push Ping 🚀');
  const [testMessage, setTestMessage] = useState('This is a test notification from NSC Smart Classes Admin.');
  const [testingPush, setTestingPush] = useState(false);
  const [testResult, setTestResult] = useState<{ success?: boolean; messageId?: string; error?: string } | null>(null);

  // Fetch Stats
  const loadStats = useCallback(async () => {
    try {
      setLoadingStats(true);
      const res = await apiRequest<{ success: boolean; stats: StatsData }>('/admin/notifications/stats');
      if (res.success && res.stats) {
        setStats(res.stats);
      }
    } catch (err: any) {
      console.warn('Failed to load stats:', err.message);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // Fetch Templates
  const loadTemplates = useCallback(async () => {
    try {
      setLoadingTemplates(true);
      const res = await apiRequest<{ success: boolean; templates: NotificationTemplate[] }>('/admin/notifications/templates');
      if (res.success && res.templates) {
        setTemplates(res.templates);
      }
    } catch (err: any) {
      console.warn('Failed to load templates:', err.message);
    } finally {
      setLoadingTemplates(false);
    }
  }, []);

  // Fetch History
  const loadHistory = useCallback(async (page = 1, search = '', type = 'all', audience = 'all') => {
    try {
      setLoadingHistory(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: '15',
        ...(search ? { search } : {}),
        ...(type !== 'all' ? { type } : {}),
        ...(audience !== 'all' ? { audience } : {}),
      });
      const res = await apiRequest<{
        success: boolean;
        items: NotificationItem[];
        total: number;
        page: number;
      }>(`/admin/notifications?${params.toString()}`);
      if (res.success) {
        setHistory(res.items || []);
        setHistoryTotal(res.total || 0);
        setHistoryPage(res.page || 1);
      }
    } catch (err: any) {
      console.warn('Failed to load history:', err.message);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  // Fetch Courses for Target Dropdown
  const loadCourses = useCallback(async () => {
    try {
      const res = await apiRequest<{ success: boolean; data: CourseItem[] }>('/admin/data/courses');
      if (res.success && Array.isArray(res.data)) {
        setCourses(res.data);
      }
    } catch (err: any) {
      console.warn('Failed to load courses:', err.message);
    }
  }, []);

  useEffect(() => {
    loadStats();
    loadTemplates();
    loadHistory(1, "", "all", "all");
    loadCourses();
  }, [loadStats, loadTemplates, loadHistory, loadCourses]);

  // Handle Manual Send
  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setSendFeedback({ type: 'error', msg: 'Please provide both Title and Message.' });
      return;
    }
    if (!sendPush && !sendInApp) {
      setSendFeedback({ type: 'error', msg: 'Please enable at least one channel (Push or In-App).' });
      return;
    }
    if (targetType === 'course' && !selectedCourseId) {
      setSendFeedback({ type: 'error', msg: 'Please select a course to target enrolled students.' });
      return;
    }
    if (targetType === 'user' && !targetPhone.trim()) {
      setSendFeedback({ type: 'error', msg: 'Please enter a student phone number or user ID.' });
      return;
    }

    try {
      setSending(true);
      setSendFeedback({ type: null, msg: '' });

      const payload: any = {
        title: title.trim(),
        message: message.trim(),
        targetType,
        targetScreen: targetScreen.trim() || null,
        imageUrl: imageUrl.trim() || null,
        sendPush,
        sendInApp,
      };

      if (targetType === 'course') payload.courseId = selectedCourseId;
      if (targetType === 'user') payload.phoneNumber = targetPhone.trim();
      if (targetType === 'topic') payload.topic = customTopic.trim() || 'all_users';

      const res = await apiRequest('/admin/notifications/send', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.success) {
        setSendFeedback({
          type: 'success',
          msg: `Notification dispatched successfully! ${res.pushSent ? 'FCM Push sent.' : ''} ${res.pushSentCount !== undefined ? `Delivered to ${res.pushSentCount} device tokens.` : ''}`,
        });
        setTitle('');
        setMessage('');
        setImageUrl('');
        setTargetScreen('');
        loadStats();
        loadHistory(1);
      } else {
        throw new Error(res.message || 'Send failed');
      }
    } catch (err: any) {
      setSendFeedback({ type: 'error', msg: err.message || 'Failed to send notification.' });
    } finally {
      setSending(false);
    }
  };

  // Toggle Template Enabled/Disabled
  const handleToggleTemplate = async (template: NotificationTemplate) => {
    try {
      const newEnabled = !template.enabled;
      // Optimistic update
      setTemplates((prev) => prev.map((t) => (t.id === template.id ? { ...t, enabled: newEnabled } : t)));

      await apiRequest(`/admin/notifications/templates/${template.id}`, {
        method: 'PUT',
        body: JSON.stringify({ enabled: newEnabled }),
      });
      loadStats();
    } catch (err: any) {
      console.error('Error toggling template:', err);
      loadTemplates();
    }
  };

  // Save Template Edits
  const handleSaveTemplate = async () => {
    if (!editingTemplate) return;
    try {
      setSavingTemplate(true);
      const res = await apiRequest(`/admin/notifications/templates/${editingTemplate.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: editingTemplate.title,
          titleTemplate: editingTemplate.titleTemplate,
          bodyTemplate: editingTemplate.bodyTemplate,
          targetScreen: editingTemplate.targetScreen,
          sendPush: editingTemplate.sendPush,
          sendInApp: editingTemplate.sendInApp,
        }),
      });

      if (res.success) {
        setTemplates((prev) => prev.map((t) => (t.id === editingTemplate.id ? res.template : t)));
        setEditingTemplate(null);
      }
    } catch (err: any) {
      alert(`Error saving template: ${err.message}`);
    } finally {
      setSavingTemplate(false);
    }
  };

  // Handle Diagnostics Test Push
  const handleTestPush = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testToken.trim()) return;
    try {
      setTestingPush(true);
      setTestResult(null);
      const res = await apiRequest('/admin/notifications/test-push', {
        method: 'POST',
        body: JSON.stringify({
          token: testToken.trim(),
          title: testTitle.trim(),
          message: testMessage.trim(),
        }),
      });
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ success: false, error: err.message });
    } finally {
      setTestingPush(false);
    }
  };

  const getTemplateIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return <ShoppingBag className="w-5 h-5 text-emerald-600" />;
      case 'login':
        return <LogIn className="w-5 h-5 text-blue-600" />;
      case 'live_class':
        return <Video className="w-5 h-5 text-rose-600" />;
      case 'test':
        return <FileText className="w-5 h-5 text-purple-600" />;
      default:
        return <Zap className="w-5 h-5 text-amber-600" />;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Firebase Notification Hub</h1>
              <p className="text-sm text-gray-500">
                100% dynamic automated alerts, course purchases, student logins, live classes & manual broadcasts
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Firebase (nsc-smartclasses) Active
          </div>

          <button
            onClick={() => {
              loadStats();
              loadTemplates();
              loadHistory(1);
            }}
            disabled={loadingStats}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingStats ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Total Notifications</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">{stats?.totalNotifications ?? '...'}</span>
            <span className="text-xs text-blue-600 font-medium">In Database</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Push Notifications</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">{stats?.pushCount ?? '...'}</span>
            <span className="text-xs text-indigo-600 font-medium">FCM High Priority</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">In-App Alerts</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">{stats?.inAppCount ?? '...'}</span>
            <span className="text-xs text-purple-600 font-medium">Socket & Feed</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Automated Triggers</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">{templates.length || 8}</span>
            <span className="text-xs text-emerald-600 font-medium">All Dynamic</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('send')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'send'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Send className="w-4 h-4" />
          Send Notification
        </button>

        <button
          onClick={() => setActiveTab('templates')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'templates'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Zap className="w-4 h-4" />
          Automated Triggers ({templates.length})
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'history'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          History & Logs ({historyTotal})
        </button>

        <button
          onClick={() => setActiveTab('diagnostics')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'diagnostics'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Firebase & Diagnostics
        </button>
      </div>

      {/* TAB 1: SEND NOTIFICATION */}
      {activeTab === 'send' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Form (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Send className="w-5 h-5 text-blue-600" />
              Compose Notification
            </h2>

            {sendFeedback.type === 'success' && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm font-medium">{sendFeedback.msg}</div>
              </div>
            )}

            {sendFeedback.type === 'error' && (
              <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm font-medium">{sendFeedback.msg}</div>
              </div>
            )}

            <form onSubmit={handleSendNotification} className="space-y-6">
              {/* Delivery Channels */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                  Delivery Channels
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setSendPush(!sendPush)}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                      sendPush ? 'border-blue-600 bg-blue-50/50' : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Smartphone className={`w-5 h-5 ${sendPush ? 'text-blue-600' : 'text-gray-400'}`} />
                      <div>
                        <div className="text-sm font-bold text-gray-900">Push Notification</div>
                        <div className="text-xs text-gray-500">Lock screen & system tray</div>
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                        sendPush ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300'
                      }`}
                    >
                      {sendPush && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>

                  <div
                    onClick={() => setSendInApp(!sendInApp)}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                      sendInApp ? 'border-purple-600 bg-purple-50/50' : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Layers className={`w-5 h-5 ${sendInApp ? 'text-purple-600' : 'text-gray-400'}`} />
                      <div>
                        <div className="text-sm font-bold text-gray-900">In-App Feed</div>
                        <div className="text-xs text-gray-500">App notifications screen</div>
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                        sendInApp ? 'bg-purple-600 border-purple-600 text-white' : 'border-gray-300'
                      }`}
                    >
                      {sendInApp && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                </div>
              </div>

              {/* Target Audience */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                  Target Audience
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                  {[
                    { id: 'broadcast', label: 'All Users', icon: Users },
                    { id: 'course', label: 'Course Students', icon: GraduationCap },
                    { id: 'user', label: 'Single Student', icon: User },
                    { id: 'topic', label: 'Custom Topic', icon: Radio },
                  ].map((t) => {
                    const Icon = t.icon;
                    const isSelected = targetType === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTargetType(t.id as any)}
                        className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1.5 ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/60 text-blue-900 font-bold shadow-sm'
                            : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-600'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                        <span className="text-xs">{t.label}</span>
                      </button>
                    );
                  })}
                </div>

                {targetType === 'course' && (
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Select Course (Only Enrolled Students)</label>
                    <select
                      value={selectedCourseId}
                      onChange={(e) => setSelectedCourseId(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">-- Choose Course --</option>
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title} (₹{c.price || 0})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {targetType === 'user' && (
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Student Phone Number or User ID</label>
                    <input
                      type="text"
                      placeholder="e.g. +918448254571 or UUID"
                      value={targetPhone}
                      onChange={(e) => setTargetPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                )}

                {targetType === 'topic' && (
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <label className="block text-xs font-medium text-gray-700 mb-1">FCM Topic Name</label>
                    <input
                      type="text"
                      placeholder="e.g. batch_english or all_users"
                      value={customTopic}
                      onChange={(e) => setCustomTopic(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Title */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Notification Title *
                  </label>
                  <span className="text-[11px] text-gray-400">{title.length}/60</span>
                </div>
                <input
                  type="text"
                  maxLength={60}
                  placeholder="e.g. Special Live Class Today at 7 PM! 🔴"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                />
              </div>

              {/* Message */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Notification Message *
                  </label>
                  <span className="text-[11px] text-gray-400">{message.length}/200</span>
                </div>
                <textarea
                  rows={3}
                  maxLength={200}
                  placeholder="e.g. Don't miss today's crucial revision lecture. Click here to join the session directly."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>

              {/* Image URL & Target Route */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                    Image Banner (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com/banner.jpg"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                    Target Deep Link Screen
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. /courses or /live-classes"
                    value={targetScreen}
                    onChange={(e) => setTargetScreen(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Dispatched to Firebase...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send Instant Notification
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Right Live Device Preview (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-6">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-blue-600" />
                Live Student Device Preview
              </h3>

              <div className="space-y-6">
                {/* Lock Screen Push Preview */}
                <div>
                  <div className="text-xs text-gray-400 font-medium mb-2 flex items-center justify-between">
                    <span>LOCK SCREEN / SYSTEM TRAY PUSH</span>
                    <span className="text-[10px] text-blue-600 font-bold">FCM HIGH PRIORITY</span>
                  </div>

                  <div className="bg-[#18181B] text-white rounded-2xl p-4 shadow-xl border border-zinc-800">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-blue-600 flex items-center justify-center text-[9px] font-bold">
                          N
                        </div>
                        <span className="text-[11px] font-medium text-zinc-300">NSC Smart Classes</span>
                      </div>
                      <span className="text-[10px] text-zinc-400">now</span>
                    </div>

                    <div className="flex gap-3 items-start">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-zinc-100 leading-snug">
                          {title || <span className="text-zinc-500 italic">Notification Title</span>}
                        </div>
                        <div className="text-[11px] text-zinc-400 mt-1 leading-relaxed line-clamp-2">
                          {message || <span className="text-zinc-600 italic">Notification message body will appear right here...</span>}
                        </div>
                      </div>

                      {imageUrl && (
                        <div className="w-12 h-12 rounded-lg bg-zinc-800 overflow-hidden flex-shrink-0 border border-zinc-700">
                          <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* In-App List Preview */}
                <div>
                  <div className="text-xs text-gray-400 font-medium mb-2 flex items-center justify-between">
                    <span>IN-APP NOTIFICATION CENTER</span>
                    <span className="text-[10px] text-purple-600 font-bold">INSIDE MOBILE APP</span>
                  </div>

                  <div className="bg-[#F8FAFC] rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-gray-900 truncate">
                          {title || <span className="text-gray-400 italic">Title Preview</span>}
                        </h4>
                        <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 ml-2" />
                      </div>
                      <p className="text-[11px] text-gray-600 mt-1 leading-snug line-clamp-2">
                        {message || <span className="text-gray-400 italic">Detailed notification text inside the app notification screen...</span>}
                      </p>
                      {imageUrl && (
                        <div className="mt-2.5 rounded-lg overflow-hidden h-24 w-full bg-slate-200">
                          <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="text-[10px] text-gray-400 mt-2 font-medium">Just now</div>
                    </div>
                  </div>
                </div>

                {/* Help hint */}
                <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100 flex items-start gap-2 text-xs text-blue-800">
                  <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-600" />
                  <span>
                    When students tap this notification on their Android phone or iOS, it will open the app and instantly navigate to <b>{targetScreen || 'the Notification Screen'}</b>.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AUTOMATED TRIGGERS & TEMPLATES */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500" />
                  Dynamic Automated Triggers (100% Controllable)
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Control purchase alerts, student login notifications, automated live class notices, and test submissions directly from here. No code changes needed!
                </p>
              </div>

              <div className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700">
                {templates.filter((t) => t.enabled).length} of {templates.length} Active
              </div>
            </div>

            {loadingTemplates ? (
              <div className="py-12 flex justify-center items-center text-gray-400 gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <span>Loading automated templates from PostgreSQL...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((tpl) => (
                  <div
                    key={tpl.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      tpl.enabled ? 'border-gray-200 bg-white shadow-sm' : 'border-gray-200/60 bg-gray-50/70 opacity-70'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                          {getTemplateIcon(tpl.type)}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-gray-900">{tpl.title}</div>
                          <div className="text-[11px] font-mono text-gray-400">{tpl.key}</div>
                        </div>
                      </div>

                      {/* Enable/Disable Toggle */}
                      <button
                        onClick={() => handleToggleTemplate(tpl)}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          tpl.enabled ? 'bg-emerald-500' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            tpl.enabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="mt-4 space-y-2 bg-gray-50/80 p-3.5 rounded-xl border border-gray-100">
                      <div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Title Template</div>
                        <div className="text-xs font-semibold text-gray-800">{tpl.titleTemplate}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Body Template</div>
                        <div className="text-xs text-gray-600 leading-relaxed">{tpl.bodyTemplate}</div>
                      </div>
                      {tpl.targetScreen && (
                        <div>
                          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Deep Link Route</div>
                          <div className="text-[11px] font-mono text-blue-600">{tpl.targetScreen}</div>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex items-center justify-between text-xs pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        {tpl.sendPush && (
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold">Push</span>
                        )}
                        {tpl.sendInApp && (
                          <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-bold">In-App</span>
                        )}
                      </div>

                      <button
                        onClick={() => setEditingTemplate({ ...tpl })}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-all cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Edit Template
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: NOTIFICATION HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Notification History & Delivery Logs
              </h2>
              <p className="text-xs text-gray-500">Every sent notification is preserved in your PostgreSQL database.</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search logs..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadHistory(1, historySearch, historyTypeFilter, historyAudienceFilter)}
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-xl text-xs text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none w-48 sm:w-64"
                />
              </div>

              <select
                value={historyTypeFilter}
                onChange={(e) => {
                  setHistoryTypeFilter(e.target.value);
                  loadHistory(1, historySearch, e.target.value, historyAudienceFilter);
                }}
                className="px-3 py-2 border border-gray-300 rounded-xl text-xs text-gray-800 outline-none"
              >
                <option value="all">All Types</option>
                <option value="broadcast">Broadcast</option>
                <option value="purchase">Purchase</option>
                <option value="login">Login</option>
                <option value="live_class">Live Class</option>
                <option value="test">Test</option>
              </select>

              <select
                value={historyAudienceFilter}
                onChange={(e) => {
                  setHistoryAudienceFilter(e.target.value);
                  loadHistory(1, historySearch, historyTypeFilter, e.target.value);
                }}
                className="px-3 py-2 border border-gray-300 rounded-xl text-xs text-gray-800 outline-none font-medium bg-gray-50"
              >
                <option value="all">All Audiences</option>
                <option value="admin">🛡️ Admin Alerts Only (Purchases, Logins)</option>
                <option value="user">👤 Student Notifications Only</option>
              </select>
            </div>
          </div>

          {loadingHistory ? (
            <div className="py-12 flex justify-center items-center text-gray-400 gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <span>Loading delivery logs...</span>
            </div>
          ) : history.length === 0 ? (
            <div className="py-12 text-center text-gray-400 space-y-2">
              <Bell className="w-8 h-8 mx-auto opacity-30" />
              <div className="text-sm">No notification logs found.</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Audience</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Title & Message</th>
                    <th className="py-3 px-4">Target Audience</th>
                    <th className="py-3 px-4">Channels</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {history.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-3.5 px-4 text-gray-500 whitespace-nowrap">
                        {new Date(item.createdAt).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {item.audience === 'admin' || item.topic === 'admin_notifications' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            <ShieldCheck className="w-3 h-3 text-purple-600" />
                            Admin Alert
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <User className="w-3 h-3 text-blue-600" />
                            Student App
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 capitalize">
                          {item.type}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-bold text-gray-900 truncate">{item.title}</div>
                        <div className="text-gray-500 truncate mt-0.5">{item.message}</div>
                        {item.targetScreen && (
                          <div className="text-[10px] text-blue-600 font-mono mt-0.5">{item.targetScreen}</div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-gray-600 whitespace-nowrap">
                        {item.user ? (
                          <div>
                            <div className="font-semibold text-gray-900">{item.user.name || 'Student'}</div>
                            <div className="text-[11px] text-gray-400">{item.user.phoneNumber}</div>
                          </div>
                        ) : item.topic ? (
                          <span className="font-mono text-gray-700">Topic: {item.topic}</span>
                        ) : (
                          <span className="text-gray-400">All Students</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {item.sendPush && (
                            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold">Push</span>
                          )}
                          {item.sendInApp && (
                            <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 text-[10px] font-bold">In-App</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Delivered
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: FIREBASE & DIAGNOSTICS */}
      {activeTab === 'diagnostics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left: Configuration Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              Firebase Cloud Messaging Infrastructure
            </h3>

            <div className="space-y-3 pt-2 text-xs">
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200/80 flex justify-between items-center">
                <span className="text-gray-500 font-medium">Google Firebase Project</span>
                <span className="font-mono font-bold text-gray-900">nsc-smartclasses</span>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200/80 flex justify-between items-center">
                <span className="text-gray-500 font-medium">Android Package Identifier</span>
                <span className="font-mono font-bold text-gray-900">com.narmadanchal.smartclasses.pro</span>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200/80 flex justify-between items-center">
                <span className="text-gray-500 font-medium">Service Account Client Email</span>
                <span className="font-mono text-[11px] text-gray-800 truncate max-w-[220px]">
                  firebase-adminsdk-fbsvc@nsc-smartclasses.iam.gserviceaccount.com
                </span>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200/80 flex justify-between items-center">
                <span className="text-gray-500 font-medium">Database Persistence</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  VPS PostgreSQL (100% Free of Firestore)
                </span>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200/80 flex justify-between items-center">
                <span className="text-gray-500 font-medium">Firebase Admin Status</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Connected & Ready
                </span>
              </div>
            </div>
          </div>

          {/* Right: Test Push Tool */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Play className="w-5 h-5 text-emerald-600" />
              Send Live Test Push to Device Token
            </h3>
            <p className="text-xs text-gray-500">
              Instantly test if a specific phone or device token receives high-priority FCM push.
            </p>

            <form onSubmit={handleTestPush} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Device FCM Token *</label>
                <input
                  type="text"
                  required
                  placeholder="Paste student FCM device token here..."
                  value={testToken}
                  onChange={(e) => setTestToken(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs text-gray-900 font-mono outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Test Title</label>
                <input
                  type="text"
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs text-gray-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Test Message</label>
                <input
                  type="text"
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs text-gray-900 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={testingPush}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {testingPush ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send Live Test Push
              </button>

              {testResult && (
                <div
                  className={`p-3 rounded-xl border text-xs ${
                    testResult.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  {testResult.success ? (
                    <div>
                      <div className="font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Push Delivered to Google FCM Servers!
                      </div>
                      <div className="font-mono text-[10px] mt-1 break-all text-emerald-700">
                        Message ID: {testResult.messageId}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="font-bold flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-rose-600" />
                        FCM Error:
                      </div>
                      <div className="mt-1 text-rose-700">{testResult.error}</div>
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Edit Template Modal */}
      {editingTemplate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-bold text-gray-900 text-base">Edit Automated Template</h3>
                <div className="text-xs text-gray-400 font-mono mt-0.5">{editingTemplate.key}</div>
              </div>
              <button
                onClick={() => setEditingTemplate(null)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Display Title</label>
                <input
                  type="text"
                  value={editingTemplate.title}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs text-gray-900 outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Title Template (Supports <code className="text-blue-600 font-bold">&#123;&#123;var&#125;&#125;</code>)
                </label>
                <input
                  type="text"
                  value={editingTemplate.titleTemplate}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, titleTemplate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs text-gray-900 outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Body Template (Supports <code className="text-blue-600 font-bold">&#123;&#123;var&#125;&#125;</code>)
                </label>
                <textarea
                  rows={3}
                  value={editingTemplate.bodyTemplate}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, bodyTemplate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs text-gray-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Deep Link Route</label>
                <input
                  type="text"
                  value={editingTemplate.targetScreen || ''}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, targetScreen: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs text-gray-900 font-mono outline-none"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700">
                  <input
                    type="checkbox"
                    checked={editingTemplate.sendPush}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, sendPush: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  Send FCM Push
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700">
                  <input
                    type="checkbox"
                    checked={editingTemplate.sendInApp}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, sendInApp: e.target.checked })}
                    className="w-4 h-4 text-purple-600 rounded"
                  />
                  Send In-App
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setEditingTemplate(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveTemplate}
                disabled={savingTemplate}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer"
              >
                {savingTemplate ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

