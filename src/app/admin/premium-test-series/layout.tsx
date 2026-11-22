'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Crown,
  Users,
  CheckSquare,
  Image as ImageIcon,
  Activity,
  Target,
  Tag,
  Sparkles,
  Zap,
} from 'lucide-react';

const subNavTabs = [
  {
    label: 'Purchases Ledger',
    href: '/admin/premium-test-series',
    exact: true,
    icon: Users,
    badge: 'Students',
  },
  {
    label: 'Manage & Create Tests',
    href: '/admin/premium-test-series/tests',
    icon: CheckSquare,
    badge: 'Real-time Price',
  },
  {
    label: 'Banners & Media',
    href: '/admin/premium-test-series/banners',
    icon: ImageIcon,
    badge: 'Video/GIF/Img',
  },
  {
    label: 'Test Results',
    href: '/admin/premium-test-series/results',
    icon: Activity,
    badge: 'Attempts',
  },
  {
    label: 'Test Leaderboard',
    href: '/admin/premium-test-series/leaderboard',
    icon: Target,
    badge: 'Toppers',
  },
  {
    label: 'Discount Coupons',
    href: '/admin/premium-test-series/coupons',
    icon: Tag,
    badge: 'Test-wise',
  },
];

export default function PremiumTestSeriesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      {/* Premium Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 text-white border border-slate-800 shadow-xl">
        <div className="absolute right-0 top-0 -mt-6 -mr-6 w-52 h-52 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 p-0.5 shadow-lg shadow-amber-500/20 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Crown className="w-7 h-7 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  Premium Test Series Hub
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-sm">
                  <Sparkles className="w-3 h-3" />
                  TOPPERS SUITE
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Full-featured control centre: Goal-wise paid mock tests, real-time pricing, verified purchases, multi-format media banners & test-specific rank leaderboards.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs font-medium text-emerald-400 shadow-inner">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Real-time DB Sync Active
            </span>
          </div>
        </div>

        {/* Secondary Sub-Sidebar Navigation Tabs */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {subNavTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.exact
              ? pathname === tab.href || pathname === '/admin/premium-test-series/purchases'
              : pathname.startsWith(tab.href);

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/25 scale-[1.02]'
                    : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-amber-400'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                      isActive
                        ? 'bg-slate-950/20 text-slate-900'
                        : 'bg-slate-700/60 text-slate-400'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div>{children}</div>
    </div>
  );
}
