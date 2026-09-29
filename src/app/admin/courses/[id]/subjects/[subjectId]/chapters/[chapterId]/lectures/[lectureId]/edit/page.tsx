'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { lectureService } from '@/lib/services/lectures';
import { EntityForm } from '@/components/admin/EntityForm';
import { createLectureFormSchema } from '@/schemas';
import { toast } from 'sonner';

export default function EditLecturePage() {
  const router = useRouter();
  const params = useParams();
  const { adminUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState<any>(null);

  const courseId = params.id as string;
  const subjectId = params.subjectId as string;
  const chapterId = params.chapterId as string;
  const lectureId = params.lectureId as string;

  useEffect(() => {
    async function fetchLecture() {
      try {
        const data = await lectureService.get(lectureId);
        if (data) {
          setInitialData(data);
        } else {
          toast.error('Lecture not found');
          router.push(`/admin/courses/${courseId}/subjects/${subjectId}/chapters/${chapterId}/lectures`);
        }
      } catch (error) {
        console.error('Error fetching lecture:', error);
        toast.error('Failed to fetch lecture');
      }
    }
    fetchLecture();
  }, [lectureId, chapterId, subjectId, courseId, router]);

  const handleSubmit = async (data: any) => {
    try {
      if (!adminUser?.uid) {
        toast.error('You must be logged in');
        return;
      }
      setLoading(true);

      const finalData = { ...data };
      const rawVideoKey = finalData.videoUploadUrl;

      if (rawVideoKey) {
        finalData.videoProcessingStatus = 'QUEUED';
        finalData.videoUrl = ''; // Backend will update this to the HLS URL when done
        finalData.videoPath = rawVideoKey; // Pass this to trigger the transcode worker automatically
        delete finalData.videoUploadUrl;
      }

      await lectureService.update(lectureId, finalData, adminUser.uid);

      toast.success('Lecture updated successfully');

      router.push(`/admin/courses/${courseId}/subjects/${subjectId}/chapters/${chapterId}/lectures`);
    } catch (error) {
      console.error('Error updating lecture:', error);
      toast.error('Failed to update lecture');
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
        schema={createLectureFormSchema}
        onSubmit={handleSubmit}
        onCancel={() => router.push(`/admin/courses/${courseId}/subjects/${subjectId}/chapters/${chapterId}/lectures`)}
        title="Edit Lecture"
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
            label: 'Upload Video File (Overrides Link)',
            type: 'video',
            storagePath: `courses/${courseId}/subjects/${subjectId}/chapters/${chapterId}/lectures/videos`,
          },
          {
            name: 'videoUrl',
            label: 'Or Video Link (YouTube, Vimeo, etc.)',
            type: 'url',
          },
          {
            name: 'pdfUrl',
            label: 'Notes PDF (Optional)',
            type: 'pdf',
            storagePath: `courses/${courseId}/subjects/${subjectId}/chapters/${chapterId}/lectures/notes`,
            required: false,
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
