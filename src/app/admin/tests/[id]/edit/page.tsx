'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { testService } from '@/lib/services/tests';
import { batchService } from '@/lib/services/batches';
import { Test } from '@/types';
import { createTestFormSchema, CreateTestFormSchema } from '@/schemas';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function EditTestPage() {
  const router = useRouter();
  const params = useParams();
  const { adminUser } = useAuth();
  const [test, setTest] = useState<Test & { id: string } | null>(null);
  const [batchOptions, setBatchOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const testId = params.id as string;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateTestFormSchema>({
    resolver: zodResolver(createTestFormSchema as any),
  });

  useEffect(() => {
    async function fetchTest() {
      try {
        const [data, batches] = await Promise.all([
          testService.get(testId),
          batchService.list(1, 100),
        ]);
        setBatchOptions(
          batches.data.map((batch) => ({
            label: batch.title || 'Untitled',
            value: batch.id,
          }))
        );
        if (data) {
          setTest(data);
          reset({
            title: data.title,
            batchId: data.batchId,
            description: data.description,
            status: data.status,
          });
        } else {
          toast.error('Test not found');
          router.push('/admin/tests');
        }
      } catch (error) {
        console.error('Error fetching test:', error);
        toast.error('Failed to fetch test');
        router.push('/admin/tests');
      } finally {
        setLoading(false);
      }
    }

    fetchTest();
  }, [testId, router, reset]);

  const onSubmit = async (formData: CreateTestFormSchema) => {
    if (!adminUser?.uid || !test) {
      toast.error('User not authenticated');
      return;
    }

    try {
      setSubmitting(true);
      await testService.update(test.id, formData, adminUser.uid);
      toast.success('Test updated successfully');
      router.push('/admin/tests');
    } catch (error) {
      console.error('Error updating test:', error);
      toast.error('Failed to update test');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          <p className="text-gray-600">Loading test...</p>
        </div>
      </div>
    );
  }

  if (!test) {
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Edit Test</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-white p-6 rounded-lg shadow">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Test Title <span className="text-red-500">*</span></label>
          <input {...register('title')} placeholder="Enter test title" className="w-full px-4 py-2 border rounded-lg" />
          {errors.title && <p className="mt-1 text-sm text-red-600">{String(errors.title?.message)}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Batch <span className="text-red-500">*</span></label>
          <select {...register('batchId')} className="w-full px-4 py-2 border rounded-lg">
            <option value="">Select Batch</option>
            {batchOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {errors.batchId && <p className="mt-1 text-sm text-red-600">{String(errors.batchId?.message)}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
          <textarea {...register('description')} placeholder="Enter test description" rows={4} className="w-full px-4 py-2 border rounded-lg" />
          {errors.description && <p className="mt-1 text-sm text-red-600">{String(errors.description?.message)}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status <span className="text-red-500">*</span></label>
          <select {...register('status')} className="w-full px-4 py-2 border rounded-lg">
            <option value="">Select Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          {errors.status && <p className="mt-1 text-sm text-red-600">{String(errors.status?.message)}</p>}
        </div>

        <div className="flex gap-3 pt-4">
          <button type="button" onClick={() => router.back()} className="px-4 py-2 border rounded-lg">Cancel</button>
          <button type="submit" disabled={isSubmitting || submitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg">{isSubmitting || submitting ? 'Saving...' : 'Save'}</button>
        </div>
      </form>
    </div>
  );
}
