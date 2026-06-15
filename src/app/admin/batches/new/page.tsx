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
            name: 'price',
            label: 'Price (₹)',
            type: 'number',
            placeholder: 'Enter price (e.g. 12500)',
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
