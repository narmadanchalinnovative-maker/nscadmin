'use client';

import { useState } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { UploadCloud, Loader2, X, FileVideo } from 'lucide-react';
import { toast } from 'sonner';

interface VideoUploadProps {
  value?: string;
  onChange: (url: string) => void;
  storagePath?: string;
}

export function VideoUpload({ value, onChange, storagePath }: VideoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast.error('Please upload a video file.');
      return;
    }
    // Allow larger files for video, e.g. 1GB
    if (file.size > 1024 * 1024 * 1024) {
      toast.error('Video must be less than 1GB.');
      return;
    }

    if (!storage) {
      toast.error('Firebase storage is not initialized.');
      return;
    }

    setIsUploading(true);
    setProgress(0);

    const basePath = storagePath || 'lectures/videos';
    const storageRef = ref(storage, `${basePath}/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setProgress(p);
      },
      (error) => {
        console.error('Upload error:', error);
        toast.error('Failed to upload video.');
        setIsUploading(false);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        onChange(downloadURL);
        setIsUploading(false);
      }
    );
  };

  return (
    <div className="w-full">
      {value ? (
        <div className="relative inline-block w-full">
          <video
            src={value}
            controls
            className="w-full h-auto max-h-64 object-contain rounded-lg bg-black border border-gray-200"
          />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <input
            type="file"
            accept="video/*"
            onChange={handleUpload}
            disabled={isUploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />
          <div className={`w-full px-4 py-6 border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors ${
            isUploading ? 'bg-gray-50 border-gray-300' : 'bg-gray-50 border-gray-300 hover:border-blue-500 hover:bg-blue-50'
          }`}>
            {isUploading ? (
              <>
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
                <span className="text-sm text-gray-500">Uploading Video... {Math.round(progress)}%</span>
              </>
            ) : (
              <>
                <FileVideo className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm font-medium text-gray-600">Click or drag video to upload</span>
                <span className="text-xs text-gray-400 mt-1">MP4, WebM, or OGG (max. 1GB)</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
