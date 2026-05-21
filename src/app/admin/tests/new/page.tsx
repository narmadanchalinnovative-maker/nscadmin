'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { testService } from '@/lib/services/tests';
import { batchService } from '@/lib/services/batches';
import { createTestFormSchema, CreateTestFormSchema } from '@/schemas';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

export default function CreateTestPage() {
  const router = useRouter();
  const { adminUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [batchOptions, setBatchOptions] = useState<Array<{ label: string; value: string }>>([]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateTestFormSchema>({
    resolver: zodResolver(createTestFormSchema as any),
  });

  useEffect(() => {
    let mounted = true;
    const loadBatches = async () => {
      try {
        const res = await batchService.list(1, 100);
        if (!mounted) return;
        setBatchOptions(
          res.data.map((batch) => ({
            label: batch.title || 'Untitled',
            value: batch.id,
          }))
        );
      } catch (err) {
        console.error('Failed to load batches', err);
      }
    };

    loadBatches();
    return () => {
      mounted = false;
    };
  }, []);

  const onSubmit = async (formData: CreateTestFormSchema) => {
    if (!adminUser?.uid) {
      toast.error('User not authenticated');
      return;
    }

    try {
      setLoading(true);
      await testService.create(formData, adminUser.uid);
      toast.success('Test created successfully');
      router.push('/admin/tests');
    } catch (error) {
      console.error('Error creating test:', error);
      toast.error('Failed to create test');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Create New Test</h1>
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
          <button type="submit" disabled={isSubmitting || loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg">{isSubmitting || loading ? 'Saving...' : 'Save'}</button>
        </div>
      </form>
    </div>
  );
}
