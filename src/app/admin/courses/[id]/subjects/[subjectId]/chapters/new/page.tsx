'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { chapterService } from '@/lib/services/chapters';
import { EntityForm } from '@/components/admin/EntityForm';
import { CreateChapterFormSchema, createChapterFormSchema } from '@/schemas';
import { toast } from 'sonner';

export default function NewChapterPage() {
  const router = useRouter();
  const params = useParams();
  const { adminUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const courseId = params.id as string;
  const subjectId = params.subjectId as string;

  const handleSubmit = async (data: CreateChapterFormSchema) => {
    try {
      setIsSubmitting(true);
      await chapterService.create(
        {
          ...data,
          courseId,
          subjectId,
        },
        adminUser!.uid
      );
      toast.success('Chapter created successfully');
      router.push(`/admin/courses/${courseId}/subjects/${subjectId}/chapters`);
    } catch (error) {
      console.error('Error creating chapter:', error);
      toast.error('Failed to create chapter');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Create Chapter</h1>
        <p className="text-gray-600 mt-1">Add a new chapter to this subject</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <EntityForm
          schema={createChapterFormSchema}
          onSubmit={handleSubmit}
          loading={isSubmitting}
          title="Create Chapter"
          onCancel={() => router.push(`/admin/courses/${courseId}/subjects/${subjectId}/chapters`)}
          fields={[
            {
              name: 'title',
              label: 'Title',
              type: 'text',
              placeholder: 'Enter chapter title',
            },
            {
              name: 'description',
              label: 'Description',
              type: 'textarea',
              placeholder: 'Enter chapter description',
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
        />
      </div>
    </div>
  );
}
