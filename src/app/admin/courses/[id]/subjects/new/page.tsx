'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { subjectService } from '@/lib/services/subjects';
import { EntityForm } from '@/components/admin/EntityForm';
import { createSubjectFormSchema } from '@/schemas';
import { toast } from 'sonner';

export default function NewSubjectPage() {
  const router = useRouter();
  const params = useParams();
  const { adminUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const courseId = params.id as string;

  const handleSubmit = async (data: any) => {
    try {
      if (!adminUser?.uid) {
        toast.error('You must be logged in');
        return;
      }
      setLoading(true);
      await subjectService.create({ ...data, courseId }, adminUser.uid);
      toast.success('Subject created successfully');
      router.push(`/admin/courses/${courseId}/subjects`);
    } catch (error) {
      console.error('Error creating subject:', error);
      toast.error('Failed to create subject');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <EntityForm
        schema={createSubjectFormSchema}
        onSubmit={handleSubmit}
        onCancel={() => router.push(`/admin/courses/${courseId}/subjects`)}
        title="Create Subject"
        fields={[
          {
            name: 'title',
            label: 'Title',
            type: 'text',
            required: true,
          },
          {
            name: 'description',
            label: 'Description',
            type: 'textarea',
            required: true,
          },
          {
            name: 'status',
            label: 'Status',
            type: 'select',
            options: [
              { label: 'Active', value: 'active' },
              { label: 'Inactive', value: 'inactive' },
            ],
          },
        ]}
        loading={loading}
      />
    </div>
  );
}
