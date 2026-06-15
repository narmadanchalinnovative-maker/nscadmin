'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { examGoalService } from '@/lib/services/examGoals';
import { ExamGoal, PaginatedResponse } from '@/types';
import { DataTable } from '@/components/admin/DataTable';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function ExamGoalsListPage() {
  const router = useRouter();
  const { adminUser } = useAuth();
  const [data, setData] = useState<PaginatedResponse<ExamGoal & { id: string }> | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchExamGoals();
  }, [currentPage]);

  async function fetchExamGoals() {
    try {
      setLoading(true);
      const result = await examGoalService.list(currentPage);
      setData(result);
    } catch (error) {
      console.error('Error fetching exam goals:', error);
      toast.error('Failed to fetch exam goals');
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await examGoalService.delete(id);
      toast.success('Exam goal deleted successfully');
      fetchExamGoals();
    } catch (error) {
      console.error('Error deleting exam goal:', error);
      toast.error('Failed to delete exam goal');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Exam Goals</h1>
          <p className="text-gray-600 mt-1">Manage all available exam goals</p>
        </div>
        <button
          onClick={() => router.push('/admin/exam-goals/new')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Create Exam Goal</span>
        </button>
      </div>

      {data && (
        <DataTable
          data={data}
          loading={loading}
          onEdit={(item) => router.push(`/admin/exam-goals/${item.id}/edit`)}
          onDelete={handleDelete}
          onPageChange={setCurrentPage}
          onToggleStatus={async (id, currentStatus) => {
            if (!adminUser?.uid) return;
            try {
              await examGoalService.toggleStatus(id, currentStatus, adminUser.uid);
              toast.success('Status updated');
              fetchExamGoals();
            } catch (error) {
              toast.error('Failed to update status');
            }
          }}
        />
      )}
    </div>
  );
}
