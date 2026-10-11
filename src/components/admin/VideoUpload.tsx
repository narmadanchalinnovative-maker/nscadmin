'use client';

import { useState } from 'react';
import { Loader2, X, FileVideo } from 'lucide-react';
import { toast } from 'sonner';

interface VideoUploadProps {
  value?: string;
  onChange: (key: string) => void;
  storagePath?: string;
}

const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB chunks to stay well below Vercel's 4.5MB body limit

export function VideoUpload({ value, onChange }: VideoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [eta, setEta] = useState<string>('');

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast.error('Please upload a video file.');
      return;
    }

    try {
      setIsUploading(true);
      setProgress(0);
      setEta('Starting chunked upload...');

      // Upload chunked directly to VPS Backend via proxy
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/external-api';
      const uploadId = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
      const startTime = Date.now();

      let videoPath = '';

      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(file.size, start + CHUNK_SIZE);
        const chunk = file.slice(start, end);

        const chunkFormData = new FormData();
        chunkFormData.append('chunk', chunk, 'chunk.bin');
        chunkFormData.append('uploadId', uploadId);
        chunkFormData.append('chunkIndex', i.toString());
        chunkFormData.append('totalChunks', totalChunks.toString());
        chunkFormData.append('fileName', file.name);

        const response = await fetch(`${apiUrl}/video/upload-chunk`, {
          method: 'POST',
          body: chunkFormData,
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `Upload failed at chunk ${i + 1}/${totalChunks} (status ${response.status})`);
        }

        const data = await response.json();
        const currentProgress = Math.round(((i + 1) / totalChunks) * 100);
        setProgress(currentProgress);

        // Calculate speed & remaining ETA
        const elapsedSec = (Date.now() - startTime) / 1000;
        if (elapsedSec > 1 && i < totalChunks - 1) {
          const bytesUploaded = end;
          const bytesRemaining = file.size - bytesUploaded;
          const uploadSpeed = bytesUploaded / elapsedSec;
          const secRemaining = Math.max(0, bytesRemaining / uploadSpeed);

          if (secRemaining > 60) {
            setEta(`Chunk ${i + 1}/${totalChunks} (${currentProgress}%) • ETA: ${Math.ceil(secRemaining / 60)} mins`);
          } else {
            setEta(`Chunk ${i + 1}/${totalChunks} (${currentProgress}%) • ETA: ${Math.ceil(secRemaining)} secs`);
          }
        } else if (i === totalChunks - 1) {
          setEta('Finalizing & processing on VPS...');
        }

        if (data.completed && data.videoPath) {
          videoPath = data.videoPath;
        }
      }

      if (!videoPath) {
        throw new Error('Server did not return a valid video path');
      }

      onChange(videoPath);
      toast.success('Video uploaded successfully!');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'An error occurred during upload.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full">
      {value ? (
        <div className="relative inline-block w-full p-4 bg-gray-50 border rounded-lg text-sm">
          <p className="mb-2"><strong>Video ready for processing:</strong></p>
          <p className="text-gray-500 break-all">{value}</p>
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="relative flex flex-col space-y-4">
          <div className="relative w-full">
            <input
              type="file"
              accept="video/*"
              onChange={handleUpload}
              disabled={isUploading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
            />
            <div className={`w-full px-4 py-6 border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors ${isUploading ? 'bg-gray-50 border-gray-300' : 'bg-gray-50 border-gray-300 hover:border-blue-500 hover:bg-blue-50'}`}>
              {isUploading ? (
                <>
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
                  <span className="text-sm font-medium text-gray-700 mb-1">Uploading Video... {progress > 0 ? `${progress}%` : ''}</span>
                  {eta && <span className="text-xs font-semibold text-blue-600">{eta}</span>}
                  <span className="text-xs text-gray-400 mt-2 text-center max-w-xs">Uploading directly to VPS in resilient chunks...</span>
                </>
              ) : (
                <>
                  <FileVideo className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm font-medium text-gray-600">Click or drag video to upload to VPS</span>
                  <span className="text-xs text-gray-400 mt-1">MP4, WebM, or OGG (chunked upload supported)</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
