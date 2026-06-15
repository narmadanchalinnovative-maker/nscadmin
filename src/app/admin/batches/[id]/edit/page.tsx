'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { batchService } from '@/lib/services/batches';
import { Batch } from '@/types';
import { createBatchFormSchema } from '@/schemas';
import { EntityForm } from '@/components/admin/EntityForm';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function EditBatchPage() {
  const router = useRouter();
  const params = useParams();
  const { adminUser } = useAuth();
  const [batch, setBatch] = useState<Batch & { id: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const batchId = params.id as string;

  useEffect(() => {
    async function fetchBatch() {
      try {
        const data = await batchService.get(batchId);
        if (data) {
          setBatch(data);
        } else {
          toast.error('Batch not found');
          router.push('/admin/batches');
        }
      } catch (error) {
        console.error('Error fetching batch:', error);
        toast.error('Failed to fetch batch');
        router.push('/admin/batches');
      } finally {
        setLoading(false);
      }
    }

    fetchBatch();
  }, [batchId, router]);

  const handleSubmit = async (formData: any) => {
    if (!adminUser?.uid || !batch) {
      toast.error('User not authenticated');
      return;
    }

    try {
      setSubmitting(true);
      await batchService.update(batch.id, formData, adminUser.uid);
      toast.success('Batch updated successfully');
      router.push('/admin/batches');
    } catch (error) {
      console.error('Error updating batch:', error);
      toast.error('Failed to update batch');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          <p className="text-gray-600">Loading batch...</p>
        </div>
      </div>
    );
  }

  if (!batch) {
    return null;
  }

  return (
    <div>
      <EntityForm
        schema={createBatchFormSchema}
        defaultValues={{
          title: batch.title,
          description: batch.description,
          price: batch.price ?? 0,
          status: batch.status,
        }}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        title="Edit Batch"
        loading={submitting}
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
