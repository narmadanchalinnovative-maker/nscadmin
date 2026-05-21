'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { testService } from '@/lib/services/tests';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import { Question, Test } from '@/types';

export default function EditQuestionPage() {
  const router = useRouter();
  const params = useParams();
  const { adminUser } = useAuth();
  const testId = params.id as string;
  const qid = (params as any).qid as string;
  const [currentTest, setCurrentTest] = useState<Test | null>(null);

  const { register, control, handleSubmit, reset, setValue } = useForm<any>({
    defaultValues: {
      testId: testId,
      text: '',
      options: [{ text: '' }, { text: '' }],
      correctOptionIndex: 0,
      marks: 4,
      negativeMarks: 1,
      solution: '',
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'options' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const tRes = (await testService.get(testId)) as Test | null;
        setCurrentTest(tRes);
        const qRes = tRes?.questions?.find((item: any) => item.id === qid) as Question | undefined;
        if (qRes) {
          reset({
            testId: (qRes as any).testId || testId,
            text: qRes.title,
            options: qRes.options || [{ text: '' }, { text: '' }],
            correctOptionIndex: qRes.correctOptionIndex ?? 0,
            marks: qRes.marks ?? 4,
            negativeMarks: qRes.negativeMarks ?? 1,
            solution: qRes.description || '',
          });
        } else {
          toast.error('Question not found');
          router.push(`/admin/tests/${testId}/questions`);
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to load question');
        router.push(`/admin/tests/${testId}/questions`);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [qid, testId, reset, router]);

  const onSubmit = async (data: any) => {
    if (!adminUser?.uid) return toast.error('Not authenticated');
    if (!currentTest) return toast.error('Test not loaded');
    try {
      const questions = currentTest?.questions || [];
      const nextQuestions = questions.map((item: any) =>
        item.id === qid
          ? {
              ...item,
              title: data.text,
              description: data.solution || '',
              testId: data.testId,
              options: data.options.map((o: any) => ({ text: o.text })),
              correctOptionIndex: Number(data.correctOptionIndex),
              marks: Number(data.marks) || 4,
              negativeMarks: Number(data.negativeMarks) || 1,
              text: data.text,
            }
          : item
      );
      const payload = {
        questions: nextQuestions,
      };
      await testService.update(testId, payload as Partial<Test>, adminUser.uid, currentTest);
      toast.success('Question updated');
      router.push(`/admin/tests/${testId}/questions`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update question');
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Edit Question</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-white p-6 rounded-lg shadow">
        <input type="hidden" {...register('testId')} />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Question Text</label>
          <textarea {...register('text')} rows={3} className="w-full px-4 py-2 border rounded-lg" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Options</label>
          <div className="space-y-2">
            {fields.map((field, idx) => (
              <div key={field.id} className="flex gap-2">
                <input {...register(`options.${idx}.text`)} placeholder={`Option ${idx + 1}`} className="flex-1 px-3 py-2 border rounded" />
                <label className="flex items-center gap-2">
                  <input type="radio" {...register('correctOptionIndex')} value={String(idx)} />
                  <span className="text-sm">Correct</span>
                </label>
                {fields.length > 2 && (
                  <button type="button" onClick={() => remove(idx)} className="px-2 py-1 text-sm border rounded">Remove</button>
                )}
              </div>
            ))}
          </div>
          <div className="pt-2">
            <button type="button" onClick={() => append({ text: '' })} className="px-3 py-1 border rounded">Add Option</button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Marks</label>
            <input {...register('marks')} type="number" className="w-full px-3 py-2 border rounded" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Negative Marks</label>
            <input {...register('negativeMarks')} type="number" className="w-full px-3 py-2 border rounded" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Solution / Explanation</label>
          <textarea {...register('solution')} rows={4} className="w-full px-4 py-2 border rounded-lg" />
        </div>

        <div className="flex gap-3 pt-4">
          <button type="button" onClick={() => router.back()} className="px-4 py-2 border rounded-lg">Cancel</button>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Save Question</button>
        </div>
      </form>
    </div>
  );
}
