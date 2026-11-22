'use client';

import React, { useEffect, useState } from 'react';
import { premiumTestService } from '@/lib/services/premiumTests';
import { PremiumCoupon, PremiumTest } from '@/types';
import {
  Tag,
  Plus,
  Trash2,
  Percent,
  DollarSign,
  CheckCircle2,
  Calendar,
  Sparkles,
  Ticket,
} from 'lucide-react';
import { toast } from 'sonner';

export default function PremiumCouponsPage() {
  const [coupons, setCoupons] = useState<PremiumCoupon[]>([]);
  const [tests, setTests] = useState<PremiumTest[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'FLAT' as 'FLAT' | 'PERCENT',
    discountValue: '50',
    maxDiscount: '',
    testId: '',
    minOrderAmount: '199',
    isActive: true,
  });

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    try {
      setLoading(true);
      const [couponsRes, testsRes] = await Promise.all([
        premiumTestService.listCoupons(),
        premiumTestService.listTests(1, 100),
      ]);
      setCoupons(couponsRes || []);
      setTests(testsRes.data || []);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  }

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.discountValue) {
      toast.error('Coupon code and discount value are required!');
      return;
    }

    try {
      const selectedTest = tests.find((t) => t.id === formData.testId);

      await premiumTestService.createCoupon({
        code: formData.code.toUpperCase().trim(),
        description: formData.description || undefined,
        discountType: formData.discountType,
        discountValue: parseFloat(formData.discountValue) || 0,
        maxDiscount: formData.maxDiscount ? parseFloat(formData.maxDiscount) : undefined,
        testId: formData.testId || undefined,
        testTitle: selectedTest ? selectedTest.title : 'All Premium Tests',
        minOrderAmount: parseFloat(formData.minOrderAmount) || 0,
        isActive: formData.isActive,
      });

      toast.success('Test coupon created successfully! 🏷️');
      setShowAddModal(false);
      setFormData({
        code: '',
        description: '',
        discountType: 'FLAT',
        discountValue: '50',
        maxDiscount: '',
        testId: '',
        minOrderAmount: '199',
        isActive: true,
      });
      loadAll();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create coupon');
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    try {
      await premiumTestService.deleteCoupon(id);
      toast.success('Coupon deleted');
      loadAll();
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete coupon');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Ticket className="w-5 h-5 text-amber-500" />
            <span>Test-Wise Discount Coupons</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              {coupons.length} coupons
            </span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Configure test-specific and universal discount codes with minimum order criteria.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold text-xs sm:text-sm shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Create Test Coupon</span>
        </button>
      </div>

      {/* Coupons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-16 text-center text-gray-500">Loading coupons...</div>
        ) : coupons.length === 0 ? (
          <div className="col-span-full py-16 text-center text-gray-500">
            No discount coupons created yet. Click "Create Test Coupon" to add one.
          </div>
        ) : (
          coupons.map((c) => {
            const isPercent = c.discountType === 'PERCENT';
            return (
              <div
                key={c.id || c.code}
                className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-all relative overflow-hidden"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-base font-black px-3 py-1 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 tracking-wider">
                      {c.code}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        c.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {c.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xl font-black text-gray-900">
                      {isPercent ? `${c.discountValue}% OFF` : `₹${c.discountValue} FLAT OFF`}
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">{c.description || 'Valid on test series purchase'}</p>
                  </div>

                  {/* Applicable Test */}
                  <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100 text-xs">
                    <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">
                      Applicable On:
                    </span>
                    <span className="font-semibold text-gray-800 truncate block mt-0.5">
                      {c.testTitle || 'All Premium Tests'}
                    </span>
                    <span className="text-[11px] text-gray-500 block mt-1">
                      Min Order: ₹{c.minOrderAmount || 0}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 mt-4 flex items-center justify-between text-xs text-gray-500">
                  <span>Used: {c.usedCount || 0} times</span>
                  <button
                    onClick={() => handleDeleteCoupon(c.id || c.code)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Delete Coupon"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Coupon Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-gray-900 text-base">Create Test-Wise Coupon</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-700">✕</button>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Coupon Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TOPPER50"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Flat ₹50 OFF on Chemistry Premium Series"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Discount Type</label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 font-semibold"
                  >
                    <option value="FLAT">Flat ₹ Amount</option>
                    <option value="PERCENT">Percentage % OFF</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Discount Value ({formData.discountType === 'PERCENT' ? '%' : '₹'}) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="50"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Assign to Specific Test (Test-Wise Discount)
                </label>
                <select
                  value={formData.testId}
                  onChange={(e) => setFormData({ ...formData, testId: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 font-medium"
                >
                  <option value="">🌟 Universal (Applicable to All Premium Tests)</option>
                  {tests.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title} (₹{t.price})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Min Order Amount (₹)</label>
                  <input
                    type="number"
                    placeholder="199"
                    value={formData.minOrderAmount}
                    onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.isActive ? 'active' : 'inactive'}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'active' })}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 font-medium"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-blue-600 text-white font-bold rounded-xl">Create Coupon</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
