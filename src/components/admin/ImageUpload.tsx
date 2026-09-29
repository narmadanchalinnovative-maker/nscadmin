'use client';

import { useState } from 'react';
import { UploadCloud, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  storagePath?: string;
}

export function ImageUpload({ value, onChange, storagePath }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type and size (e.g., max 5MB)
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB.');
      return;
    }

    setIsUploading(true);
    setProgress(50); // Fake progress for now

    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://201.18.192.154:3001/api';
      const response = await fetch(`${apiUrl}/video/upload-image`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setProgress(100);
        onChange(data.imageUrl);
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full">
      {value ? (
        <div className="relative inline-block">
          <img
            src={value}
            alt="Uploaded"
            className="h-32 w-auto object-cover rounded-lg border border-gray-200"
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
            accept="image/*"
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
                <span className="text-sm text-gray-500">Uploading... {Math.round(progress)}%</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm font-medium text-gray-600">Click or drag image to upload</span>
                <span className="text-xs text-gray-400 mt-1">SVG, PNG, JPG or GIF (max. 5MB)</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
