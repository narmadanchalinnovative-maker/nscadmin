'use client';

import { useState } from 'react';
import { Loader2, X, FileVideo } from 'lucide-react';
import { toast } from 'sonner';

interface VideoUploadProps {
  value?: string;
  onChange: (key: string) => void;
  storagePath?: string;
}

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
      setEta('Starting upload...');

      // Upload directly to VPS Backend
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/external-api';
      const formData = new FormData();
      formData.append('video', file);

      const startTime = Date.now();

      const videoPath = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentage = Math.round((event.loaded / event.total) * 100);
            setProgress(percentage);

            const timeElapsed = (Date.now() - startTime) / 1000; // seconds
            if (timeElapsed > 1 && percentage < 100) {
               const uploadSpeed = event.loaded / timeElapsed;
               const bytesRemaining = event.total - event.loaded;
               const secondsRemaining = Math.max(0, bytesRemaining / uploadSpeed);
               
               if (secondsRemaining > 60) {
                 setEta(`Upload ETA: ${Math.ceil(secondsRemaining / 60)} mins`);
               } else {
                 setEta(`Upload ETA: ${Math.ceil(secondsRemaining)} secs`);
               }
            } else if (percentage === 100) {
               setEta('Uploading to Cloudinary (Usually takes 5-15 seconds)...');
            }
          }
        });

        // Set up a timer to show elapsed time while waiting for server response
        let finalizeInterval: NodeJS.Timeout;
        xhr.addEventListener('loadstart', () => {
          finalizeInterval = setInterval(() => {
            if (progress === 100) {
              const elapsedFinalize = Math.floor((Date.now() - startTime) / 1000);
              setEta(`Processing on Server... (${elapsedFinalize}s elapsed)`);
            }
          }, 1000);
        });

        xhr.addEventListener('load', () => {
          clearInterval(finalizeInterval);
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              if (response.success && response.videoPath) {
                resolve(response.videoPath);
              } else {
                reject(new Error(response.error || 'Upload failed'));
              }
            } catch (e) {
              reject(new Error('Invalid response from server'));
            }
          } else {
            try {
              const errorResponse = JSON.parse(xhr.responseText);
              reject(new Error(errorResponse.error || `Upload failed with status ${xhr.status}`));
            } catch (e) {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          }
        });

        xhr.addEventListener('error', () => {
          clearInterval(finalizeInterval);
          reject(new Error('Network error during upload'));
        });
        
        xhr.addEventListener('abort', () => {
          clearInterval(finalizeInterval);
          reject(new Error('Upload aborted'));
        });
        
        xhr.open('POST', `${apiUrl}/video/upload`, true);
        // Do NOT set Content-Type; browser will set multipart/form-data with the correct boundary
        xhr.send(formData);
      });

      // 3. Return the videoPath (filename) to the parent form
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
                  <span className="text-sm font-medium text-gray-700 mb-1">Uploading Video... {progress > 0 ? `${progress.toFixed(0)}%` : ''}</span>
                  {eta && <span className="text-xs font-semibold text-blue-600">{eta}</span>}
                  <span className="text-xs text-gray-400 mt-2 text-center max-w-xs">Uploading to Cloudinary CDN for instant playback...</span>
                </>
              ) : (
                <>
                  <FileVideo className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm font-medium text-gray-600">Click or drag video to upload to Cloudinary</span>
                  <span className="text-xs text-gray-400 mt-1">MP4, WebM, or OGG</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


