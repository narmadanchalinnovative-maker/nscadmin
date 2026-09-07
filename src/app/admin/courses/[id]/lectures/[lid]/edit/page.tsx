'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { lectureService } from '@/lib/services/lectures';
import { uploadLiveClassAsset } from '@/lib/storage';
import { createLectureFormSchema, CreateLectureFormSchema } from '@/schemas';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Lecture } from '@/types';

export default function EditLecturePage() {
  const router = useRouter();
  const params = useParams();
  const { adminUser } = useAuth();
  const [lecture, setLecture] = useState<Lecture & { id: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const courseId = params.id as string;
  const lectureId = params.lid as string;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateLectureFormSchema & { videoFile?: FileList }>({
    resolver: zodResolver(createLectureFormSchema as any),
  });

  useEffect(() => {
    async function fetchLecture() {
      try {
        const data = await lectureService.get(lectureId);
        if (data) {
          setLecture(data as Lecture & { id: string });
          reset({
            title: data.title,
            description: data.description,
            status: data.status,
            videoUrl: data.videoUrl || '',
            pdfUrl: data.pdfUrl || '',
          });
        } else {
          toast.error('Lecture not found');
          router.push(`/admin/courses/${courseId}/lectures`);
        }
      } catch (error) {
        console.error('Error fetching lecture:', error);
        toast.error('Failed to fetch lecture');
        router.push(`/admin/courses/${courseId}/lectures`);
      } finally {
        setLoading(false);
      }
    }

    fetchLecture();
  }, [lectureId, courseId, router, reset]);

  const onSubmit = async (formData: CreateLectureFormSchema & { videoFile?: FileList }) => {
    if (!adminUser?.uid || !lecture) {
      toast.error('User not authenticated');
      return;
    }

    try {
      setSubmitting(true);
      
      const file = formData.videoFile?.[0];
      let finalVideoUrl = formData.videoUrl;
      let videoPath = lecture.videoPath;

      if (file) {
        setUploadProgress(0);
        toast.info('Uploading new video, please wait...');
        
        try {
          const uploadResult = await uploadLiveClassAsset(file, lecture.id, 'lectures');
          finalVideoUrl = uploadResult.url;
          videoPath = uploadResult.path;
          toast.success('New video uploaded successfully');
        } catch (uploadError) {
          console.error('Upload failed:', uploadError);
          toast.error('Failed to upload new video. Saving other changes only.');
        }
      }

      await lectureService.update(lecture.id, {
        title: formData.title,
        description: formData.description,
        status: formData.status,
        videoUrl: finalVideoUrl || '',
        videoPath: videoPath || '',
      }, adminUser.uid);

      toast.success('Lecture updated successfully');
      router.push(`/admin/courses/${courseId}/lectures`);
    } catch (error) {
      console.error('Error updating lecture:', error);
      toast.error('Failed to update lecture');
    } finally {
      setSubmitting(false);
      setUploadProgress(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          <p className="text-gray-600">Loading lecture...</p>
        </div>
      </div>
    );
  }

  if (!lecture) return null;

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4 text-gray-900">Edit Lecture</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-white p-6 rounded-lg shadow">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Lecture Title <span className="text-red-500">*</span></label>
          <input {...register('title')} placeholder="Enter lecture title" className="w-full px-4 py-2 border rounded-lg text-gray-900" />
          {errors.title && <p className="mt-1 text-sm text-red-600">{String(errors.title?.message)}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
          <textarea {...register('description')} placeholder="Enter lecture description" rows={4} className="w-full px-4 py-2 border rounded-lg text-gray-900" />
          {errors.description && <p className="mt-1 text-sm text-red-600">{String(errors.description?.message)}</p>}
        </div>

        <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h3 className="text-md font-semibold text-gray-800 mb-2">Video Content</h3>
          
          {lecture.videoUrl && (
            <div className="mb-4 p-3 bg-blue-50 text-blue-800 rounded-md text-sm flex justify-between items-center">
              <span>Current Video: {lecture.videoUrl}</span>
              <a href={lecture.videoUrl} target="_blank" rel="noopener noreferrer" className="underline font-medium">View</a>
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Upload New Video File (optional)</label>
              <input 
                type="file" 
                accept="video/*"
                {...register('videoFile')} 
                className="w-full px-4 py-2 border rounded-lg text-gray-900 bg-white" 
              />
              <p className="mt-1 text-xs text-gray-500">Uploading a new file will replace the current video URL.</p>
            </div>

            <div className="flex items-center text-gray-500 text-sm font-medium">
              <span className="flex-1 h-px bg-gray-300"></span>
              <span className="px-3">OR</span>
              <span className="flex-1 h-px bg-gray-300"></span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Video URL</label>
              <input {...register('videoUrl')} placeholder="https://youtube.com/..." type="url" className="w-full px-4 py-2 border rounded-lg text-gray-900 bg-white" />
              {errors.videoUrl && <p className="mt-1 text-sm text-red-600">{String(errors.videoUrl?.message)}</p>}
            </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes PDF URL (Optional)
          </label>
          <input
            {...register('pdfUrl')}
            type="url"
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border bg-white"
            placeholder="https://example.com/notes.pdf"
          />
          <p className="text-sm text-gray-500 mt-1">Leave Video URL blank to create a Notes-only lecture.</p>
          {errors.pdfUrl && (
            <p className="mt-1 text-sm text-red-600">{errors.pdfUrl.message}</p>
          )}
        </div>

          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status <span className="text-red-500">*</span></label>
          <select {...register('status')} className="w-full px-4 py-2 border rounded-lg text-gray-900">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          {errors.status && <p className="mt-1 text-sm text-red-600">{String(errors.status?.message)}</p>}
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <button type="button" onClick={() => router.back()} disabled={isSubmitting || submitting} className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50">Cancel</button>
          <button type="submit" disabled={isSubmitting || submitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 disabled:opacity-50">
            {(isSubmitting || submitting) && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting && uploadProgress !== null ? 'Uploading...' : (isSubmitting || submitting ? 'Saving...' : 'Save Changes')}
          </button>
        </div>
      </form>
    </div>
  );
}
