'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { courseService } from '@/lib/services/courses';
import { batchService } from '@/lib/services/batches';
import { createCourseFormSchema } from '@/schemas';
import { EntityForm } from '@/components/admin/EntityForm';
import { toast } from 'sonner';

export default function CreateCoursePage() {
  const router = useRouter();
  const { adminUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [batchOptions, setBatchOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [batches, setBatches] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    const loadBatches = async () => {
      try {
        const res = await batchService.list(1, 100);
        if (!mounted) return;
        setBatches(res.data);
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

  const handleSubmit = async (formData: any) => {
    if (!adminUser?.uid) {
      toast.error('User not authenticated');
      return;
    }

    try {
      setLoading(true);
      
      // Auto-assign price from the selected batch
      const selectedBatch = batches.find(b => b.id === formData.batchId);
      const finalData = { 
        ...formData, 
        price: selectedBatch?.price || 0 
      };

      await courseService.create(finalData, adminUser.uid);
      toast.success('Course created successfully');
      router.push('/admin/courses');
    } catch (error) {
      console.error('Error creating course:', error);
      toast.error('Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <EntityForm
        schema={createCourseFormSchema}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        title="Create New Course"
        loading={loading}
        fields={[
          {
            name: 'title',
            label: 'Course Title',
            type: 'text',
            placeholder: 'Enter course title',
            required: true,
          },
          {
            name: 'batchId',
            label: 'Batch',
            type: 'select',
            required: true,
            options: batchOptions,
          },
          {
            name: 'description',
            label: 'Description',
            type: 'textarea',
            placeholder: 'Enter course description',
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
