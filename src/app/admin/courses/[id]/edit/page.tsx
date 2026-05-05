'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { courseService } from '@/lib/services/courses';
import { Course } from '@/types';
import { createCourseFormSchema } from '@/schemas';
import { EntityForm } from '@/components/admin/EntityForm';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function EditCoursePage() {
  const router = useRouter();
  const params = useParams();
  const { adminUser } = useAuth();
  const [course, setCourse] = useState<Course & { id: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const courseId = params.id as string;

  useEffect(() => {
    async function fetchCourse() {
      try {
        const data = await courseService.get(courseId);
        if (data) {
          setCourse(data);
        } else {
          toast.error('Course not found');
          router.push('/admin/courses');
        }
      } catch (error) {
        console.error('Error fetching course:', error);
        toast.error('Failed to fetch course');
        router.push('/admin/courses');
      } finally {
        setLoading(false);
      }
    }

    fetchCourse();
  }, [courseId, router]);

  const handleSubmit = async (formData: any) => {
    if (!adminUser?.uid || !course) {
      toast.error('User not authenticated');
      return;
    }

    try {
      setSubmitting(true);
      await courseService.update(course.id, formData, adminUser.uid);
      toast.success('Course updated successfully');
      router.push('/admin/courses');
    } catch (error) {
      console.error('Error updating course:', error);
      toast.error('Failed to update course');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          <p className="text-gray-600">Loading course...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return null;
  }

  return (
    <div>
      <EntityForm
        schema={createCourseFormSchema}
        defaultValues={{
          title: course.title,
          description: course.description,
          status: course.status,
        }}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        title="Edit Course"
        loading={submitting}
        fields={[
          {
            name: 'title',
            label: 'Course Title',
            type: 'text',
            placeholder: 'Enter course title',
            required: true,
          },
          {
            name: 'description',
            label: 'Description',
            type: 'textarea',
            placeholder: 'Enter course description',
            required: true,
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
