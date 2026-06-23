'use client';

import { useState, useEffect } from 'react';
import { listDocuments, updateDocument } from '@/lib/firestore-service';
import { useAuth } from '@/lib/auth-context';
import { Loader2, MessageCircleQuestion, CheckCircle2, Circle, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import AdminDoubtChatModal from './AdminDoubtChatModal';

interface Doubt {
  id: string;
  userId: string;
  userName: string;
  batchId: string;
  subjectName: string;
  lectureName: string;
  doubtText: string;
  status: string;
  hasUnreadAdmin?: boolean;
  createdAt: any;
}

export default function DoubtsPage() {
  const { adminUser } = useAuth();
  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoubt, setSelectedDoubt] = useState<Doubt | null>(null);

  useEffect(() => {
    fetchDoubts();
  }, []);

  const fetchDoubts = async () => {
    try {
      const response = await listDocuments<Doubt>('doubts', 1, 100, undefined, 'createdAt', 'desc');
      setDoubts(response.data);
    } catch (error) {
      console.error('Error fetching doubts:', error);
      toast.error('Failed to load doubts');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (doubtId: string, currentStatus: string) => {
    if (!adminUser?.uid) return;
    
    const newStatus = currentStatus === 'open' ? 'resolved' : 'open';
    const originalDoubts = [...doubts];
    
    // Optimistic update
    setDoubts(doubts.map(d => d.id === doubtId ? { ...d, status: newStatus } : d));
    
    try {
      await updateDocument('doubts', doubtId, { status: newStatus }, adminUser.uid);
      toast.success('Doubt status updated');
    } catch (error) {
      // Revert on error
      setDoubts(originalDoubts);
      toast.error('Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <MessageCircleQuestion className="w-8 h-8 text-blue-600" />
            Student Doubts
          </h1>
          <p className="mt-2 text-gray-600">
            View and manage doubts asked by students.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-slate-50 text-slate-600 font-medium">
              <tr>
                <th className="px-6 py-4">Student Name</th>
                <th className="px-6 py-4">Subject</th>
                <th className="px-6 py-4">Lecture</th>
                <th className="px-6 py-4 w-1/3">Doubt</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {doubts.map((doubt) => (
                <tr key={doubt.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 cursor-pointer" onClick={() => setSelectedDoubt(doubt)}>
                    {doubt.userName || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-blue-600">
                    {doubt.subjectName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-purple-600">
                    {doubt.lectureName}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-gray-700 whitespace-pre-wrap">{doubt.doubtText}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500 cursor-pointer" onClick={() => setSelectedDoubt(doubt)}>
                    {doubt.createdAt?.toDate ? new Date(doubt.createdAt.toDate()).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setSelectedDoubt(doubt)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-full transition-colors relative"
                        title="Open Chat"
                      >
                        <MessageSquare className="w-4 h-4" />
                        {doubt.hasUnreadAdmin && (
                          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white" />
                        )}
                      </button>
                      <button
                      onClick={() => toggleStatus(doubt.id, doubt.status)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        doubt.status === 'resolved'
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                      }`}
                    >
                      {doubt.status === 'resolved' ? (
                        <><CheckCircle2 className="w-3.5 h-3.5" /> Resolved</>
                      ) : (
                        <><Circle className="w-3.5 h-3.5" /> Open</>
                      )}
                    </button>
                    </div>
                  </td>
                </tr>
              ))}
              {doubts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No doubts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {selectedDoubt && (
        <AdminDoubtChatModal doubt={selectedDoubt} onClose={() => setSelectedDoubt(null)} />
      )}
    </div>
  );
}
