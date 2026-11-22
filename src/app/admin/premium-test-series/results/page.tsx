'use client';

import React, { useEffect, useState } from 'react';
import { premiumTestService } from '@/lib/services/premiumTests';
import { testAttemptService } from '@/lib/services/testAttempts';
import { PremiumTest, TestAttempt } from '@/types';
import {
  Activity,
  Search,
  Filter,
  Trash2,
  RefreshCw,
  Clock,
  Phone,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';

export default function PremiumTestResultsPage() {
  const [attempts, setAttempts] = useState<any[]>([]);
  const [tests, setTests] = useState<PremiumTest[]>([]);
  const [selectedTest, setSelectedTest] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadAll();
  }, [selectedTest]);

  async function loadAll() {
    try {
      setLoading(true);
      const [testsRes, attemptsRes] = await Promise.all([
        premiumTestService.listTests(1, 100),
        testAttemptService.list(1, 100),
      ]);

      setTests(testsRes.data || []);
      setAttempts(attemptsRes.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load test results');
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this test result?')) return;
    try {
      await testAttemptService.delete(id);
      toast.success('Test attempt deleted');
      loadAll();
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete result');
    }
  };

  const filtered = attempts.filter((a) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      a.userName?.toLowerCase().includes(q) ||
      a.userPhone?.toLowerCase().includes(q) ||
      a.testTitle?.toLowerCase().includes(q);

    const matchesTest = selectedTest === 'ALL' || a.testId === selectedTest;
    return matchesSearch && matchesTest;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <span>Premium Test Submissions & Results</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {filtered.length} submissions
            </span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Real-time evaluation logs, student answer statistics and time analysis.
          </p>
        </div>

        <button
          onClick={loadAll}
          className="p-2.5 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors self-start sm:self-auto"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        {/* Filter bar */}
        <div className="p-4 bg-gray-50/70 border-b border-gray-200 flex flex-col md:flex-row items-center gap-3">
          <div className="flex-1 relative w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by student name, phone, or test..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white rounded-xl border border-gray-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-4 h-4 text-gray-400 shrink-0" />
            <select
              value={selectedTest}
              onChange={(e) => setSelectedTest(e.target.value)}
              className="w-full md:w-64 px-3 py-2 bg-white rounded-xl border border-gray-300 text-xs sm:text-sm font-medium text-gray-700"
            >
              <option value="ALL">All Tests</option>
              {tests.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-16 text-center text-gray-500">Loading results...</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-gray-500">No test results found.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100/70 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Test Title</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Correct / Incorrect / Skipped</th>
                  <th className="py-3 px-4">Time Taken</th>
                  <th className="py-3 px-4">Submitted Date</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs sm:text-sm">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-gray-900">{item.userName || 'Student'}</div>
                      <div className="text-xs text-gray-500 font-mono">{item.userPhone || 'N/A'}</div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-800">{item.testTitle}</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-blue-700 text-sm">{item.score}</span>
                      <span className="text-xs text-gray-400"> / {item.totalMarks || 300}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-emerald-600 font-bold">{item.correctCount || 0}</span>
                      <span className="text-gray-400 mx-1">/</span>
                      <span className="text-red-600 font-bold">{item.incorrectCount || 0}</span>
                      <span className="text-gray-400 mx-1">/</span>
                      <span className="text-gray-500">{item.skippedCount || 0}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 font-medium">{item.timeTaken || '60m'}</td>
                    <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                      {item.submittedAt ? new Date(item.submittedAt).toLocaleDateString('en-IN') : 'Recent'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                        title="Delete Result"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
