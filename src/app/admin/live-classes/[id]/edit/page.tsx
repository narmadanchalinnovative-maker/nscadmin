'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { liveClassService } from '@/lib/services/liveClasses';
import { LiveClass } from '@/types';
import { createLiveClassFormSchema } from '@/schemas';
import { EntityForm } from '@/components/admin/EntityForm';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { uploadLiveClassAsset } from '@/lib/storage';

export default function EditLiveClassPage() {
  const router = useRouter();
  const params = useParams();
  const { adminUser } = useAuth();
  const [liveClass, setLiveClass] = useState<LiveClass & { id: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const liveClassId = params.id as string;

  useEffect(() => {
    async function fetchLiveClass() {
      try {
        const data = await liveClassService.get(liveClassId);
        if (data) {
          setLiveClass(data);
        } else {
          toast.error('Live class not found');
          router.push('/admin/live-classes');
        }
      } catch (error) {
        console.error('Error fetching live class:', error);
        toast.error('Failed to fetch live class');
        router.push('/admin/live-classes');
      } finally {
        setLoading(false);
      }
    }

    fetchLiveClass();
  }, [liveClassId, router]);

  const handleSubmit = async (formData: any) => {
    if (!adminUser?.uid || !liveClass) {
      toast.error('User not authenticated');
      return;
    }

    try {
      setSubmitting(true);
      await liveClassService.update(
        liveClass.id,
        {
          title: formData.title,
          description: formData.description,
          startTime: formData.startTime ? new Date(formData.startTime) : undefined,
          duration: formData.duration || undefined,
          meetingUrl: formData.meetingUrl || '',
          instructor: formData.instructor || '',
          courseId: formData.courseId || '',
          batchId: formData.batchId || '',
          status: formData.status,
        },
        adminUser.uid
      );
      toast.success('Live class updated successfully');
      router.push('/admin/live-classes');
    } catch (error) {
      console.error('Error updating live class:', error);
      toast.error('Failed to update live class');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          <p className="text-gray-600">Loading live class...</p>
        </div>
      </div>
    );
  }

  if (!liveClass) return null;

  return (
    <div>
      <div className="mb-4 p-4 border rounded-lg bg-white">
        <h3 className="font-semibold mb-2">Upload Video / Thumbnail</h3>
        <p className="text-sm text-gray-600 mb-2">Upload video files to Firebase Storage and save the stream URL to this live class.</p>
        <div className="flex items-center gap-3">
          <input
            id="file-upload"
            type="file"
            accept="video/*,image/*"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              if (!adminUser?.uid) {
                toast.error('Not authenticated');
                return;
              }
              try {
                toast.promise(
                  (async () => {
                    const { url } = await uploadLiveClassAsset(f, liveClass.id);
                    await liveClassService.update(liveClass.id, { streamUrl: url }, adminUser.uid);
                    setLiveClass({ ...liveClass, streamUrl: url });
                  })(),
                  {
                    loading: 'Uploading...',
                    success: 'Upload complete',
                    error: 'Upload failed',
                  }
                );
              } catch (err) {
                console.error('Upload error', err);
                toast.error('Upload failed');
              }
            }}
            className=""
          />
        </div>
        {liveClass.streamUrl ? (
          <p className="mt-2 text-sm text-green-600">Current stream URL saved.</p>
        ) : (
          <p className="mt-2 text-sm text-red-600">No stream URL set for this live class.</p>
        )}
      </div>
      <EntityForm
        schema={createLiveClassFormSchema}
        defaultValues={{
          title: liveClass.title,
          description: liveClass.description,
          startTime: liveClass.startTime ? new Date(liveClass.startTime).toISOString().slice(0,16) : '',
          duration: liveClass.duration,
          meetingUrl: liveClass.meetingUrl,
          instructor: liveClass.instructor,
          courseId: liveClass.courseId,
          batchId: liveClass.batchId,
          status: liveClass.status,
        }}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        title="Edit Live Class"
        loading={submitting}
        fields={[
          { name: 'title', label: 'Title', type: 'text', required: true },
          { name: 'description', label: 'Description', type: 'textarea', required: true },
          { name: 'startTime', label: 'Start Time (YYYY-MM-DDTHH:MM)', type: 'text', required: false },
          { name: 'duration', label: 'Duration (minutes)', type: 'number', required: false },
          { name: 'meetingUrl', label: 'Meeting URL', type: 'url', required: false },
          { name: 'instructor', label: 'Instructor', type: 'text', required: false },
          { name: 'courseId', label: 'Course ID', type: 'text', required: false },
          { name: 'batchId', label: 'Batch ID', type: 'text', required: false },
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
