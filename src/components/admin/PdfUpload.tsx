'use client';

import { useState } from 'react';
import { UploadCloud, Loader2, X, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface PdfUploadProps {
  value?: string;
  onChange: (url: string) => void;
  storagePath?: string;
}

export function PdfUpload({ value, onChange, storagePath }: PdfUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file.');
      return;
    }

    setIsUploading(true);
    setProgress(50);

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://201.18.192.154:3001/api';
      const response = await fetch(`${apiUrl}/video/upload-file`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setProgress(100);
        onChange(data.fileUrl);
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload PDF.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full">
      {value ? (
        <div className="relative inline-block w-full">
          <div className="flex items-center justify-center p-4 bg-gray-100 rounded-lg w-full h-32"><FileText className="w-10 h-10 text-red-500" /><a href={value} target="_blank" rel="noopener noreferrer" className="ml-3 font-medium text-blue-600 hover:underline">View Uploaded PDF</a></div>
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
            accept="application/pdf"
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
                <span className="text-sm text-gray-500">Uploading PDF... {Math.round(progress)}%</span>
              </>
            ) : (
              <>
                <FileText className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm font-medium text-gray-600">Click or drag PDF to upload</span>
                <span className="text-xs text-gray-400 mt-1">PDF documents (unlimited size)</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
