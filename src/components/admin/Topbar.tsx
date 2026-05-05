'use client';

import { useAuth } from '@/lib/auth-context';
import { User, Settings } from 'lucide-react';

export function Topbar() {
  const { adminUser } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 lg:ml-64">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Welcome back!</h2>
          <p className="text-sm text-gray-600">{adminUser?.email}</p>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Settings className="w-6 h-6 text-gray-600" />
          </button>
          <div className="flex items-center gap-2 pl-4 border-l border-gray-200">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
              {adminUser?.email?.[0]?.toUpperCase() || 'A'}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Admin User</p>
              <p className="text-xs text-gray-500 capitalize">{adminUser?.role}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
