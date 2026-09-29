'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const menuItems = [
  { label: 'Dashboard', href: '/admin', icon: BarChart3 },

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
  { label: 'Cloudinary Manager', href: '/admin/cloudinary', icon: Database },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
  { label: 'Support Info', href: '/admin/support', icon: Headset },
  { label: 'Support Tickets', href: '/admin/support-tickets', icon: Ticket },
  { label: 'Coupons', href: '/admin/coupons', icon: Tag },
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout, adminUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        className="lg:hidden fixed bottom-6 right-6 z-50 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-slate-900 text-white p-6 transform transition-transform lg:translate-x-0 z-40 overflow-y-auto flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Admin</h1>
          <p className="text-sm text-gray-400 mt-1">{adminUser?.role}</p>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-slate-800'
                }`}
                onClick={() => setIsOpen(false)}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <button
          onClick={handleLogout}
          className="w-full mt-8 flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </aside>
    </>
  );
}
