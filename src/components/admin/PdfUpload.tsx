'use client';

import { useState } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
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

    if (!storage) {
      toast.error('Firebase storage is not initialized.');
      return;
    }

    setIsUploading(true);
    setProgress(0);

    const basePath = storagePath || 'courses/materials';
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
        toast.error('Failed to upload PDF.');
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




