'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { liveClassService } from '@/lib/services/liveClasses';
import { courseService } from '@/lib/services/courses';
import { batchService } from '@/lib/services/batches';
import { LiveClass, Course, Batch } from '@/types';
import { createLiveClassFormSchema } from '@/schemas';
import { EntityForm } from '@/components/admin/EntityForm';
import { Loader2 } from 'lucide-react';
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

export default function EditLiveClassPage() {
  const router = useRouter();
  const params = useParams();
  const { adminUser } = useAuth();
  
  const [liveClass, setLiveClass] = useState<LiveClass & { id: string } | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const liveClassId = params.id as string;

  useEffect(() => {
    async function fetchData() {
      try {
        const [liveClassRes, coursesRes, batchesRes] = await Promise.allSettled([
          liveClassService.get(liveClassId),
          courseService.list(1, 100),
          batchService.list(1, 100),
        ]);

        if (liveClassRes.status === 'fulfilled') {
          if (!liveClassRes.value) {
            toast.error('Live class not found');
            router.push('/admin/live-classes');
            return;
          }
          setLiveClass(liveClassRes.value);
        } else {
          console.error('Failed to fetch live class:', liveClassRes.reason);
          toast.error('Failed to load live class');
        }

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
        console.error('Unexpected error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
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
          duration: formData.duration ? parseInt(formData.duration, 10) : undefined,
          instructor: formData.instructor || undefined,
          courseId: formData.courseId || undefined,
          batchId: formData.batchId || undefined,
          status: formData.status,
        },
        adminUser.uid
      );
      toast.success('Live class updated successfully');
      router.refresh();
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
      <EntityForm
        schema={createLiveClassFormSchema}
        defaultValues={{
          title: liveClass.title,
          description: liveClass.description,
          startTime: liveClass.startTime 
            ? (typeof (liveClass.startTime as any).toDate === 'function' 
                ? (liveClass.startTime as any).toDate().toISOString().slice(0, 16) 
                : new Date(liveClass.startTime as any).toISOString().slice(0, 16))
            : '',
          duration: liveClass.duration || '',
          instructor: liveClass.instructor || '',
          courseId: liveClass.courseId || '',
          batchId: liveClass.batchId || '',
          status: liveClass.status,
        }}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        title="Edit Live Class"
        loading={submitting}
        fields={[
          { name: 'title', label: 'Title', type: 'text', required: true },
          { name: 'description', label: 'Description', type: 'textarea', required: true },
          { name: 'startTime', label: 'Start Time', type: 'datetime-local', required: false },
          { name: 'duration', label: 'Duration (minutes)', type: 'number', required: false },
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
