'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  BarChart3,
  Calendar,
  BookOpen,
  Users,
  CheckSquare,
  Video,
  Menu,
  X,
  LogOut,
  Target,
  Activity,
  UserCheck,
  Bell,
  MessageCircleQuestion,
  Image as ImageIcon,
  Settings,
  FileText,
  Headset,
  Ticket,
  Tag,
  LayoutTemplate,
  Database,
  Terminal,
  Lock,
  Unlock,
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  Delete,
  Search,
  Sparkles,
  ArrowRight,
  Loader2,
  ExternalLink,
  Smartphone,
  Check,
  Radio,
  Clock,
  Layers,
  Crown,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

interface MenuItem {
  label: string;
  href: string;
  icon: any;
  requiresPin?: boolean;
  badge?: string;
  subItems?: { label: string; href: string; icon: any }[];
}

const menuItems: MenuItem[] = [
  { label: 'Dashboard', href: '/admin', icon: BarChart3 },

  {
    label: 'Premium Test Series',
    href: '/admin/premium-test-series',
    icon: Crown,
    badge: 'PRO',
    subItems: [
      { label: 'Purchases & Students', href: '/admin/premium-test-series/purchases', icon: Users },
      { label: 'Manage & Create Tests', href: '/admin/premium-test-series/tests', icon: CheckSquare },
      { label: 'Banners & Media', href: '/admin/premium-test-series/banners', icon: ImageIcon },
      { label: 'Test Results', href: '/admin/premium-test-series/results', icon: Activity },
      { label: 'Test Leaderboard', href: '/admin/premium-test-series/leaderboard', icon: Target },
      { label: 'Discount Coupons', href: '/admin/premium-test-series/coupons', icon: Tag },
    ],
  },

  { label: 'Batches', href: '/admin/batches', icon: Users },
  { label: 'Batch Notes', href: '/admin/notes', icon: FileText },
  { label: 'Courses', href: '/admin/courses', icon: BookOpen },
  { label: 'Tests', href: '/admin/tests', icon: CheckSquare },
  { label: 'Test Results', href: '/admin/test-results', icon: Activity },
  { label: 'Live Classes', href: '/admin/live-classes', icon: Video },
  { label: 'Exam Goals', href: '/admin/exam-goals', icon: Target },
  { label: 'Goal Logs', href: '/admin/goal-logs', icon: Activity },
  { label: 'Student Tracking', href: '/admin/student-tracking', icon: UserCheck },
  { label: 'Notifications', href: '/admin/notifications', icon: Bell },
  { label: 'Doubts', href: '/admin/doubts', icon: MessageCircleQuestion },
  { label: 'Banners', href: '/admin/banners', icon: ImageIcon },
  { label: 'Home Builder', href: '/admin/home-builder', icon: LayoutTemplate },
  { label: 'Storage Manager', href: '/admin/storage', icon: Database },
  { label: 'API List', href: '/admin/apis', icon: Terminal, requiresPin: true },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
  { label: 'Support Info', href: '/admin/support', icon: Headset },
  { label: 'Support Tickets', href: '/admin/support-tickets', icon: Ticket },
  { label: 'Coupons', href: '/admin/coupons', icon: Tag },
];

// Curated VPS APIs for search
const VPS_APIS_CATALOG = [
  { name: 'Send OTP (Student Login)', method: 'POST', path: '/api/auth/send-otp', category: 'Auth' },
  { name: 'Verify OTP & Issue JWT', method: 'POST', path: '/api/auth/verify-otp', category: 'Auth' },
  { name: 'Session Guard & Active Check', method: 'GET', path: '/api/auth/check-status', category: 'Auth' },
  { name: 'Student Presence Online/Offline', method: 'POST', path: '/api/auth/presence', category: 'Auth' },
  { name: 'Student Heartbeat Pulse', method: 'POST', path: '/api/auth/heartbeat', category: 'Auth' },
  { name: 'Students Tracking & Roster', method: 'GET', path: '/api/admin/students', category: 'Students' },
  { name: 'Student Courses & Restrictions', method: 'GET', path: '/api/admin/students/:userId/courses', category: 'Students' },
  { name: 'Suspend Student Course', method: 'POST', path: '/api/admin/students/:userId/courses/:courseId/suspend', category: 'Students' },
  { name: 'Require Course Repurchase', method: 'POST', path: '/api/admin/students/:userId/courses/:courseId/repurchase', category: 'Students' },
  { name: 'Restore Course Access', method: 'POST', path: '/api/admin/students/:userId/courses/:courseId/restore', category: 'Students' },
  { name: 'Block Student Account', method: 'POST', path: '/api/admin/students/:id/block', category: 'Students' },
  { name: 'Unblock Student Account', method: 'POST', path: '/api/admin/students/:id/unblock', category: 'Students' },
  { name: 'Executive Dashboard Analytics', method: 'GET', path: '/api/admin/dashboard-analytics', category: 'Dashboard' },
  { name: 'Global Omnisearch (PostgreSQL tsvector)', method: 'GET', path: '/api/admin/global-search', category: 'Search' },
  { name: 'Broadcast Push Notification', method: 'POST', path: '/api/admin/notifications/send', category: 'Notifications' },
  { name: 'Create Razorpay Payment Order', method: 'POST', path: '/api/payments/create-order', category: 'Payments' },
  { name: 'Verify Payment & Grant Access', method: 'POST', path: '/api/payments/verify', category: 'Payments' },
  { name: 'Live Classes WebRTC Stream', method: 'GET', path: '/api/live/classes', category: 'Live' },
  { name: 'HLS Video Transcoder & Streaming', method: 'GET', path: '/api/video/hls', category: 'Video' },
  { name: 'App Config & Dashboard Layout', method: 'GET', path: '/api/app-data/app_config/dashboard', category: 'Config' },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, adminUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({
    '/admin/premium-test-series': true,
  });

  // =========================================================================
  // 1. OMNISEARCH MODAL STATE (PostgreSQL tsvector SQL Query)
  // =========================================================================
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimeMs, setSearchTimeMs] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'students' | 'courses' | 'batches' | 'apis' | 'pages'>('all');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [backendResults, setBackendResults] = useState<{
    students: any[];
    courses: any[];
    batches: any[];
    tests: any[];
    liveClasses: any[];
  }>({
    students: [],
    courses: [],
    batches: [],
    tests: [],
    liveClasses: [],
  });

  // Global Keyboard Shortcut: Ctrl+K / Cmd+K
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchModalOpen((prev) => !prev);
      } else if (e.key === 'Escape' && isSearchModalOpen) {
        setIsSearchModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isSearchModalOpen]);

  // Focus input when modal opens
  useEffect(() => {
    if (isSearchModalOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } else {
      setSearchQuery('');
      setBackendResults({ students: [], courses: [], batches: [], tests: [], liveClasses: [] });
      setSearchTimeMs(null);
    }
  }, [isSearchModalOpen]);

  // Debounced SQL Vector Search API call
  useEffect(() => {
    if (!isSearchModalOpen) return;
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setBackendResults({ students: [], courses: [], batches: [], tests: [], liveClasses: [] });
      setSearchTimeMs(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/external-api/admin/global-search?q=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.results) {
            setBackendResults(json.results);
            setSearchTimeMs(json.timeMs || 0);
          }
        }
      } catch (err) {
        console.error('Omnisearch error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [searchQuery, isSearchModalOpen]);

  // Filtered Navigation Pages
  const matchedPages = menuItems.filter((item) =>
    searchQuery.trim()
      ? item.label.toLowerCase().includes(searchQuery.toLowerCase())
      : false
  );

  // Filtered VPS APIs
  const matchedApis = VPS_APIS_CATALOG.filter((api) =>
    searchQuery.trim()
      ? api.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        api.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
        api.category.toLowerCase().includes(searchQuery.toLowerCase())
      : false
  );

  const totalResultsCount =
    (backendResults.students?.length || 0) +
    (backendResults.courses?.length || 0) +
    (backendResults.batches?.length || 0) +
    (backendResults.tests?.length || 0) +
    matchedPages.length +
    matchedApis.length;

  // =========================================================================
  // 2. PIN PROTECTION MODAL STATE (Master PIN: 991061)
  // =========================================================================
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  // Verify PIN Function (strictly 991061)
  const verifyEnteredPin = useCallback((pinToTest: string) => {
    setIsVerifying(true);
    setTimeout(() => {
      if (pinToTest === '991061') {
        setIsSuccess(true);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('vps_api_unlocked', 'true');
        }
        toast.success('Access Granted! 🔓', {
          description: 'VPS Backend APIs directory unlocked.',
        });
        setTimeout(() => {
          setShowPinModal(false);
          setPinInput('');
          setIsSuccess(false);
          setIsVerifying(false);
          setIsOpen(false);
          router.push('/admin/apis');
        }, 400);
      } else {
        setPinError(true);
        toast.error('Access Denied ❌', {
          description: 'Incorrect security PIN. Please enter the valid master PIN.',
        });
        setTimeout(() => {
          setPinInput('');
          setPinError(false);
          setIsVerifying(false);
        }, 700);
      }
    }, 200);
  }, [router]);

  const handleDigitPress = (digit: string) => {
    if (isVerifying || isSuccess) return;
    if (pinInput.length < 6) {
      const nextPin = pinInput + digit;
      setPinInput(nextPin);
      setPinError(false);
      if (nextPin.length === 6) {
        verifyEnteredPin(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    if (isVerifying || isSuccess) return;
    setPinInput((prev) => prev.slice(0, -1));
    setPinError(false);
  };

  const handleClearPin = () => {
    if (isVerifying || isSuccess) return;
    setPinInput('');
    setPinError(false);
  };

  // Physical Keyboard for PIN Modal
  useEffect(() => {
    if (!showPinModal) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleDigitPress(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape') {
        setShowPinModal(false);
        setPinInput('');
        setPinError(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showPinModal, pinInput, isVerifying, isSuccess, handleDigitPress, handleBackspace]);

  // Click handler for menu items
  const handleItemClick = (e: React.MouseEvent, item: MenuItem) => {
    if (item.requiresPin) {
      e.preventDefault();
      const isAlreadyUnlocked = typeof window !== 'undefined' && sessionStorage.getItem('vps_api_unlocked') === 'true';
      if (isAlreadyUnlocked) {
        setIsOpen(false);
        router.push(item.href);
      } else {
        setPinInput('');
        setPinError(false);
        setIsSuccess(false);
        setShowPinModal(true);
      }
      return;
    }
    setIsOpen(false);
  };

  // Helper to navigate from search results
  const handleSearchNavigate = (href: string) => {
    setIsSearchModalOpen(false);
    setIsOpen(false);
    router.push(href);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        className="lg:hidden fixed bottom-6 right-6 z-50 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle Menu"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-slate-900 text-white p-5 transform transition-transform lg:translate-x-0 z-40 overflow-y-auto flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* =================================================================== */}
        {/* SIDEBAR HEADER & TOP SEARCH BAR                                     */}
        {/* =================================================================== */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>Admin</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
                  {adminUser?.role || 'Superadmin'}
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 mt-0.5">Narmadanchal Portal</p>
            </div>
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Online
            </span>
          </div>

          {/* TOP OMNISEARCH BAR */}
          <div className="relative">
            <button
              onClick={() => setIsSearchModalOpen(true)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 text-slate-400 hover:text-slate-200 transition-all text-left shadow-inner group"
              title="Search students, courses, APIs (Ctrl+K)"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Search className="w-4 h-4 text-slate-400 group-hover:text-blue-400 transition-colors shrink-0" />
                <span className="text-xs truncate font-medium text-slate-400 group-hover:text-slate-300">
                  Search anything...
                </span>
              </div>
              <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-400 bg-slate-900 border border-slate-700 rounded shadow-xs">
                ⌘K
              </kbd>
            </button>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5 flex-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const hasSub = Boolean(item.subItems && item.subItems.length > 0);
            const isSubActive = hasSub && item.subItems!.some(s => pathname === s.href || pathname.startsWith(s.href));
            const isActive = item.href === '/admin' ? pathname === '/admin' : pathname === item.href || isSubActive;
            const isExpanded = expandedItems[item.href] ?? (isActive || isSubActive);

            return (
              <div key={item.href} className="space-y-1">
                <div
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg transition-colors group cursor-pointer ${
                    isActive && !hasSub
                      ? 'bg-blue-600 text-white shadow-sm'
                      : isActive && hasSub
                      ? 'bg-slate-800/95 text-white border border-amber-500/40'
                      : 'text-gray-300 hover:bg-slate-800'
                  }`}
                  onClick={(e) => {
                    if (hasSub) {
                      e.preventDefault();
                      setExpandedItems(prev => ({ ...prev, [item.href]: !isExpanded }));
                      if (!pathname.startsWith(item.href)) {
                        router.push(item.href);
                      }
                    } else {
                      handleItemClick(e, item);
                      router.push(item.href);
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4.5 h-4.5 ${item.badge === 'PRO' ? 'text-amber-400' : 'text-slate-400 group-hover:text-white'} transition-colors`} />
                    <span className="font-medium text-xs sm:text-sm">{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Badge */}
                    {item.badge && (
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-sm">
                        {item.badge}
                      </span>
                    )}

                    {/* Lock Badge for PIN protected item */}
                    {item.requiresPin && (
                      <span
                        title="Protected by Security PIN 991061"
                        className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 group-hover:bg-amber-500/25 transition-colors"
                      >
                        <Lock className="w-2.5 h-2.5" />
                        <span>PIN</span>
                      </span>
                    )}

                    {/* Accordion Chevron */}
                    {hasSub && (
                      <span className="text-slate-400 group-hover:text-white transition-transform">
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </span>
                    )}
                  </div>
                </div>

                {/* Sub Items Accordion */}
                {hasSub && isExpanded && (
                  <div className="pl-3 pr-1 py-1 space-y-1 border-l-2 border-amber-500/40 ml-4 animate-in slide-in-from-top-2 duration-150">
                    {item.subItems!.map((sub) => {
                      const SubIcon = sub.icon;
                      const isThisSubActive = pathname === sub.href || (sub.href !== item.href && pathname.startsWith(sub.href));
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          onClick={() => setIsOpen(false)}
                          className={`flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                            isThisSubActive
                              ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40 shadow-xs'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                          }`}
                        >
                          <SubIcon className={`w-3.5 h-3.5 ${isThisSubActive ? 'text-amber-400' : 'text-slate-500'}`} />
                          <span className="truncate">{sub.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full mt-6 flex items-center gap-3 px-3.5 py-2.5 text-gray-300 hover:bg-slate-800 rounded-lg transition-colors text-xs sm:text-sm"
        >
          <LogOut className="w-4.5 h-4.5 text-slate-400" />
          <span>Logout</span>
        </button>
      </aside>

      {/* ========================================================================= */}
      {/* 3. GLOBAL OMNISEARCH MODAL (PostgreSQL tsvector SQL Query)               */}
      {/* ========================================================================= */}
      {isSearchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 sm:pt-16 p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div
            className="w-full max-w-2xl bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[84vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Search Input Box */}
            <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/90 flex items-center gap-3">
              <Search className="w-5 h-5 text-blue-400 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search students (+91...), courses, batches, tests, APIs, or pages..."
                className="w-full bg-transparent text-sm sm:text-base text-white placeholder-slate-400 focus:outline-none"
              />
              {isSearching && <Loader2 className="w-4 h-4 text-blue-400 animate-spin shrink-0" />}
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                  aria-label="Clear Search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setIsSearchModalOpen(false)}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 border border-slate-700"
              >
                ESC
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="px-4 py-2 border-b border-slate-800 bg-slate-950/40 flex items-center gap-1.5 overflow-x-auto text-xs">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1 rounded-lg transition-colors whitespace-nowrap font-medium ${
                  activeTab === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                All Results ({totalResultsCount})
              </button>
              <button
                onClick={() => setActiveTab('students')}
                className={`px-3 py-1 rounded-lg transition-colors whitespace-nowrap font-medium ${
                  activeTab === 'students'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                Students ({backendResults.students?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('courses')}
                className={`px-3 py-1 rounded-lg transition-colors whitespace-nowrap font-medium ${
                  activeTab === 'courses'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                Courses ({backendResults.courses?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('batches')}
                className={`px-3 py-1 rounded-lg transition-colors whitespace-nowrap font-medium ${
                  activeTab === 'batches'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                Batches ({backendResults.batches?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('apis')}
                className={`px-3 py-1 rounded-lg transition-colors whitespace-nowrap font-medium ${
                  activeTab === 'apis'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                APIs ({matchedApis.length})
              </button>
              <button
                onClick={() => setActiveTab('pages')}
                className={`px-3 py-1 rounded-lg transition-colors whitespace-nowrap font-medium ${
                  activeTab === 'pages'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                Pages ({matchedPages.length})
              </button>
            </div>

            {/* Results Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {/* EMPTY STATE / QUICK SHORTCUTS */}
              {!searchQuery.trim() && (
                <div className="py-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-semibold text-white">PostgreSQL tsvector Omnisearch</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
                    Type anything to search students by name or phone, courses, batches, tests, or VPS endpoints in real time.
                  </p>

                  <div className="mt-5 max-w-md mx-auto text-left">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Suggested Quick Pages
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'Student Tracking', href: '/admin/student-tracking', icon: UserCheck },
                        { label: 'API Directory', href: '/admin/apis', icon: Terminal },
                        { label: 'Courses Manager', href: '/admin/courses', icon: BookOpen },
                        { label: 'Live Classes', href: '/admin/live-classes', icon: Video },
                      ].map((s) => {
                        const Icon = s.icon;
                        return (
                          <button
                            key={s.href}
                            onClick={() => handleSearchNavigate(s.href)}
                            className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 text-slate-300 text-xs transition-colors"
                          >
                            <Icon className="w-4 h-4 text-blue-400" />
                            <span>{s.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ZERO RESULTS FOUND */}
              {searchQuery.trim() && totalResultsCount === 0 && !isSearching && (
                <div className="py-12 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-slate-800 border border-slate-700 text-slate-400 flex items-center justify-center">
                    <Search className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-semibold text-white">No results found for &quot;{searchQuery}&quot;</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                    Try searching by student phone (+91...), student name, course title, or API path.
                  </p>
                </div>
              )}

              {/* 1. STUDENTS RESULTS (PostgreSQL tsvector) */}
              {(activeTab === 'all' || activeTab === 'students') && backendResults.students && backendResults.students.length > 0 && (
                <div>
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                    <span className="flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                      Students ({backendResults.students.length})
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono">SQL tsvector ranked</span>
                  </div>

                  <div className="space-y-1.5">
                    {backendResults.students.map((student) => (
                      <div
                        key={student.id}
                        onClick={() => handleSearchNavigate(`/admin/student-tracking?search=${encodeURIComponent(student.phoneNumber || student.name || '')}`)}
                        className="p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-blue-500/50 transition-all cursor-pointer flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-sm shrink-0">
                            {student.name ? student.name[0].toUpperCase() : 'U'}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-white truncate group-hover:text-blue-400 transition-colors">
                                {student.name || 'Unnamed Student'}
                              </span>
                              {/* Status Badges */}
                              {student.isOnline ? (
                                <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live Now
                                </span>
                              ) : student.isBlocked ? (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30">
                                  Blocked
                                </span>
                              ) : student.isSuspended ? (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                  Suspended
                                </span>
                              ) : (
                                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-400 border border-slate-600/40">
                                  Active
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                              <span className="font-mono text-slate-300">{student.phoneNumber}</span>
                              {student.email && <span className="truncate">{student.email}</span>}
                              {student.role && <span className="text-[10px] uppercase text-slate-500">({student.role})</span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-blue-400 font-medium group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                            Inspect <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. COURSES RESULTS (PostgreSQL tsvector) */}
              {(activeTab === 'all' || activeTab === 'courses') && backendResults.courses && backendResults.courses.length > 0 && (
                <div>
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                    <span className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                      Courses ({backendResults.courses.length})
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono">SQL tsvector ranked</span>
                  </div>

                  <div className="space-y-1.5">
                    {backendResults.courses.map((course) => (
                      <div
                        key={course.id}
                        onClick={() => handleSearchNavigate('/admin/courses')}
                        className="p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-blue-500/50 transition-all cursor-pointer flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0">
                            <BookOpen className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-white truncate group-hover:text-blue-400 transition-colors">
                              {course.title}
                            </div>
                            <div className="text-xs text-slate-400 truncate mt-0.5 max-w-md">
                              {course.description || 'Full course syllabus & resources'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-700/60 text-emerald-400 border border-slate-600">
                            {course.price > 0 ? `₹${course.price}` : 'Free'}
                          </span>
                          <span className="text-xs text-blue-400 font-medium group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                            Open <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. BATCHES RESULTS (PostgreSQL tsvector) */}
              {(activeTab === 'all' || activeTab === 'batches') && backendResults.batches && backendResults.batches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-blue-400" />
                      Batches ({backendResults.batches.length})
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono">SQL tsvector ranked</span>
                  </div>

                  <div className="space-y-1.5">
                    {backendResults.batches.map((batch) => (
                      <div
                        key={batch.id}
                        onClick={() => handleSearchNavigate('/admin/batches')}
                        className="p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-blue-500/50 transition-all cursor-pointer flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-amber-600/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
                            <Users className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-white truncate group-hover:text-blue-400 transition-colors">
                              {batch.title}
                            </div>
                            <div className="text-xs text-slate-400 truncate mt-0.5">
                              {batch.examGoalLabel ? `Goal: ${batch.examGoalLabel}` : 'Live batch cohort'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-blue-400 font-medium group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                            Open <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. TESTS RESULTS */}
              {(activeTab === 'all' || activeTab === 'batches') && backendResults.tests && backendResults.tests.length > 0 && (
                <div>
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                    <span className="flex items-center gap-1.5">
                      <CheckSquare className="w-3.5 h-3.5 text-blue-400" />
                      Tests & Quizzes ({backendResults.tests.length})
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {backendResults.tests.map((test) => (
                      <div
                        key={test.id}
                        onClick={() => handleSearchNavigate('/admin/tests')}
                        className="p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-blue-500/50 transition-all cursor-pointer flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                            <CheckSquare className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-white truncate group-hover:text-blue-400 transition-colors">
                              {test.title}
                            </div>
                            <div className="text-xs text-slate-400 truncate mt-0.5">
                              Status: {test.status || 'Active'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-blue-400 font-medium group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                            Open <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. MATCHED VPS APIS */}
              {(activeTab === 'all' || activeTab === 'apis') && matchedApis.length > 0 && (
                <div>
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                    <span className="flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-blue-400" />
                      VPS APIs ({matchedApis.length})
                    </span>
                    <span className="text-[10px] text-amber-400 font-mono">Protected Gateway</span>
                  </div>

                  <div className="space-y-1.5">
                    {matchedApis.map((api) => (
                      <div
                        key={api.path}
                        onClick={() => handleSearchNavigate('/admin/apis')}
                        className="p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-blue-500/50 transition-all cursor-pointer flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded shrink-0 ${
                              api.method === 'GET'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : api.method === 'POST'
                                ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                                : 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                            }`}
                          >
                            {api.method}
                          </span>
                          <div className="min-w-0">
                            <div className="text-xs sm:text-sm font-semibold text-white truncate group-hover:text-blue-400 transition-colors">
                              {api.name}
                            </div>
                            <div className="font-mono text-[11px] text-slate-400 truncate mt-0.5">
                              {api.path}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700/60 text-slate-300">
                            {api.category}
                          </span>
                          <span className="text-xs text-blue-400 font-medium group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                            View <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 6. MATCHED NAVIGATION PAGES */}
              {(activeTab === 'all' || activeTab === 'pages') && matchedPages.length > 0 && (
                <div>
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-blue-400" />
                      Admin Pages ({matchedPages.length})
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {matchedPages.map((page) => {
                      const Icon = page.icon;
                      return (
                        <div
                          key={page.href}
                          onClick={() => handleSearchNavigate(page.href)}
                          className="p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-blue-500/50 transition-all cursor-pointer flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                            <span className="text-xs sm:text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">
                              {page.label}
                            </span>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 transition-colors" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Status & Engine Bar */}
            <div className="p-3 sm:px-5 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <Sparkles className="w-3.5 h-3.5" />
                  PostgreSQL to_tsvector Query
                </span>
                {searchTimeMs !== null && (
                  <span className="text-slate-500 font-mono">({searchTimeMs}ms)</span>
                )}
              </div>
              <div className="flex items-center gap-3 text-slate-400">
                <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-300">↑↓</kbd> Navigate</span>
                <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-300">ESC</kbd> Close</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. NUMERIC PIN POPUP MODAL (Strictly 991061)                               */}
      {/* ========================================================================= */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className={`w-full max-w-sm bg-slate-900 border ${
              pinError
                ? 'border-red-500 shadow-red-500/20'
                : isSuccess
                ? 'border-emerald-500 shadow-emerald-500/20'
                : 'border-slate-800 shadow-blue-500/10'
            } rounded-3xl p-6 sm:p-7 shadow-2xl transition-all duration-300 relative`}
          >
            {/* Close Button */}
            <button
              onClick={() => {
                setShowPinModal(false);
                setPinInput('');
                setPinError(false);
              }}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="text-center mb-6">
              <div
                className={`w-16 h-16 mx-auto mb-3 rounded-2xl flex items-center justify-center border transition-colors ${
                  pinError
                    ? 'bg-red-500/10 border-red-500/30 text-red-400 animate-bounce'
                    : isSuccess
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                }`}
              >
                {pinError ? (
                  <ShieldAlert className="w-8 h-8" />
                ) : isSuccess ? (
                  <ShieldCheck className="w-8 h-8" />
                ) : (
                  <KeyRound className="w-8 h-8" />
                )}
              </div>

              <h3 className="text-xl font-bold text-white tracking-tight">
                Enter Security PIN
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Enter the 6-digit master PIN to access the complete VPS API directory and live health metrics.
              </p>
            </div>

            {/* 6-Digit PIN Indicator Boxes */}
            <div className="flex justify-center items-center gap-2.5 sm:gap-3 mb-6">
              {[0, 1, 2, 3, 4, 5].map((idx) => {
                const isFilled = pinInput.length > idx;
                const isCurrent = pinInput.length === idx;
                return (
                  <div
                    key={idx}
                    className={`w-11 h-12 rounded-xl flex items-center justify-center font-mono text-xl font-bold transition-all duration-200 border ${
                      pinError
                        ? 'bg-red-500/10 border-red-500 text-red-400 animate-pulse'
                        : isSuccess
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400 scale-105'
                        : isFilled
                        ? 'bg-blue-600/15 border-blue-500 text-blue-400 shadow-sm'
                        : isCurrent
                        ? 'bg-slate-800/80 border-slate-500 shadow-[0_0_8px_rgba(59,130,246,0.3)]'
                        : 'bg-slate-800/40 border-slate-700/60 text-slate-500'
                    }`}
                  >
                    {isFilled ? '●' : ''}
                  </div>
                );
              })}
            </div>

            {/* Status Message */}
            <div className="h-6 mb-4 flex items-center justify-center text-center">
              {pinError && (
                <span className="text-xs font-semibold text-red-400 animate-pulse">
                  Incorrect PIN! Access Denied.
                </span>
              )}
              {isSuccess && (
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" /> PIN Verified! Opening API List...
                </span>
              )}
              {isVerifying && !pinError && !isSuccess && (
                <span className="text-xs font-semibold text-blue-400 animate-pulse">
                  Verifying Master PIN...
                </span>
              )}
              {!pinError && !isSuccess && !isVerifying && (
                <span className="text-[11px] text-slate-500">
                  Tap buttons or use physical keyboard
                </span>
              )}
            </div>

            {/* 3x4 Classic Numeric Keypad */}
            <div className="grid grid-cols-3 gap-2 sm:gap-2.5 mb-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  onClick={() => handleDigitPress(digit)}
                  disabled={isVerifying || isSuccess}
                  className="h-13 py-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700/90 active:bg-blue-600 active:scale-95 text-white font-semibold text-lg border border-slate-700/50 shadow-sm transition-all focus:outline-none select-none disabled:opacity-50"
                >
                  {digit}
                </button>
              ))}

              {/* Clear button */}
              <button
                onClick={handleClearPin}
                disabled={isVerifying || isSuccess || pinInput.length === 0}
                className="h-13 py-3 rounded-2xl bg-slate-800/40 hover:bg-slate-800 active:scale-95 text-xs font-semibold text-slate-400 hover:text-white border border-slate-800 transition-all select-none disabled:opacity-30"
              >
                Clear
              </button>

              {/* Digit 0 */}
              <button
                onClick={() => handleDigitPress('0')}
                disabled={isVerifying || isSuccess}
                className="h-13 py-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700/90 active:bg-blue-600 active:scale-95 text-white font-semibold text-lg border border-slate-700/50 shadow-sm transition-all focus:outline-none select-none disabled:opacity-50"
              >
                0
              </button>

              {/* Backspace button */}
              <button
                onClick={handleBackspace}
                disabled={isVerifying || isSuccess || pinInput.length === 0}
                className="h-13 py-3 rounded-2xl bg-slate-800/40 hover:bg-slate-800 active:scale-95 flex items-center justify-center text-slate-400 hover:text-white border border-slate-800 transition-all select-none disabled:opacity-30"
                aria-label="Backspace"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3 text-amber-400" /> Protected Endpoint
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowPinModal(false);
                  setPinInput('');
                  setPinError(false);
                }}
                className="text-slate-400 hover:text-slate-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
