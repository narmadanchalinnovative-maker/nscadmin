'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { chapterService } from '@/lib/services/chapters';
import { subjectService } from '@/lib/services/subjects';
import { Chapter, Subject } from '@/types';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function ChaptersListPage() {
  const router = useRouter();
  const params = useParams();
  const { adminUser } = useAuth();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);

  const courseId = params.id as string;
  const subjectId = params.subjectId as string;

  useEffect(() => {
    async function fetchChapters() {
      try {
        setLoading(true);
        const [subjectData, chaptersData] = await Promise.all([
          subjectService.get(subjectId),
          chapterService.list(1, 100, subjectId),
        ]);
        setSubject(subjectData as Subject);
        setChapters(chaptersData.data);
      } catch (error) {
        console.error('Error fetching chapters:', error);
        toast.error('Failed to fetch chapters');
      } finally {
        setLoading(false);
      }
    }

    fetchChapters();
  }, [subjectId]);

  const handleDelete = async (id: string) => {
    try {
      if (!confirm('Are you sure you want to delete this chapter?')) return;
      await chapterService.delete(id);
      toast.success('Chapter deleted');
      setChapters((prev) => prev.filter((chap) => (chap as any).id !== id));
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete chapter');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {subject ? `${subject.title} - Chapters` : 'Chapters'}
          </h1>
          <p className="text-gray-600 mt-1">Manage chapters for this subject</p>
        </div>
        <button
          onClick={() => router.push(`/admin/courses/${courseId}/subjects/${subjectId}/chapters/new`)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Create Chapter</span>
        </button>
      </div>

      <div>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="bg-white p-4 rounded-lg shadow">
            {chapters.length ? (
              <ul className="space-y-3">
                {chapters.map((chap, index) => (
                  <li key={(chap as any).id} className="border p-4 rounded-md flex justify-between items-center">
                    <div className="flex flex-col gap-1">
                      <h3 className="font-semibold text-lg text-gray-900">{chap.title}</h3>
                      <p className="text-sm text-gray-600">{chap.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => router.push(`/admin/courses/${courseId}/subjects/${subjectId}/chapters/${(chap as any).id}/lectures`)} className="px-3 py-1 bg-green-100 text-green-700 border border-green-200 rounded hover:bg-green-200 font-medium flex items-center gap-1">
                        Lectures →
                      </button>
                      <button onClick={() => router.push(`/admin/courses/${courseId}/subjects/${subjectId}/chapters/${(chap as any).id}/edit`)} className="px-3 py-1 border rounded text-gray-700 hover:bg-gray-50">Edit</button>
                      <button onClick={() => handleDelete((chap as any).id)} className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
               <p className="text-gray-600 text-center py-8">No chapters found for this subject.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
