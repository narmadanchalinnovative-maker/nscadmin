'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { testService } from '@/lib/services/tests';
import { questionService } from '@/lib/services/questions';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import { Question, Test } from '@/types';

type OptionInput = { text: string };

type QuestionFormData = {
  text: string;
  options: OptionInput[];
  correctOptionIndex: number;
  marks: number;
  negativeMarks: number;
  solution: string;
};

type BulkQuestion = {
  text: string;
  options: OptionInput[];
  correctOptionIndex?: number;
  marks?: number;
  negativeMarks?: number;
  solution?: string;
};

export default function NewQuestionPage() {
  const router = useRouter();
  const params = useParams();
  const { adminUser } = useAuth();
  const testId = params.id as string;
  const [currentTest, setCurrentTest] = useState<Test | null>(null);
  const [loadingTest, setLoadingTest] = useState(true);
  const [creationMode, setCreationMode] = useState<'single' | 'bulk'>('single');

  // Single question form
  const { register, control, handleSubmit: handleSingleSubmit, setValue } = useForm<QuestionFormData>({
    defaultValues: {
      text: '',
      options: [{ text: '' }, { text: '' }],
      correctOptionIndex: 0,
      marks: 4,
      negativeMarks: 1,
      solution: '',
    },
  });

  // Bulk questions form
  const {
    register: registerBulk,
    control: controlBulk,
    handleSubmit: handleBulkSubmit,
    watch: watchBulk,
  } = useForm<{ questions: BulkQuestion[] }>({
    defaultValues: {
      questions: [
        {
          text: '',
          options: [{ text: '' }, { text: '' }],
          marks: 4,
          negativeMarks: 1,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'options' });
  const { fields: bulkFields, append: appendBulk, remove: removeBulk } = useFieldArray({
    control: controlBulk,
    name: 'questions',
  });

  const bulkQuestions = watchBulk('questions');

  useEffect(() => {
    async function loadTest() {
      try {
        const test = await testService.get(testId);
        setCurrentTest(test);
        if (!test) {
          toast.error('Test not found');
        }
      } catch (error) {
        console.error('Failed to load test', error);
        toast.error('Failed to load test');
      } finally {
        setLoadingTest(false);
      }
    }

    setValue('text', '');
    loadTest();
  }, [testId, setValue]);

  const onSingleSubmit = async (data: QuestionFormData) => {
    if (!adminUser?.uid) return toast.error('Not authenticated');
    if (!testId) {
      toast.error('Invalid test');
      return;
    }
    if (!currentTest) {
      toast.error('Test not loaded');
      return;
    }

    try {
      const existingQuestions = (currentTest.questions || []) as Question[];
      const payload: Question = {
        id: globalThis.crypto?.randomUUID?.() || String(Date.now()),
        title: data.text,
        description: data.solution || '',
        testId: testId,
        options: data.options.map((o: OptionInput) => ({ text: o.text })),
        correctOptionIndex: Number(data.correctOptionIndex),
        marks: Number(data.marks) || 4,
        negativeMarks: Number(data.negativeMarks) || 1,
        solution: data.solution,
        status: 'active',
        text: data.text,
      } as Question;
      await testService.update(
        testId,
        {
          questions: [...existingQuestions, payload],
        } as Partial<Test>,
        adminUser.uid,
        currentTest
      );
      toast.success('Question created');
      router.push(`/admin/tests/${testId}/questions`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to create question');
    }
  };

  const onBulkSubmit = async (data: { questions: BulkQuestion[] }) => {
    if (!adminUser?.uid) return toast.error('Not authenticated');
    if (!testId) {
      toast.error('Invalid test');
      return;
    }
    if (!currentTest) {
      toast.error('Test not loaded');
      return;
    }

    try {
      let createdCount = 0;
      const existingQuestions = (currentTest.questions || []) as Question[];

      for (const q of data.questions) {
        if (!q.text.trim()) {
          toast.error('Question text cannot be empty');
          continue;
        }

        const payload: Question = {
          id: globalThis.crypto?.randomUUID?.() || String(Date.now()),
          title: q.text,
          description: q.solution || '',
          testId: testId,
          options: q.options.map((o: OptionInput) => ({ text: o.text })),
          correctOptionIndex: q.correctOptionIndex ?? 0,
          marks: Number(q.marks) || 4,
          negativeMarks: Number(q.negativeMarks) || 1,
          solution: q.solution || '',
          status: 'active',
          text: q.text,
        } as Question;

        existingQuestions.push(payload);
        createdCount++;
      }

      await testService.update(
        testId,
        {
          questions: existingQuestions,
        } as Partial<Test>,
        adminUser.uid,
        currentTest
      );

      toast.success(`${createdCount} questions created successfully`);
      router.push(`/admin/tests/${testId}/questions`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to create questions');
    }
  };

  if (loadingTest) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <p className="text-sm text-gray-500">Loading test...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2">Add Questions</h1>
      <p className="text-gray-600 mb-6">Add single or multiple questions to this test</p>

      {/* Mode Selection */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">Creation Mode</h2>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={creationMode === 'single'}
              onChange={() => setCreationMode('single')}
              className="w-4 h-4"
            />
            <span className="text-gray-700">Add Single Question</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={creationMode === 'bulk'}
              onChange={() => setCreationMode('bulk')}
              className="w-4 h-4"
            />
            <span className="text-gray-700">Add Multiple Questions (Bulk)</span>
          </label>
        </div>
      </div>

      {/* Single Question Form */}
      {creationMode === 'single' && (
        <form onSubmit={handleSingleSubmit(onSingleSubmit)} className="space-y-4 bg-white p-6 rounded-lg shadow">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Question Text <span className="text-red-500">*</span>
            </label>
            <textarea
              {...register('text')}
              rows={3}
              placeholder="Enter question text"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Options <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {fields.map((field, idx) => (
                <div key={field.id} className="flex gap-2 items-center">
                  <input
                    {...register(`options.${idx}.text`)}
                    placeholder={`Option ${idx + 1}`}
                    className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <label className="flex items-center gap-2 whitespace-nowrap">
                    <input type="radio" {...register('correctOptionIndex')} value={String(idx)} />
                    <span className="text-sm">Correct</span>
                  </label>
                  {fields.length > 2 && (
                    <button
                      type="button"
                      onClick={() => remove(idx)}
                      className="px-3 py-1 text-sm text-red-600 border border-red-600 rounded hover:bg-red-50"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => append({ text: '' })}
                className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50"
              >
                + Add Option
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Marks</label>
              <input {...register('marks', { valueAsNumber: true })} type="number" defaultValue={4} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Negative Marks</label>
              <input {...register('negativeMarks', { valueAsNumber: true })} type="number" defaultValue={1} className="w-full px-3 py-2 border rounded-lg" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Solution / Explanation (Optional)</label>
            <textarea {...register('solution')} rows={4} placeholder="Enter solution details" className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => router.back()} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Save Question
            </button>
          </div>
        </form>
      )}

      {/* Bulk Questions Form */}
      {creationMode === 'bulk' && (
        <form onSubmit={handleBulkSubmit(onBulkSubmit)} className="space-y-4">
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Bulk Add Questions</h2>
              <button
                type="button"
                onClick={() =>
                  appendBulk({
                    text: '',
                    options: [{ text: '' }, { text: '' }],
                    marks: 4,
                    negativeMarks: 1,
                  })
                }
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                + Add Question
              </button>
            </div>

            <div className="space-y-6">
              {bulkFields.map((field, qIdx) => (
                <div key={field.id} className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-gray-700">Question {qIdx + 1}</h3>
                    {bulkFields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeBulk(qIdx)}
                        className="text-red-600 hover:text-red-800 font-medium"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Question Text <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        {...registerBulk(`questions.${qIdx}.text`)}
                        placeholder="Enter question text"
                        rows={2}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Options <span className="text-red-500">*</span>
                      </label>
                      <div className="space-y-2">
                        {[0, 1, 2, 3].map((optIdx) => (
                          <input
                            key={optIdx}
                            {...registerBulk(`questions.${qIdx}.options.${optIdx}.text`)}
                            placeholder={`Option ${optIdx + 1}`}
                            className="w-full px-3 py-2 border rounded-lg text-sm"
                          />
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Correct Option (0-3)</label>
                        <input
                          {...registerBulk(`questions.${qIdx}.correctOptionIndex`, { valueAsNumber: true })}
                          type="number"
                          min="0"
                          max="3"
                          defaultValue={0}
                          className="w-full px-2 py-2 border rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Marks</label>
                        <input
                          {...registerBulk(`questions.${qIdx}.marks`, { valueAsNumber: true })}
                          type="number"
                          defaultValue={4}
                          className="w-full px-2 py-2 border rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Neg. Marks</label>
                        <input
                          {...registerBulk(`questions.${qIdx}.negativeMarks`, { valueAsNumber: true })}
                          type="number"
                          defaultValue={1}
                          className="w-full px-2 py-2 border rounded text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Solution (Optional)</label>
                      <textarea
                        {...registerBulk(`questions.${qIdx}.solution`)}
                        placeholder="Enter solution"
                        rows={2}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => router.back()} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Save {bulkQuestions?.length || 1} Questions
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
