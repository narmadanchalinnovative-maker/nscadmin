'use client';

import { useAuth } from '@/lib/auth-context';
import { User, Settings } from 'lucide-react';
import { AdminNotificationCenter } from './AdminNotificationCenter';

export function Topbar() {
  const { adminUser } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-30 shadow-xs">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Welcome back!</h2>
          <p className="text-sm text-gray-600">{adminUser?.email || 'admin@nsc.com'}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Real-time Notification Center */}
          <AdminNotificationCenter />

          <button className="p-2.5 hover:bg-gray-100 rounded-xl border border-transparent hover:border-gray-200 text-gray-600 transition-colors" title="Settings">
            <Settings className="w-5 h-5 text-gray-600" />
          </button>
          
          <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-xs">
              {adminUser?.email?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-gray-900 leading-none mb-1">Admin User</p>
              <p className="text-xs text-gray-500 capitalize leading-none">{adminUser?.role || 'Super Admin'}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
