'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  ExternalLink,
  ShoppingBag,
  LogIn,
  ClipboardList,
  AlertCircle,
  Radio,
  Volume2,
  VolumeX,
  ShieldCheck,
  X,
  Sparkles,
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';

export interface AdminNotification {
  id: string;
  userId?: string | null;
  title: string;
  message: string;
  type: string;
  audience?: string | null;
  targetScreen?: string | null;
  imageUrl?: string | null;
  isRead: boolean;
  createdAt: string;
  metadata?: any;
}

// Crisp notification audio chime using Web Audio API (zero assets needed)
function playNotificationChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // First tone (D5 - 587.33 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Second tone (A5 - 880 Hz) after 100ms
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.1);
    gain2.gain.setValueAtTime(0.3, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.6);
  } catch (_) {
    // Audio context may be restricted by browser autoplay policy
  }
}

export function AdminNotificationCenter() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [filter, setFilter] = useState<'all' | 'purchase' | 'login' | 'test'>('all');
  const [hasNewPing, setHasNewPing] = useState(false);
  const [desktopPermission, setDesktopPermission] = useState<NotificationPermission>('default');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  // Sync token from localStorage
  const getAuthHeader = useCallback((): Record<string, string> => {
    if (typeof window === 'undefined') return {};
    const token = localStorage.getItem('admin_token') || localStorage.getItem('adminToken');
    const h: Record<string, string> = {};
    if (token) {
      h['Authorization'] = `Bearer ${token}`;
    }
    return h;
  }, []);

  // Fetch recent admin notifications
  const fetchRecentNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      };
      const res = await fetch('/external-api/admin/notifications?audience=admin&limit=25', {
        headers,
      });
      if (res.ok) {
        const data = await res.json();
        const items: AdminNotification[] = data.items || [];
        setNotifications(items);
        const unread = items.filter((n) => !n.isRead).length;
        setUnreadCount(unread);
      }
    } catch (e) {
      console.warn('[AdminNotifications] Failed to load alerts:', e);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader]);

  // Request desktop/system notification permission
  const requestDesktopPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    try {
      const perm = await Notification.requestPermission();
      setDesktopPermission(perm);
      if (perm === 'granted') {
        toast.success('System Notifications Enabled! 🎉', {
          description: 'You will receive alerts on your desktop & lock screen.',
        });
      } else {
        toast.info('Notifications were not granted.');
      }
    } catch (err) {
      console.warn('Error requesting notification permission:', err);
    }
  };

  // Socket.io Real-time connection
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setDesktopPermission(Notification.permission);
    }

    fetchRecentNotifications();

    // Connect to Socket.io via Next.js proxy rewrite
    const socket = io({
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[AdminNotifications] Connected to real-time notification socket');
    });

    socket.on('new_admin_notification', (newNotif: AdminNotification) => {
      console.log('[AdminNotifications] Real-time admin alert received:', newNotif);

      // Play chime
      if (soundEnabled) {
        playNotificationChime();
      }

      // Add to list and bump counter
      setNotifications((prev) => [newNotif, ...prev.filter((n) => n.id !== newNotif.id)]);
      setUnreadCount((c) => c + 1);
      setHasNewPing(true);
      setTimeout(() => setHasNewPing(false), 3000);

      // In-panel Interactive Toast
      let toastIcon = '🔔';
      if (newNotif.type?.includes('purchase') || newNotif.title?.includes('Purchased')) {
        toastIcon = '🛒';
      } else if (newNotif.type?.includes('login') || newNotif.title?.includes('Logged In')) {
        toastIcon = '📱';
      } else if (newNotif.type?.includes('test')) {
        toastIcon = '📝';
      }

      toast(newNotif.title, {
        description: newNotif.message,
        icon: toastIcon,
        duration: 7000,
        action: {
          label: 'View',
          onClick: () => {
            setIsOpen(true);
          },
        },
      });

      // If document is in background/locked and permission is granted, dispatch Native OS notification
      if (
        typeof window !== 'undefined' &&
        'Notification' in window &&
        Notification.permission === 'granted' &&
        document.visibilityState === 'hidden'
      ) {
        try {
          const sysNotif = new Notification(newNotif.title, {
            body: newNotif.message,
            icon: '/favicon.ico',
            tag: newNotif.id,
          });
          sysNotif.onclick = () => {
            window.focus();
            setIsOpen(true);
          };
        } catch (_) {}
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [fetchRecentNotifications, soundEnabled]);

  // Click outside listener to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Mark single notification as read
  const markAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      const patchHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      };
      await fetch(`/external-api/admin/notifications/${id}/read`, {
        method: 'PATCH',
        headers: patchHeaders,
      });
    } catch (err) {
      console.warn('Failed to mark notification as read:', err);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);

      const postHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      };
      await fetch('/external-api/admin/notifications/mark-all-read', {
        method: 'POST',
        headers: postHeaders,
        body: JSON.stringify({ audience: 'admin' }),
      });
      toast.success('All admin alerts marked as read');
    } catch (err) {
      toast.error('Failed to mark all as read');
    }
  };

  // Delete notification
  const deleteNotificationItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      const deleteHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      };
      await fetch(`/external-api/admin/notifications/${id}`, {
        method: 'DELETE',
        headers: deleteHeaders,
      });
    } catch (err) {
      toast.error('Failed to delete notification');
    }
  };

  // Click item handler
  const handleItemClick = (notif: AdminNotification) => {
    markAsRead(notif.id);
    if (notif.targetScreen) {
      setIsOpen(false);
      router.push(notif.targetScreen);
    } else if (notif.type?.includes('purchase')) {
      setIsOpen(false);
      router.push('/admin/courses');
    } else if (notif.type?.includes('login')) {
      setIsOpen(false);
      router.push('/admin/student-tracking');
    } else if (notif.type?.includes('test')) {
      setIsOpen(false);
      router.push('/admin/test-results');
    }
  };

  // Filter items
  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'all') return true;
    if (filter === 'purchase') return n.type?.includes('purchase') || n.title?.includes('Purchased');
    if (filter === 'login') return n.type?.includes('login') || n.title?.includes('Logged In');
    if (filter === 'test') return n.type?.includes('test');
    return true;
  });

  const formatRelativeTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    } catch (_) {
      return '';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Trigger */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchRecentNotifications();
        }}
        className={`relative p-2.5 rounded-xl border transition-all duration-200 ${
          isOpen
            ? 'bg-blue-50 border-blue-200 text-blue-600 shadow-sm'
            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
        } ${hasNewPing ? 'animate-bounce ring-4 ring-blue-300' : ''}`}
        title="Admin Notifications Center"
        aria-label="Notifications"
      >
        <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'text-blue-600' : 'text-slate-600'}`} />

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center px-1.5 text-[11px] font-extrabold text-white bg-rose-600 rounded-full ring-2 ring-white shadow-sm animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-96 sm:w-[440px] bg-white rounded-2xl shadow-2xl border border-slate-200/90 z-50 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in slide-in-from-top-3 duration-200">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-tight flex items-center gap-2">
                  Admin Alert Center
                  {unreadCount > 0 && (
                    <span className="text-[10px] bg-rose-500 text-white px-2 py-0.5 rounded-full font-bold">
                      {unreadCount} new
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-slate-400">Real-time alerts for student actions & sales</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                title={soundEnabled ? 'Mute Alert Sound' : 'Enable Alert Sound'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Filter Bar */}
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              {(['all', 'purchase', 'login', 'test'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-2.5 py-1 rounded-md font-semibold capitalize transition-all ${
                    filter === tab
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                  }`}
                >
                  {tab === 'all' ? 'All' : tab === 'purchase' ? '🛒 Sales' : tab === 'login' ? '📱 Logins' : '📝 Tests'}
                </button>
              ))}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline px-1 py-0.5"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 max-h-[380px]">
            {loading && notifications.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Loading alerts...
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <ShieldCheck className="w-10 h-10 mx-auto text-slate-300 mb-2 stroke-[1.5]" />
                <p className="font-semibold text-sm text-slate-600">All caught up!</p>
                <p className="text-xs text-slate-400 mt-0.5">No alerts in this category</p>
              </div>
            ) : (
              filteredNotifications.map((notif) => {
                const isPurchase = notif.type?.includes('purchase') || notif.title?.includes('Purchased');
                const isLogin = notif.type?.includes('login') || notif.title?.includes('Logged In');
                const isTest = notif.type?.includes('test');

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleItemClick(notif)}
                    className={`p-3.5 transition-colors cursor-pointer flex items-start gap-3 group relative ${
                      !notif.isRead ? 'bg-blue-50/40 hover:bg-blue-50/70' : 'bg-white hover:bg-slate-50'
                    }`}
                  >
                    {/* Category Icon Badge */}
                    <div
                      className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center shadow-sm ${
                        isPurchase
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                          : isLogin
                          ? 'bg-sky-50 text-sky-600 border border-sky-200'
                          : isTest
                          ? 'bg-amber-50 text-amber-600 border border-amber-200'
                          : 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                      }`}
                    >
                      {isPurchase ? (
                        <ShoppingBag className="w-4 h-4" />
                      ) : isLogin ? (
                        <LogIn className="w-4 h-4" />
                      ) : isTest ? (
                        <ClipboardList className="w-4 h-4" />
                      ) : (
                        <Bell className="w-4 h-4" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-6">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <h4
                          className={`text-xs font-bold truncate ${
                            !notif.isRead ? 'text-slate-900' : 'text-slate-700'
                          }`}
                        >
                          {notif.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 flex-shrink-0">
                          {formatRelativeTime(notif.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>
                    </div>

                    {/* Unread Indicator */}
                    {!notif.isRead && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 absolute right-3 top-4" />
                    )}

                    {/* Hover Actions */}
                    <div className="absolute right-2 bottom-2 hidden group-hover:flex items-center gap-1 bg-white/90 backdrop-blur-sm p-1 rounded-lg border border-slate-200 shadow-sm">
                      {!notif.isRead && (
                        <button
                          onClick={(e) => markAsRead(notif.id, e)}
                          className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
                          title="Mark as read"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={(e) => deleteNotificationItem(notif.id, e)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                        title="Delete alert"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Desktop Push Status & Footer */}
          <div className="p-3 bg-slate-50 border-t border-slate-200/90 flex flex-col gap-2">
            {desktopPermission !== 'granted' && (
              <div className="flex items-center justify-between p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-amber-600 flex-shrink-0 animate-pulse" />
                  <span className="text-[11px] font-medium">Get alerts when app is closed / locked</span>
                </div>
                <button
                  onClick={requestDesktopPermission}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-[10px] transition-colors"
                >
                  Enable
                </button>
              </div>
            )}

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-[11px] text-slate-500 font-medium">
                Connected to Real-time Stream 🟢
              </span>
              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push('/admin/notifications');
                }}
                className="font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline text-xs"
              >
                Full Notifications Hub
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
