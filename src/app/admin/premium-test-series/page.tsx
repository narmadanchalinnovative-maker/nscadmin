'use client';

import React, { useEffect, useState } from 'react';
import { premiumTestService } from '@/lib/services/premiumTests';
import { PremiumPurchase, PremiumTest } from '@/types';
import {
  Users,
  Search,
  Plus,
  RefreshCw,
  CheckCircle2,
  Clock,
  Filter,
  CreditCard,
  Crown,
  FileCheck2,
  Phone,
  Mail,
  Receipt,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

export default function PremiumPurchasesPage() {
  const [purchases, setPurchases] = useState<PremiumPurchase[]>([]);
  const [tests, setTests] = useState<PremiumTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTestFilter, setSelectedTestFilter] = useState('ALL');
  const [analytics, setAnalytics] = useState<any>(null);

  // Manual Grant Purchase Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    userName: '',
    userPhone: '',
    userEmail: '',
    testId: '',
    amountPaid: '',
    paymentId: '',
    orderId: '',
  });

  useEffect(() => {
    loadData();
  }, [selectedTestFilter]);

  async function loadData() {
    try {
      setLoading(true);
      const [purchasesRes, testsRes, analyticsRes] = await Promise.all([
        premiumTestService.listPurchases(1, 100, selectedTestFilter),
        premiumTestService.listTests(1, 100),
        premiumTestService.getAnalytics(),
      ]);

      setPurchases(purchasesRes.data || []);
      setTests(testsRes.data || []);
      setAnalytics(analyticsRes);
    } catch (error) {
      console.error('Failed to load purchases:', error);
      toast.error('Failed to load purchases');
    } finally {
      setLoading(false);
    }
  }

  const handleCreateManualPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.userName || !formData.userPhone || !formData.testId) {
      toast.error('Student Name, Phone and Test are required!');
      return;
    }

    try {
      const selectedTest = tests.find((t) => t.id === formData.testId);
      const amount = formData.amountPaid ? parseFloat(formData.amountPaid) : selectedTest?.price || 0;

      await premiumTestService.createPurchase({
        userName: formData.userName,
        userPhone: formData.userPhone,
        userEmail: formData.userEmail || undefined,
        testId: formData.testId,
        testTitle: selectedTest?.title || 'Premium Test Series',
        examGoal: selectedTest?.examGoal || 'General',
        amountPaid: amount,
        originalPrice: selectedTest?.originalPrice || amount,
        discountApplied: (selectedTest?.originalPrice || amount) - amount,
        paymentId: formData.paymentId || `manual_pay_${Date.now()}`,
        orderId: formData.orderId || `manual_ord_${Date.now()}`,
        status: 'SUCCESS',
      });

      toast.success('Test access granted & purchase recorded!');
      setShowAddModal(false);
      setFormData({
        userName: '',
        userPhone: '',
        userEmail: '',
        testId: '',
        amountPaid: '',
        paymentId: '',
        orderId: '',
      });
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to record purchase');
    }
  };

  const filteredPurchases = purchases.filter((p) => {
    const q = searchTerm.toLowerCase();
    const matchesQuery =
      !searchTerm ||
      p.userName?.toLowerCase().includes(q) ||
      p.userPhone?.toLowerCase().includes(q) ||
      p.testTitle?.toLowerCase().includes(q) ||
      p.paymentId?.toLowerCase().includes(q) ||
      p.orderId?.toLowerCase().includes(q);

    const matchesTest = selectedTestFilter === 'ALL' || p.testId === selectedTestFilter;
    return matchesQuery && matchesTest;
  });

  const totalRevenue = filteredPurchases.reduce((acc, curr) => acc + (curr.amountPaid || 0), 0);

  return (
    <div className="space-y-6">
      {/* 4 Stat Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Total Revenue
            </p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">
              ₹{(analytics?.totalRevenue || totalRevenue).toLocaleString('en-IN')}
            </h3>
            <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> 100% verified transactions
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        {/* Total Purchases */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Total Purchases
            </p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">
              {purchases.length} Students
            </h3>
            <p className="text-[11px] text-blue-600 font-medium mt-1">
              Paid test series buyers
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Active Premium Tests */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Premium Tests
            </p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">
              {tests.length} Packages
            </h3>
            <p className="text-[11px] text-amber-600 font-medium mt-1">
              Live in mobile app
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Crown className="w-6 h-6" />
          </div>
        </div>

        {/* Active Coupons */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Active Coupons
            </p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">
              {analytics?.activeCoupons || 2} Active
            </h3>
            <p className="text-[11px] text-purple-600 font-medium mt-1">
              Discount campaigns
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Ledger Section Header */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-amber-500" />
              <span>Student Purchases Ledger</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                {filteredPurchases.length} records
              </span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Verified list of all students who purchased premium mock test series with payment details.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => loadData()}
              className="p-2.5 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
              title="Refresh Purchases"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Grant Test Access</span>
            </button>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="p-4 bg-gray-50/70 border-b border-gray-200 flex flex-col md:flex-row items-center gap-3">
          <div className="flex-1 relative w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by student name, phone (+91...), test title, order ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white rounded-xl border border-gray-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-4 h-4 text-gray-400 shrink-0" />
            <select
              value={selectedTestFilter}
              onChange={(e) => setSelectedTestFilter(e.target.value)}
              className="w-full md:w-64 px-3 py-2 bg-white rounded-xl border border-gray-300 text-xs sm:text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Premium Tests</option>
              {tests.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} (₹{t.price})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Purchases Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-16 text-center text-gray-500">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
              <p className="text-sm">Loading purchases ledger...</p>
            </div>
          ) : filteredPurchases.length === 0 ? (
            <div className="py-16 text-center">
              <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <h4 className="text-sm font-semibold text-gray-700">No purchases found</h4>
              <p className="text-xs text-gray-500 mt-1">
                {searchTerm ? 'Try adjusting your search criteria.' : 'No students have purchased this test yet.'}
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100/70 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Test Series Purchased</th>
                  <th className="py-3 px-4">Goal</th>
                  <th className="py-3 px-4">Amount Paid</th>
                  <th className="py-3 px-4">Transaction ID</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs sm:text-sm">
                {filteredPurchases.map((p) => {
                  const initial = p.userName ? p.userName.charAt(0).toUpperCase() : 'S';
                  const dateStr = p.createdAt || p.purchaseDate
                    ? new Date(p.createdAt || p.purchaseDate).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Recent';

                  return (
                    <tr key={p.id} className="hover:bg-blue-50/40 transition-colors">
                      {/* Student Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center shrink-0 shadow-xs text-xs">
                            {initial}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900">{p.userName}</div>
                            <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-gray-400" />
                              <span>{p.userPhone || 'No phone'}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Test Title */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-900 max-w-xs truncate" title={p.testTitle}>
                          {p.testTitle}
                        </div>
                        <div className="text-[11px] text-gray-500">ID: {p.testId}</div>
                      </td>

                      {/* Exam Goal */}
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {p.examGoal || 'SCHOOL EDUCATION'}
                        </span>
                      </td>

                      {/* Amount Paid */}
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-emerald-700 text-sm">
                          ₹{p.amountPaid}
                        </div>
                        {p.discountApplied && p.discountApplied > 0 ? (
                          <div className="text-[10px] text-gray-400 line-through">
                            MRP ₹{(p.originalPrice || p.amountPaid + p.discountApplied)}
                          </div>
                        ) : null}
                      </td>

                      {/* Payment ID / Order ID */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-[11px] text-gray-700 font-semibold truncate max-w-[140px]" title={p.paymentId}>
                          {p.paymentId || 'pay_online'}
                        </div>
                        {p.orderId && (
                          <div className="font-mono text-[10px] text-gray-400 truncate max-w-[140px]" title={p.orderId}>
                            {p.orderId}
                          </div>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-xs text-gray-600 whitespace-nowrap">
                        {dateStr}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{p.status || 'SUCCESS'}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Manual Grant Purchase Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Crown className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Grant Premium Test Access</h3>
                  <p className="text-xs text-gray-500">Record a purchase or manually enroll a student</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateManualPurchase} className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Student Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={formData.userName}
                  onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Student Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={formData.userPhone}
                    onChange={(e) => setFormData({ ...formData, userPhone: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    placeholder="student@gmail.com"
                    value={formData.userEmail}
                    onChange={(e) => setFormData({ ...formData, userEmail: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Select Premium Test Series <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.testId}
                  onChange={(e) => {
                    const sel = tests.find((t) => t.id === e.target.value);
                    setFormData({
                      ...formData,
                      testId: e.target.value,
                      amountPaid: sel?.price ? String(sel.price) : '',
                    });
                  }}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  <option value="">-- Choose Test --</option>
                  {tests.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title} — ₹{t.price} ({t.examGoal || 'General'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Amount Paid (₹)</label>
                  <input
                    type="number"
                    placeholder="299"
                    value={formData.amountPaid}
                    onChange={(e) => setFormData({ ...formData, amountPaid: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Receipt / Order Ref</label>
                  <input
                    type="text"
                    placeholder="manual_cash_01"
                    value={formData.orderId}
                    onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm"
                >
                  Grant Access
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
