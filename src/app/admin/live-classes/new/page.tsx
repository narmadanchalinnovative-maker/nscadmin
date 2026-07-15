'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { liveClassService } from '@/lib/services/liveClasses';
import { courseService } from '@/lib/services/courses';
import { batchService } from '@/lib/services/batches';
import { Course, Batch } from '@/types';
import { createLiveClassFormSchema } from '@/schemas';
import { EntityForm } from '@/components/admin/EntityForm';
import { toast } from 'sonner';
function extractZoomDetails(url: string) {
  if (!url || typeof url !== 'string') return { zoomMeetingId: '', zoomPassword: '' };
  let meetingIdMatch = url.match(/(?:\/j\/|\/w\/|\/wc\/|\/meeting\/register\/|\/join\?confno=)(\d+)/i);
  let meetingId = meetingIdMatch ? meetingIdMatch[1] : '';
  let pwdMatch = url.match(/[?&]pwd=([^&#]+)/i);
  let password = pwdMatch ? pwdMatch[1] : '';
  if (!meetingId && /^\d+$/.test(url.trim())) {
    meetingId = url.trim();
  }
  return { zoomMeetingId: meetingId, zoomPassword: password };
}

export default function CreateLiveClassPage() {
  const router = useRouter();
  const { adminUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [coursesRes, batchesRes] = await Promise.allSettled([
          courseService.list(1, 100),
          batchService.list(1, 100),
        ]);
        
        if (coursesRes.status === 'fulfilled') {
          setCourses(coursesRes.value.data || []);
        } else {
          console.error('Failed to fetch courses:', coursesRes.reason);
          toast.error('Failed to load courses');
        }

        if (batchesRes.status === 'fulfilled') {
          setBatches(batchesRes.value.data || []);
        } else {
          console.error('Failed to fetch batches:', batchesRes.reason);
          toast.error('Failed to load batches');
        }
      } catch (error) {
        console.error('Unexpected error fetching courses/batches:', error);
      }
    }
    fetchData();
  }, []);

  const handleSubmit = async (formData: any) => {
    if (!adminUser?.uid) {
      toast.error('User not authenticated');
      return;
    }

    try {
      setLoading(true);
      const { zoomMeetingId, zoomPassword } = extractZoomDetails(formData.meetingUrl || '');

      await liveClassService.create(
        {
          title: formData.title,
          description: formData.description,
          startTime: formData.startTime ? new Date(formData.startTime) : undefined,
          duration: formData.duration || undefined,
          meetingUrl: formData.meetingUrl || '',
          zoomMeetingId,
          zoomPassword,
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
          { name: 'startTime', label: 'Start Time', type: 'datetime-local', required: false },
          { name: 'duration', label: 'Duration (minutes)', type: 'number', required: false },
          { name: 'meetingUrl', label: 'Meeting URL', type: 'url', required: false },
          { name: 'instructor', label: 'Instructor', type: 'text', required: false },
          { 
            name: 'courseId', 
            label: 'Course', 
            type: 'select', 
            required: false,
            options: courses?.map(c => ({ label: c.title || 'Untitled', value: c.id! })) || []
          },
          { 
            name: 'batchId', 
            label: 'Batch', 
            type: 'select', 
            required: false,
            options: batches?.map(b => ({ label: b.title || 'Untitled', value: b.id! })) || []
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
