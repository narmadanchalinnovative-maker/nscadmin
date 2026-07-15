'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { batchService } from '@/lib/services/batches';
import { createBatchFormSchema } from '@/schemas';
import { EntityForm } from '@/components/admin/EntityForm';
import { toast } from 'sonner';

export default function CreateBatchPage() {
  const router = useRouter();
  const { adminUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData: any) => {
    if (!adminUser?.uid) {
      toast.error('User not authenticated');
      return;
    }

    try {
      setLoading(true);
      await batchService.create(formData, adminUser.uid);
      toast.success('Batch created successfully');
      router.push('/admin/batches');
    } catch (error) {
      console.error('Error creating batch:', error);
      toast.error('Failed to create batch');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <EntityForm
        schema={createBatchFormSchema}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        title="Create New Batch"
        loading={loading}
        fields={[
          {
            name: 'title',
            label: 'Batch Title',
            type: 'text',
            placeholder: 'Enter batch title',
            required: true,
          },
          {
            name: 'description',
            label: 'Description',
            type: 'textarea',
            placeholder: 'Enter batch description',
            required: true,
          },
          {
            name: 'thumbnail',
            label: 'Batch Image',
            type: 'image',
            required: false,
          },
          {
            name: 'language',
            label: 'Language (e.g. Hindi / English)',
            type: 'text',
            required: false,
          },
          {
            name: 'mode',
            label: 'Mode (e.g. Live + Recorded)',
            type: 'text',
            required: false,
          },
          {
            name: 'rating',
            label: 'Rating (e.g. 4.9 Rating)',
            type: 'text',
            required: false,
          },
          {
            name: 'startDate',
            label: 'Start Date (e.g. Starts 15 May)',
            type: 'text',
            required: false,
          },
          {
            name: 'duration',
            label: 'Duration (e.g. 8 Months)',
            type: 'text',
            required: false,
          },
          {
            name: 'instructor',
            label: 'Instructor (e.g. Rajat Sir)',
            type: 'text',
            required: false,
          },
          {
            name: 'feature1Title',
            label: 'Feature 1 Title',
            type: 'text',
            required: false,
          },
          {
            name: 'feature1Desc',
            label: 'Feature 1 Description',
            type: 'textarea',
            required: false,
          },
          {
            name: 'feature2Title',
            label: 'Feature 2 Title',
            type: 'text',
            required: false,
          },
          {
            name: 'feature2Desc',
            label: 'Feature 2 Description',
            type: 'textarea',
            required: false,
          },
          {
            name: 'feature3Title',
            label: 'Feature 3 Title',
            type: 'text',
            required: false,
          },
          {
            name: 'feature3Desc',
            label: 'Feature 3 Description',
            type: 'textarea',
            required: false,
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
