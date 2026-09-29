'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { liveClassService } from '@/lib/services/liveClasses';
import { LiveClass, PaginatedResponse } from '@/types';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { joinZoom } from '@/lib/zoom';
import { toast } from 'sonner';

export default function LiveClassesListPage() {
  const router = useRouter();
  const { adminUser } = useAuth();
  const [data, setData] = useState<PaginatedResponse<LiveClass & { id: string }> | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchLiveClasses();
  }, [currentPage, searchTerm]);

  async function fetchLiveClasses() {
    try {
      setLoading(true);
      let result;
      if (searchTerm) {
        result = await liveClassService.search(searchTerm, currentPage);
      } else {
        result = await liveClassService.list(currentPage);
      }
      setData(result);
    } catch (error) {
      console.error('Error fetching live classes:', error);
      toast.error('Failed to fetch live classes');
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await liveClassService.delete(id);
      toast.success('Live class deleted');
      fetchLiveClasses();
    } catch (error) {
      console.error('Error deleting live class:', error);
      toast.error('Failed to delete live class');
    }
  };

  const handleStart = async (id: string) => {
    if (!adminUser?.uid) return toast.error('User not authenticated');
    const meetingUrl = window.prompt('Meeting URL (optional)') || '';
    try {
      await liveClassService.start(id, adminUser.uid, meetingUrl);
      toast.success('Live class started');
      fetchLiveClasses();
    } catch (error) {
      console.error('Error starting live class:', error);
      toast.error('Failed to start live class');
    }
  };

  const handleStop = async (id: string) => {
    if (!adminUser?.uid) return toast.error('User not authenticated');
    const recordingUrl = window.prompt('Recording URL (optional)') || '';
    try {
      await liveClassService.stop(id, adminUser.uid, recordingUrl);
      toast.success('Live class stopped');
      fetchLiveClasses();
    } catch (error) {
      console.error('Error stopping live class:', error);
      toast.error('Failed to stop live class');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Live Classes</h1>
          <p className="text-gray-600 mt-1">Manage and start live classes</p>
        </div>
        <button
          onClick={() => router.push('/admin/live-classes/new')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Create Live Class</span>
        </button>
      </div>

      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search live classes..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      <div>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full"></div>
            </div>
          </div>
        ) : data && data.data.length > 0 ? (
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Title</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Description</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Live</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Created By</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.data.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.title}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 line-clamp-2">
                      {item.description}
                    </td>
                    <td className="px-6 py-4">{item.status}</td>
                    <td className="px-6 py-4">{item.isLive ? 'Yes' : 'No'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.createdBy || '-'}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => router.push(`/admin/live-classes/${item.id}/edit`)}
                          className="p-2 hover:bg-blue-100 text-blue-600 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => router.push(`/admin/live-classes/${item.id}/studio`)}
                          className={`px-3 py-1 rounded text-sm font-medium ${item.isLive ? 'bg-red-600 text-white animate-pulse' : 'bg-green-600 text-white'}`}
                        >
                          {item.isLive ? 'Live Studio' : 'Start Studio'}
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 hover:bg-red-100 text-red-600 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="bg-white px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Page {data.page} of {data.totalPages} ({data.total} total items)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(data.page - 1)}
                  disabled={data.page === 1}
                  className="p-2 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Prev
                </button>
                <button
                  onClick={() => setCurrentPage(data.page + 1)}
                  disabled={data.page === data.totalPages}
                  className="p-2 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600">No live classes found</p>
          </div>
        )}
      </div>
    </div>
  );
}
