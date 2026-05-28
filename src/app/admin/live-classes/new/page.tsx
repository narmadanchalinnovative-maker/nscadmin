'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { liveClassService } from '@/lib/services/liveClasses';
import { createLiveClassFormSchema } from '@/schemas';
import { EntityForm } from '@/components/admin/EntityForm';
import { toast } from 'sonner';

export default function CreateLiveClassPage() {
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
      await liveClassService.create(
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
      toast.success('Live class created successfully');
      router.push('/admin/live-classes');
    } catch (error) {
      console.error('Error creating live class:', error);
      toast.error('Failed to create live class');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <EntityForm
        schema={createLiveClassFormSchema}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        title="Create New Live Class"
        loading={loading}
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
