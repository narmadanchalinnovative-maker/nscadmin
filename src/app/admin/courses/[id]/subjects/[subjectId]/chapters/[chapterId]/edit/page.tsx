'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { chapterService } from '@/lib/services/chapters';
import { EntityForm } from '@/components/admin/EntityForm';
import { CreateChapterFormSchema, createChapterFormSchema } from '@/schemas';
import { toast } from 'sonner';
import { Chapter } from '@/types';

export default function EditChapterPage() {
  const router = useRouter();
  const params = useParams();
  const { adminUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [chapter, setChapter] = useState<Chapter | null>(null);

  const courseId = params.id as string;
  const subjectId = params.subjectId as string;
  const chapterId = params.chapterId as string;

  useEffect(() => {
    async function fetchChapter() {
      try {
        const data = await chapterService.get(chapterId);
        if (data) {
          setChapter(data);
        } else {
          toast.error('Chapter not found');
          router.push(`/admin/courses/${courseId}/subjects/${subjectId}/chapters`);
        }
      } catch (error) {
        console.error('Error fetching chapter:', error);
        toast.error('Failed to fetch chapter details');
      }
    }
    fetchChapter();
  }, [chapterId, courseId, subjectId, router]);

  const handleSubmit = async (data: CreateChapterFormSchema) => {
    try {
      setIsSubmitting(true);
      await chapterService.update(chapterId, data, adminUser!.uid);
      toast.success('Chapter updated successfully');
      router.push(`/admin/courses/${courseId}/subjects/${subjectId}/chapters`);
    } catch (error) {
      console.error('Error updating chapter:', error);
      toast.error('Failed to update chapter');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!chapter) return <div className="p-8">Loading chapter...</div>;

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Edit Chapter</h1>
        <p className="text-gray-600 mt-1">Update chapter details</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <EntityForm<CreateChapterFormSchema>
          schema={createChapterFormSchema}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          defaultValues={chapter}
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
