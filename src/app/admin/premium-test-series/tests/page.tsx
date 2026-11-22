'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { premiumTestService } from '@/lib/services/premiumTests';
import { examGoalService } from '@/lib/services/examGoals';
import { batchService } from '@/lib/services/batches';
import { PremiumTest, ExamGoal, Batch } from '@/types';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  Crown,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  HelpCircle,
  DollarSign,
  Tag,
  Clock,
  BookOpen,
  ArrowRight,
  Sparkles,
  Zap,
  Save,
  X,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

export default function PremiumTestsManagerPage() {
  const router = useRouter();
  const [tests, setTests] = useState<PremiumTest[]>([]);
  const [examGoals, setExamGoals] = useState<ExamGoal[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGoal, setSelectedGoal] = useState('ALL');

  // Inline Quick Real-time Price Editing State
  const [editingPriceTestId, setEditingPriceTestId] = useState<string | null>(null);
  const [quickPrice, setQuickPrice] = useState('');
  const [quickOriginalPrice, setQuickOriginalPrice] = useState('');
  const [isUpdatingPrice, setIsUpdatingPrice] = useState(false);

  // Full Create / Edit Modal State
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingTest, setEditingTest] = useState<PremiumTest | null>(null);
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
    loadAll();
  }, [selectedGoal]);

  async function loadAll() {
    try {
      setLoading(true);
      const [testsRes, goalsRes, batchesRes] = await Promise.all([
        premiumTestService.listTests(1, 100, selectedGoal),
        examGoalService.list(1, 50).catch(() => ({ data: [] })),
        batchService.list(1, 100).catch(() => ({ data: [] })),
      ]);

      setTests(testsRes.data || []);
      setExamGoals(goalsRes.data || []);
      setBatches(batchesRes.data || []);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load tests');
    } finally {
      setLoading(false);
    }
  }

  // Real-time price update
  const handleSavePriceRealtime = async (testId: string) => {
    const numPrice = parseFloat(quickPrice);
    const numOrig = parseFloat(quickOriginalPrice) || numPrice;
    if (isNaN(numPrice) || numPrice < 0) {
      toast.error('Please enter a valid price amount');
      return;
    }

    try {
      setIsUpdatingPrice(true);
      await premiumTestService.updatePriceRealtime(testId, numPrice, numOrig);
      toast.success('Price updated in real-time! ⚡', {
        description: `Now live at ₹${numPrice} in students mobile app.`,
      });
      setEditingPriceTestId(null);
      loadAll();
    } catch (e: any) {
      toast.error(e.message || 'Failed to update price');
    } finally {
      setIsUpdatingPrice(false);
    }
  };

  const handleStartEditPrice = (test: PremiumTest) => {
    setEditingPriceTestId(test.id || null);
    setQuickPrice(String(test.price ?? 299));
    setQuickOriginalPrice(String(test.originalPrice ?? 999));
  };

  // Open Full Create / Edit Modal
  const handleOpenCreateModal = () => {
    setEditingTest(null);
    setFormData({
      title: '',
      description: '',
      examGoal: selectedGoal !== 'ALL' ? selectedGoal : 'SCHOOL EDUCATION',
      batchId: batches[0]?.id || '',
      price: '299',
      originalPrice: '999',
      discount: '70% OFF',
      totalQuestions: '50',
      duration: '180',
      totalMarks: '300',
      validity: '1 Year Validity',
      language: 'Hindi & English',
      isDemoAvailable: true,
      status: 'active',
    });
    setShowFormModal(true);
  };

  const handleOpenEditModal = (test: PremiumTest) => {
    setEditingTest(test);
    setFormData({
      title: test.title || '',
      description: test.description || '',
      examGoal: test.examGoal || 'SCHOOL EDUCATION',
      batchId: test.batchId || '',
      price: String(test.price ?? 299),
      originalPrice: String(test.originalPrice ?? 999),
      discount: test.discount || '',
      totalQuestions: String(test.totalQuestions ?? 50),
      duration: String(test.duration ?? 180),
      totalMarks: String(test.totalMarks ?? 300),
      validity: test.validity || '1 Year Validity',
      language: test.language || 'Hindi & English',
      isDemoAvailable: test.isDemoAvailable ?? true,
      status: (test.status as any) || 'active',
    });
    setShowFormModal(true);
  };

  const handleSaveTestForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      toast.error('Title and description are required!');
      return;
    }

    try {
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

      if (editingTest?.id) {
        await premiumTestService.updateTest(editingTest.id, payload, 'admin');
        toast.success('Premium Test updated successfully!');
      } else {
        const newId = await premiumTestService.createTest(payload, 'admin');
        toast.success('Premium Test created successfully! 🎉');
        setShowFormModal(false);
        // Automatically ask to navigate to add questions
        toast('Ready to add questions?', {
          action: {
            label: 'Add Questions',
            onClick: () => router.push(`/admin/tests/${newId}/questions`),
          },
        });
      }

      setShowFormModal(false);
      loadAll();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save test');
    }
  };

  const handleDeleteTest = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete test "${title}"?`)) return;
    try {
      await premiumTestService.deleteTest(id);
      toast.success('Test deleted successfully');
      loadAll();
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete test');
    }
  };

  const handleToggleStatus = async (test: PremiumTest) => {
    if (!test.id) return;
    const newStatus = test.status === 'active' ? 'inactive' : 'active';
    try {
      await premiumTestService.updateTest(test.id, { status: newStatus }, 'admin');
      toast.success(`Test marked as ${newStatus}`);
      loadAll();
    } catch (e: any) {
      toast.error('Failed to change status');
    }
  };

  const filteredTests = tests.filter((t) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      t.title?.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q) ||
      t.examGoal?.toLowerCase().includes(q);

    const matchesGoal =
      selectedGoal === 'ALL' ||
      (t.examGoal && t.examGoal.toUpperCase().includes(selectedGoal.toUpperCase()));

    return matchesSearch && matchesGoal;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Exam Goal Filter Tabs */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-amber-500" />
              <span>Goal-wise Premium Mock Tests</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                {filteredTests.length} tests
              </span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Create and manage paid test packages. Adjust price in real time with instant updates across mobile apps.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold text-xs sm:text-sm shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create Premium Test</span>
            </button>
          </div>
        </div>

        {/* Exam Goals Filter Bar */}
        <div className="px-5 py-3 bg-gray-50/70 border-b border-gray-200 flex items-center gap-2 overflow-x-auto scrollbar-none text-xs">
          <span className="font-semibold text-gray-500 uppercase tracking-wider text-[11px] mr-1">
            Exam Goal:
          </span>
          {['ALL', 'SCHOOL EDUCATION', 'COMPETETIVE EXAMS', 'TECHNICAL TRAININGS'].map((goal) => {
            const isSelected = selectedGoal === goal;
            return (
              <button
                key={goal}
                onClick={() => setSelectedGoal(goal)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs scale-105'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                {goal === 'ALL' ? '🌟 All Goals' : goal}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="p-4 bg-white flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search tests by title, description or syllabus..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-xl border border-gray-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Tests List Grid / Cards */}
        <div className="p-5">
          {loading ? (
            <div className="py-16 text-center text-gray-500">
              <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm">Loading premium tests...</p>
            </div>
          ) : filteredTests.length === 0 ? (
            <div className="py-16 text-center">
              <CheckSquare className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <h4 className="text-base font-semibold text-gray-800">No premium tests found</h4>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                No tests match your filter for {selectedGoal}. Click "Create Premium Test" to publish a new mock series.
              </p>
              <button
                onClick={handleOpenCreateModal}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold"
              >
                <Plus className="w-4 h-4" /> Create Test Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredTests.map((test) => {
                const isEditingPrice = editingPriceTestId === test.id;
                const questionsCount = test.questions?.length || test.totalQuestions || 50;

                return (
                  <div
                    key={test.id}
                    className="bg-white rounded-2xl border border-gray-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
                  >
                    <div>
                      {/* Top Strip with Goal & Status */}
                      <div className="p-4 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {test.examGoal || 'SCHOOL EDUCATION'}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleStatus(test)}
                            className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                              test.status === 'active'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200'
                                : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
                            }`}
                            title="Click to toggle status"
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                test.status === 'active' ? 'bg-emerald-500' : 'bg-gray-400'
                              }`}
                            />
                            <span>{test.status === 'active' ? 'LIVE' : 'INACTIVE'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 space-y-3">
                        <div>
                          <h3 className="font-bold text-gray-900 text-base group-hover:text-blue-600 transition-colors line-clamp-1">
                            {test.title}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                            {test.description || 'Comprehensive test series with video solutions and All-India ranks.'}
                          </p>
                        </div>

                        {/* Specs Pills (Matching mobile card) */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-[11px] font-medium flex items-center gap-1">
                            <BookOpen className="w-3 h-3 text-gray-500" />
                            {questionsCount} Qs
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-[11px] font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3 text-gray-500" />
                            {test.duration || 180} Mins
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-[11px] font-medium">
                            ⭐️ {test.totalMarks || 300} Marks
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-[11px] font-medium">
                            {test.language || 'Hindi & English'}
                          </span>
                        </div>

                        {/* Real-time Price Management Box */}
                        <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/80 mt-2">
                          <div className="flex items-center justify-between text-xs font-semibold text-amber-800 mb-1.5">
                            <span className="flex items-center gap-1">
                              <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-600" /> Real-time Price
                            </span>
                            {!isEditingPrice && (
                              <button
                                onClick={() => handleStartEditPrice(test)}
                                className="text-amber-700 hover:text-amber-900 font-bold flex items-center gap-1 text-[11px]"
                              >
                                <Edit2 className="w-3 h-3" /> Quick Edit
                              </button>
                            )}
                          </div>

                          {isEditingPrice ? (
                            <div className="space-y-2 animate-in fade-in duration-100">
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[10px] text-gray-500 font-bold block">
                                    Sell Price (₹)
                                  </label>
                                  <input
                                    type="number"
                                    value={quickPrice}
                                    onChange={(e) => setQuickPrice(e.target.value)}
                                    className="w-full px-2 py-1 text-sm font-bold bg-white border border-amber-300 rounded focus:ring-1 focus:ring-amber-500"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] text-gray-500 font-bold block">
                                    MRP (₹)
                                  </label>
                                  <input
                                    type="number"
                                    value={quickOriginalPrice}
                                    onChange={(e) => setQuickOriginalPrice(e.target.value)}
                                    className="w-full px-2 py-1 text-sm font-bold bg-white border border-amber-300 rounded focus:ring-1 focus:ring-amber-500"
                                  />
                                </div>
                              </div>
                              <div className="flex items-center gap-2 pt-1">
                                <button
                                  onClick={() => handleSavePriceRealtime(test.id!)}
                                  disabled={isUpdatingPrice}
                                  className="flex-1 py-1 rounded bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-1 hover:bg-amber-700 disabled:opacity-50"
                                >
                                  <Save className="w-3 h-3" /> Save Live Price
                                </button>
                                <button
                                  onClick={() => setEditingPriceTestId(null)}
                                  className="p-1 text-gray-500 hover:text-gray-700"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-baseline justify-between">
                              <div className="flex items-baseline gap-2">
                                <span className="text-xl font-black text-gray-900">
                                  ₹{test.price ?? 299}
                                </span>
                                {test.originalPrice && test.originalPrice > (test.price || 0) && (
                                  <span className="text-xs text-gray-400 line-through">
                                    ₹{test.originalPrice}
                                  </span>
                                )}
                              </div>
                              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                                {test.discount || '70% OFF'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Actions: Follows http://localhost:3000/admin/tests standard */}
                    <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-2">
                      {/* Manage Questions Link */}
                      <Link
                        href={`/admin/tests/${test.id}/questions`}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>Manage Questions ({test.questions?.length || 0})</span>
                      </Link>

                      <button
                        onClick={() => handleOpenEditModal(test)}
                        className="p-2 rounded-xl border border-gray-300 text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Edit Details"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteTest(test.id!, test.title)}
                        className="p-2 rounded-xl border border-gray-300 text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete Test"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Full Create / Edit Modal (Matching all App Card details) */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">
                    {editingTest ? 'Edit Premium Test Series' : 'Create New Premium Test'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Follows admin test standard with mandatory pricing & app card details
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowFormModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTestForm} className="space-y-4 text-xs sm:text-sm">
              {/* Title */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Test Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. School Education - Complete Premium Test Series 2026"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>

              {/* Description / Subtitle */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Description / Subtitle <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. 25 Full Mock Tests + 50 Subject Mocks with All-India Percentile & Video Solutions"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>

              {/* Exam Goal & Batch */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Exam Goal <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.examGoal}
                    onChange={(e) => setFormData({ ...formData, examGoal: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
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
                  <label className="block font-semibold text-gray-700 mb-1">
                    Linked Batch (Optional)
                  </label>
                  <select
                    value={formData.batchId}
                    onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    <option value="">No Batch Restriction (Universal)</option>
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Price & MRP Pricing */}
              <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-200">
                <div className="flex items-center gap-1.5 font-bold text-amber-900 mb-3">
                  <Zap className="w-4 h-4 text-amber-600" />
                  <span>Real-Time Pricing & Discount Configuration</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Selling Price (₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="299"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-black text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Original MRP (₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="999"
                      value={formData.originalPrice}
                      onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Discount Badge Tag
                    </label>
                    <input
                      type="text"
                      placeholder="70% OFF"
                      value={formData.discount}
                      onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-emerald-700"
                    />
                  </div>
                </div>
              </div>

              {/* App Card Specs (Questions, Duration, Marks, Validity, Language) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Questions</label>
                  <input
                    type="number"
                    value={formData.totalQuestions}
                    onChange={(e) => setFormData({ ...formData, totalQuestions: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 focus:ring-1 focus:ring-blue-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Duration (Min)</label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 focus:ring-1 focus:ring-blue-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Total Marks</label>
                  <input
                    type="number"
                    value={formData.totalMarks}
                    onChange={(e) => setFormData({ ...formData, totalMarks: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 focus:ring-1 focus:ring-blue-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Language</label>
                  <input
                    type="text"
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 focus:ring-1 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Validity</label>
                  <input
                    type="text"
                    placeholder="1 Year Validity"
                    value={formData.validity}
                    onChange={(e) => setFormData({ ...formData, validity: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Free Demo Test?</label>
                  <select
                    value={formData.isDemoAvailable ? 'yes' : 'no'}
                    onChange={(e) => setFormData({ ...formData, isDemoAvailable: e.target.value === 'yes' })}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    <option value="yes">Yes (Allow 1 Free Demo)</option>
                    <option value="no">No Demo (Paid Only)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    <option value="active">Active (Visible)</option>
                    <option value="inactive">Inactive (Hidden)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold shadow-sm"
                >
                  {editingTest ? 'Update Test' : 'Create & Proceed to Questions'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
