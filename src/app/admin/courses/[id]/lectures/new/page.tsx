'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { lectureService } from '@/lib/services/lectures';
import { uploadLiveClassAsset } from '@/lib/storage';
import { createLectureFormSchema, CreateLectureFormSchema } from '@/schemas';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function CreateLecturePage() {
  const router = useRouter();
  const params = useParams();
  const { adminUser } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const courseId = params.id as string;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateLectureFormSchema & { videoFile?: FileList }>({
    resolver: zodResolver(createLectureFormSchema as any),
    defaultValues: {
      status: 'active',
    },
  });

  const onSubmit = async (formData: CreateLectureFormSchema & { videoFile?: FileList }) => {
    if (!adminUser?.uid) {
      toast.error('User not authenticated');
      return;
    }

    try {
      setSubmitting(true);
      
      const file = formData.videoFile?.[0];
      let finalVideoUrl = formData.videoUrl;
      let videoPath = '';

      // First create the document to get an ID
      const lectureData: any = {
        courseId,
        title: formData.title,
        description: formData.description,
        status: formData.status,
        videoUrl: finalVideoUrl || '',
      };

      const newLectureId = await lectureService.create(lectureData, adminUser.uid);

      if (file) {
        setUploadProgress(0); // Start progress indicator (fake progress since uploadLiveClassAsset doesn't return progress yet, but UX expects it)
        toast.info('Uploading video, please wait...');
        
        try {
          // You could enhance uploadLiveClassAsset to handle progress updates, 
          // but for now we wait for the promise to resolve.
          const uploadResult = await uploadLiveClassAsset(file, newLectureId, 'lectures');
          finalVideoUrl = uploadResult.url;
          videoPath = uploadResult.path;

          // Update the lecture with the file URL
          await lectureService.update(newLectureId, { 
            videoUrl: finalVideoUrl,
            videoPath: videoPath 
          }, adminUser.uid);
          
          toast.success('Video uploaded successfully');
        } catch (uploadError) {
          console.error('Upload failed:', uploadError);
          toast.error('Failed to upload video. Lecture created without video.');
        }
      }

      toast.success('Lecture created successfully');
      router.push(`/admin/courses/${courseId}/lectures`);
    } catch (error) {
      console.error('Error creating lecture:', error);
      toast.error('Failed to create lecture');
    } finally {
      setSubmitting(false);
      setUploadProgress(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4 text-gray-900">Create New Lecture</h1>
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
          <p className="text-sm text-gray-600 mb-4">You can either upload a video file directly or provide a link (e.g. YouTube/Vimeo).</p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Upload Video File</label>
              <input 
                type="file" 
                accept="video/*"
                {...register('videoFile')} 
                className="w-full px-4 py-2 border rounded-lg text-gray-900 bg-white" 
              />
              <p className="mt-1 text-xs text-gray-500">Max size depending on your Firebase Storage limits.</p>
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
            {submitting && uploadProgress !== null ? 'Uploading...' : (isSubmitting || submitting ? 'Saving...' : 'Save Lecture')}
          </button>
        </div>
      </form>
    </div>
  );
}
