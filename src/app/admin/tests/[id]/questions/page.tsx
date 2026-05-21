'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { testService } from '@/lib/services/tests';
import { Question, Test } from '@/types';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function QuestionsListPage() {
  const router = useRouter();
  const params = useParams();
  const { adminUser } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  const testId = params.id as string;

  useEffect(() => {
    async function fetchQuestions() {
      try {
        setLoading(true);
        const test = (await testService.get(testId)) as Test | null;
        setQuestions(test?.questions || []);
      } catch (error) {
        console.error('Error fetching questions:', error);
        toast.error('Failed to fetch questions');
      } finally {
        setLoading(false);
      }
    }

    fetchQuestions();
  }, [testId]);

  const handleDelete = async (id: string) => {
    try {
      const test = (await testService.get(testId)) as Test | null;
      const updatedQuestions = (test?.questions || []).filter((question: any) => question.id !== id);
      await testService.update(testId, { questions: updatedQuestions } as Partial<Test>, adminUser!.uid);
      toast.success('Question deleted');
      setQuestions(updatedQuestions);
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete question');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Questions</h1>
          <p className="text-gray-600 mt-1">Manage questions for this test</p>
        </div>
        <button
          onClick={() => router.push(`/admin/tests/${testId}/questions/new`)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Create Question</span>
        </button>
      </div>

      <div>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="bg-white p-4 rounded-lg shadow">
            {questions.length ? (
              <ul className="space-y-3">
                {questions.map((q, index) => (
                  <li key={(q as any).id || index} className="border p-3 rounded-md flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{q.title}</h3>
                      <p className="text-sm text-gray-600">Question #{index + 1}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => router.push(`/admin/tests/${testId}/questions/${(q as any).id || index}/edit`)} className="px-3 py-1 border rounded">Edit</button>
                      <button onClick={() => handleDelete((q as any).id || String(index))} className="px-3 py-1 bg-red-600 text-white rounded">Delete</button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600">No questions found for this test.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
