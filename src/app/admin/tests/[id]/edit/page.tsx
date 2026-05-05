'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { testService } from '@/lib/services/tests';
import { Test } from '@/types';
import { createTestFormSchema } from '@/schemas';
import { EntityForm } from '@/components/admin/EntityForm';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function EditTestPage() {
  const router = useRouter();
  const params = useParams();
  const { adminUser } = useAuth();
  const [test, setTest] = useState<Test & { id: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const testId = params.id as string;

  useEffect(() => {
    async function fetchTest() {
      try {
        const data = await testService.get(testId);
        if (data) {
          setTest(data);
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
  }, [testId, router]);

  const handleSubmit = async (formData: any) => {
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
    <div>
      <EntityForm
        schema={createTestFormSchema}
        defaultValues={{
          title: test.title,
          description: test.description,
          status: test.status,
        }}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        title="Edit Test"
        loading={submitting}
        fields={[
          {
            name: 'title',
            label: 'Test Title',
            type: 'text',
            placeholder: 'Enter test title',
            required: true,
          },
          {
            name: 'description',
            label: 'Description',
            type: 'textarea',
            placeholder: 'Enter test description',
            required: true,
          },
          {
            name: 'status',
            label: 'Status',
            type: 'select',
            required: true,
            options: [
              { label: 'Active', value: 'active' },
              { label: 'Inactive', value: 'inactive' },
            ],
          },
        ]}
      />
    </div>
  );
}
