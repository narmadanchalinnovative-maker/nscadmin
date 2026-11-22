'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { premiumTestService } from '@/lib/services/premiumTests';
import { examGoalService } from '@/lib/services/examGoals';
import { batchService } from '@/lib/services/batches';
import { ExamGoal, Batch } from '@/types';
import { Crown, ArrowLeft, Zap, Save, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function CreatePremiumTestDedicatedPage() {
  const router = useRouter();
  const [examGoals, setExamGoals] = useState<ExamGoal[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    examGoal: 'SCHOOL EDUCATION',
    batchId: '',
    price: '299',
    originalPrice: '999',
    discount: '70% OFF',
    totalQuestions: '50',
    duration: '180',
    totalMarks: '300',
    validity: '1 Year Validity',
    language: 'Hindi & English',
    isDemoAvailable: true,
    status: 'active' as 'active' | 'inactive',
  });

  useEffect(() => {
    Promise.all([
      examGoalService.list(1, 50).catch(() => ({ data: [] })),
      batchService.list(1, 100).catch(() => ({ data: [] })),
    ]).then(([gRes, bRes]) => {
      setExamGoals(gRes.data || []);
      setBatches(bRes.data || []);
      if (bRes.data?.length) {
        setFormData((prev) => ({ ...prev, batchId: bRes.data[0].id }));
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      toast.error('Title and description are required!');
      return;
    }

    try {
      setIsSubmitting(true);
      const p = parseFloat(formData.price) || 0;
      const op = parseFloat(formData.originalPrice) || p;
      let disc = formData.discount;
      if (!disc && op > p && p > 0) {
        disc = `${Math.round(((op - p) / op) * 100)}% OFF`;
      }

      const payload: any = {
        title: formData.title,
        description: formData.description,
        examGoal: formData.examGoal,
        batchId: formData.batchId || undefined,
        price: p,
        originalPrice: op,
        discount: disc,
        totalQuestions: parseInt(formData.totalQuestions, 10) || 50,
        duration: parseInt(formData.duration, 10) || 180,
        totalMarks: parseFloat(formData.totalMarks) || 300,
        validity: formData.validity,
        language: formData.language,
        isDemoAvailable: formData.isDemoAvailable,
        status: formData.status,
      };

      const newId = await premiumTestService.createTest(payload, 'admin');
      toast.success('Premium Test created successfully! 🎉');
      router.push(`/admin/tests/${newId}/questions`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create test');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Crown className="w-6 h-6 text-amber-500" />
            <span>Create New Premium Test Series</span>
          </h1>
          <p className="text-xs text-gray-500">
            Follows the /admin/tests standard. After creation, you will add questions directly.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Test Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. MP Police - Full Length Premium Mock Pack 2026"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Description / Highlights <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            rows={3}
            placeholder="e.g. 25 Full Mocks + 50 Subject Mocks with All-India Percentile & Video Solutions"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Exam Goal <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.examGoal}
              onChange={(e) => setFormData({ ...formData, examGoal: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="SCHOOL EDUCATION">SCHOOL EDUCATION</option>
              <option value="COMPETETIVE EXAMS">COMPETETIVE EXAMS</option>
              <option value="TECHNICAL TRAININGS">TECHNICAL TRAININGS</option>
              {examGoals.map((g) => (
                <option key={g.id} value={g.label}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Cohort Batch (Optional)
            </label>
            <select
              value={formData.batchId}
              onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="">No Batch Restriction</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Pricing Box */}
        <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 space-y-3">
          <div className="flex items-center gap-1.5 font-bold text-amber-900 text-sm">
            <Zap className="w-4 h-4 text-amber-600" /> Real-time Pricing Controls
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Selling Price (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                placeholder="299"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 font-black text-gray-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                MRP (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                placeholder="999"
                value={formData.originalPrice}
                onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 text-gray-600 font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Discount Tag</label>
              <input
                type="text"
                placeholder="70% OFF"
                value={formData.discount}
                onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 font-semibold text-emerald-700"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Total Qs</label>
            <input
              type="number"
              value={formData.totalQuestions}
              onChange={(e) => setFormData({ ...formData, totalQuestions: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Duration (Mins)</label>
            <input
              type="number"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Total Marks</label>
            <input
              type="number"
              value={formData.totalMarks}
              onChange={(e) => setFormData({ ...formData, totalMarks: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Language</label>
            <input
              type="text"
              value={formData.language}
              onChange={(e) => setFormData({ ...formData, language: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold shadow-sm disabled:opacity-50 flex items-center gap-2"
          >
            <span>Create Test & Add Questions</span>
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
