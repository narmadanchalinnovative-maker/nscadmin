'use client';

import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { ProtectedRoute } from './ProtectedRoute';

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="lg:ml-64">
          <Topbar />
          <main className="p-6">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
