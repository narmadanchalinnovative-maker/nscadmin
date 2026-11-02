'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { testAttemptService } from '@/lib/services/testAttempts';
import { TestAttempt, PaginatedResponse } from '@/types';
import { Search, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function TestResultsPage() {
  const { adminUser } = useAuth();
  const [data, setData] = useState<PaginatedResponse<TestAttempt> | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchResults();
  }, [currentPage, searchTerm]);

  async function fetchResults() {
    try {
      setLoading(true);
      let result;
      if (searchTerm) {
        result = await testAttemptService.search(searchTerm, currentPage);
      } else {
        result = await testAttemptService.list(currentPage);
      }
      setData(result);
    } catch (error) {
      console.error('Error fetching test results:', error);
      toast.error('Failed to fetch test results');
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this test result?')) return;
    try {
      await testAttemptService.delete(id);
      toast.success('Test result deleted');
      fetchResults();
    } catch (error) {
      console.error('Error deleting result:', error);
      toast.error('Failed to delete result');
    }
  };

  const totalPages = data ? Math.ceil(data.total / 10) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Test Results</h1>
          <p className="text-gray-600 mt-1">View student test performances</p>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by student name..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full"></div>
          </div>
        </div>
      ) : (!data?.data || data.data.length === 0) ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-600">No test results found</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Student Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Test Title</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Score</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Correct / Wrong / Skipped</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {(data?.data || []).map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{item.userName || '-'}</div>
                      <div className="text-xs text-gray-500 mt-1">{item.userPhone || 'No number'}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.testTitle || '-'}</td>
                    <td className="px-6 py-4 text-sm font-bold text-blue-600">
                      {item.score} / {item.totalMarks}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="text-green-600 font-medium">{item.correctCount}</span>
                      <span className="text-gray-400 mx-1">/</span>
                      <span className="text-red-600 font-medium">{item.incorrectCount}</span>
                      <span className="text-gray-400 mx-1">/</span>
                      <span className="text-gray-600 font-medium">{item.skippedCount}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleDelete(item.id!)}
                        className="p-2 hover:bg-red-100 text-red-600 rounded transition-colors"
                        title="Delete Result"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
            <span className="text-sm text-gray-600">
              Showing {(currentPage - 1) * 10 + 1} to {Math.min(currentPage * 10, data!.total)} of {data!.total} entries
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
