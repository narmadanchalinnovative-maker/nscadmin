'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { batchService } from '@/lib/services/batches';
import { Batch, PaginatedResponse } from '@/types';
import { DataTable } from '@/components/admin/DataTable';
import { Plus, Search } from 'lucide-react';
import { toast } from 'sonner';

export default function BatchesListPage() {
  const router = useRouter();
  const { adminUser } = useAuth();
  const [data, setData] = useState<PaginatedResponse<Batch & { id: string }> | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchBatches();
  }, [currentPage, searchTerm]);

  async function fetchBatches() {
    try {
      setLoading(true);
      let result;
      if (searchTerm) {
        result = await batchService.search(searchTerm, currentPage);
      } else {
        result = await batchService.list(currentPage);
      }
      setData(result);
    } catch (error) {
      console.error('Error fetching batches:', error);
      toast.error('Failed to fetch batches');
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await batchService.delete(id);
      toast.success('Batch deleted successfully');
      fetchBatches();
    } catch (error) {
      console.error('Error deleting batch:', error);
      toast.error('Failed to delete batch');
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: 'active' | 'inactive') => {
    try {
      if (!adminUser?.uid) return;
      await batchService.toggleStatus(id, currentStatus, adminUser.uid);
      toast.success('Status updated successfully');
      fetchBatches();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Batches</h1>
          <p className="text-gray-600 mt-1">Manage all batches</p>
        </div>
        <button
          onClick={() => router.push('/admin/batches/new')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Create Batch</span>
        </button>
      </div>

      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search batches..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      {data && (
        <DataTable
          data={data}
          loading={loading}
          onEdit={(item) => router.push(`/admin/batches/${item.id}/edit`)}
          onDelete={handleDelete}
          onToggleStatus={handleToggleStatus}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}
