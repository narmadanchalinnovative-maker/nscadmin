'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { lectureService } from '@/lib/services/lectures';
import { EntityForm } from '@/components/admin/EntityForm';
import { createLectureFormSchema } from '@/schemas';
import { toast } from 'sonner';

export default function NewLecturePage() {
  const router = useRouter();
  const params = useParams();
  const { adminUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const courseId = params.id as string;
  const subjectId = params.subjectId as string;
  const chapterId = params.chapterId as string;

  const handleSubmit = async (data: any) => {
    try {
      if (!adminUser?.uid) {
        toast.error('You must be logged in');
        return;
      }
      setLoading(true);
      
      const finalData = { ...data, videoProcessingStatus: 'ready' };
      if (finalData.videoUploadUrl) {
        finalData.videoUrl = finalData.videoUploadUrl;
        finalData.videoProcessingStatus = 'processing';
        delete finalData.videoUploadUrl;
      }

      await lectureService.create({ ...finalData, courseId, subjectId, chapterId }, adminUser.uid);
      toast.success('Lecture created successfully');
      router.push(`/admin/courses/${courseId}/subjects/${subjectId}/chapters/${chapterId}/lectures`);
    } catch (error) {
      console.error('Error creating lecture:', error);
      toast.error('Failed to create lecture');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <EntityForm
        schema={createLectureFormSchema}
        onSubmit={handleSubmit}
        onCancel={() => router.push(`/admin/courses/${courseId}/subjects/${subjectId}/chapters/${chapterId}/lectures`)}
        title="Create Lecture"
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
            name: 'thumbnailUrl',
            label: 'Lecture Thumbnail',
            type: 'image',
            storagePath: `courses/${courseId}/subjects/${subjectId}/chapters/${chapterId}/lectures/thumbnails`,
          },
          {
            name: 'videoUploadUrl',
            label: 'Upload Video File',
            type: 'video',
            storagePath: `courses/${courseId}/subjects/${subjectId}/chapters/${chapterId}/lectures/videos`,
          },
          {
            name: 'videoUrl',
            label: 'Or Video Link (YouTube, Vimeo, etc.)',
            type: 'url',
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
