'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { subjectService } from '@/lib/services/subjects';
import { courseService } from '@/lib/services/courses';
import { Subject, Course } from '@/types';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function SubjectsListPage() {
  const router = useRouter();
  const params = useParams();
  const { adminUser } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  const courseId = params.id as string;

  useEffect(() => {
    async function fetchSubjects() {
      try {
        setLoading(true);
        const [courseData, subjectsData] = await Promise.all([
          courseService.get(courseId),
          subjectService.listByCourse(courseId, 1, 100),
        ]);
        setCourse(courseData as Course);
        setSubjects(subjectsData.data);
      } catch (error) {
        console.error('Error fetching subjects:', error);
        toast.error('Failed to fetch subjects');
      } finally {
        setLoading(false);
      }
    }

    fetchSubjects();
  }, [courseId]);

  const handleDelete = async (id: string) => {
    try {
      if (!confirm('Are you sure you want to delete this subject?')) return;
      await subjectService.delete(id);
      toast.success('Subject deleted');
      setSubjects((prev) => prev.filter((subject) => (subject as any).id !== id));
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete subject');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {course ? `${course.title} - Subjects` : 'Subjects'}
          </h1>
          <p className="text-gray-600 mt-1">Manage subjects for this course</p>
        </div>
        <button
          onClick={() => router.push(`/admin/courses/${courseId}/subjects/new`)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Create Subject</span>
        </button>
      </div>

      <div>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="bg-white p-4 rounded-lg shadow">
            {subjects.length ? (
              <ul className="space-y-3">
                {subjects.map((subject, index) => (
                  <li key={(subject as any).id} className="border p-4 rounded-md flex justify-between items-center">
                    <div className="flex flex-col gap-1">
                      <h3 className="font-semibold text-lg text-gray-900">{subject.title}</h3>
                      <p className="text-sm text-gray-600">{subject.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => router.push(`/admin/courses/${courseId}/subjects/${(subject as any).id}/chapters`)} className="px-3 py-1 bg-green-100 text-green-700 border border-green-200 rounded hover:bg-green-200 font-medium flex items-center gap-1">
                        Chapters →
                      </button>
                      <button onClick={() => router.push(`/admin/courses/${courseId}/subjects/${(subject as any).id}/edit`)} className="px-3 py-1 border rounded text-gray-700 hover:bg-gray-50">Edit</button>
                      <button onClick={() => handleDelete((subject as any).id)} className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
               <p className="text-gray-600 text-center py-8">No subjects found for this course.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
