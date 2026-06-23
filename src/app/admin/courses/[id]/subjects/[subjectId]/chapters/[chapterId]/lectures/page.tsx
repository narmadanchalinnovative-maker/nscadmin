'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { lectureService } from '@/lib/services/lectures';
import { chapterService } from '@/lib/services/chapters';
import { Lecture, Chapter } from '@/types';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function LecturesListPage() {
  const router = useRouter();
  const params = useParams();
  const { adminUser } = useAuth();
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);

  const courseId = params.id as string;
  const subjectId = params.subjectId as string;
  const chapterId = params.chapterId as string;

  useEffect(() => {
    async function fetchLectures() {
      try {
        setLoading(true);
        const [chapterData, lecturesData] = await Promise.all([
          chapterService.get(chapterId),
          lectureService.listByChapter(chapterId, 1, 100),
        ]);
        setChapter(chapterData as Chapter);
        setLectures(lecturesData.data);
      } catch (error) {
        console.error('Error fetching lectures:', error);
        toast.error('Failed to fetch lectures');
      } finally {
        setLoading(false);
      }
    }

    fetchLectures();
  }, [chapterId]);

  const handleDelete = async (id: string) => {
    try {
      if (!confirm('Are you sure you want to delete this lecture?')) return;
      await lectureService.delete(id);
      toast.success('Lecture deleted');
      setLectures((prev) => prev.filter((lecture) => (lecture as any).id !== id));
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete lecture');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {chapter ? `${chapter.title} - Lectures` : 'Lectures'}
          </h1>
          <p className="text-gray-600 mt-1">Manage lectures for this chapter</p>
        </div>
        <button
          onClick={() => router.push(`/admin/courses/${courseId}/subjects/${subjectId}/chapters/${chapterId}/lectures/new`)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Create Lecture</span>
        </button>
      </div>

      <div>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="bg-white p-4 rounded-lg shadow">
            {lectures.length ? (
              <ul className="space-y-3">
                {lectures.map((lecture, index) => (
                  <li key={(lecture as any).id} className="border p-4 rounded-md flex justify-between items-start">
                    <div className="flex flex-col gap-1">
                      <h3 className="font-semibold text-lg text-gray-900">{lecture.title}</h3>
                      <p className="text-sm text-gray-600">{lecture.description}</p>
                      {lecture.videoUrl && (
                        <a href={lecture.videoUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline">
                          View Video Link
                        </a>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => router.push(`/admin/courses/${courseId}/subjects/${subjectId}/chapters/${chapterId}/lectures/${(lecture as any).id}/edit`)} className="px-3 py-1 border rounded text-gray-700 hover:bg-gray-50">Edit</button>
                      <button onClick={() => handleDelete((lecture as any).id)} className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600 text-center py-8">No lectures found for this chapter.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
