'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { subjectService } from '@/lib/services/subjects';
import { EntityForm } from '@/components/admin/EntityForm';
import { createSubjectFormSchema } from '@/schemas';
import { toast } from 'sonner';

export default function EditSubjectPage() {
  const router = useRouter();
  const params = useParams();
  const { adminUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState<any>(null);

  const courseId = params.id as string;
  const subjectId = params.subjectId as string;

  useEffect(() => {
    async function fetchSubject() {
      try {
        const data = await subjectService.get(subjectId);
        if (data) {
          setInitialData(data);
        } else {
          toast.error('Subject not found');
          router.push(`/admin/courses/${courseId}/subjects`);
        }
      } catch (error) {
        console.error('Error fetching subject:', error);
        toast.error('Failed to fetch subject');
      }
    }
    fetchSubject();
  }, [subjectId, courseId, router]);

  const handleSubmit = async (data: any) => {
    try {
      if (!adminUser?.uid) {
        toast.error('You must be logged in');
        return;
      }
      setLoading(true);
      await subjectService.update(subjectId, data, adminUser.uid);
      toast.success('Subject updated successfully');
      router.push(`/admin/courses/${courseId}/subjects`);
    } catch (error) {
      console.error('Error updating subject:', error);
      toast.error('Failed to update subject');
    } finally {
      setLoading(false);
    }
  };

  if (!initialData) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <EntityForm
        schema={createSubjectFormSchema}
        onSubmit={handleSubmit}
        onCancel={() => router.push(`/admin/courses/${courseId}/subjects`)}
        title="Edit Subject"
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
        defaultValues={initialData}
        loading={loading}
      />
    </div>
  );
}
