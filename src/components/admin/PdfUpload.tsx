'use client';

import { useState, useRef } from 'react';
import { Loader2, X, FileText, Copy, Check, ExternalLink, Link as LinkIcon, RefreshCw, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import { normalizeMediaUrl } from '@/lib/media';

interface PdfUploadProps {
  value?: string;
  onChange: (url: string) => void;
  storagePath?: string;
}

export function PdfUpload({ value, onChange }: PdfUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFullUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    const baseUrl = 'http://201.18.192.154:3001';
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const handleCopy = async () => {
    if (!value) return;
    try {
      const fullUrl = getFullUrl(value);
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      toast.success('PDF link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy PDF link:', err);
      toast.error('Failed to copy PDF link to clipboard');
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Please select a valid PDF file.');
      return;
    }

    setIsUploading(true);
    setProgress(30);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/external-api';
      setProgress(60);

      const response = await fetch(`${apiUrl}/video/upload-file`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setProgress(100);
        const uploadedUrl =
          data.fileUrl ||
          data.url ||
          data.file ||
          data.path ||
          data.data?.fileUrl ||
          data.data?.url;

        if (!uploadedUrl) {
          throw new Error('No URL returned from server');
        }

        onChange(uploadedUrl);
        toast.success('PDF uploaded successfully! URL populated below.');
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload PDF.');
    } finally {
      setIsUploading(false);
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  return (
    <div className="w-full space-y-3">
      {/* Hidden file input for Replace action */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        onChange={handleUpload}
        disabled={isUploading}
        className="hidden"
      />

      {/* Upload Box or Attached Preview */}
      {value ? (
        <div className="p-3.5 bg-gradient-to-r from-red-50 to-rose-50/50 border border-red-200/90 rounded-xl shadow-xs">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2.5 bg-red-500 text-white rounded-lg shadow-xs shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800 text-xs">PDF Document Attached</span>
                  <span className="text-[10px] bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded">
                    PDF
                  </span>
                </div>
                <a
                  href={normalizeMediaUrl(value)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium truncate block max-w-xs sm:max-w-md mt-0.5"
                  title={value}
                >
                  {value.split('/').pop() || 'View Attached PDF'} ↗
                </a>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition-colors"
                title="Upload a new file to replace current PDF"
              >
                {isUploading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                )}
                <span className="hidden sm:inline">Replace File</span>
              </button>

              <button
                type="button"
                onClick={() => onChange('')}
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Remove PDF"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative">
          <input
            type="file"
            accept="application/pdf,.pdf"
            onChange={handleUpload}
            disabled={isUploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
          />
          <div
            className={`w-full px-4 py-6 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-colors ${
              isUploading
                ? 'bg-slate-50 border-blue-400'
                : 'bg-slate-50/70 border-slate-300 hover:border-blue-500 hover:bg-blue-50/40'
            }`}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
                <span className="text-sm font-medium text-slate-700">
                  Uploading PDF... {Math.round(progress)}%
                </span>
                <span className="text-xs text-slate-400 mt-1">Uploading to VPS storage...</span>
              </>
            ) : (
              <>
                <div className="p-2.5 bg-red-50 rounded-full text-red-500 mb-2">
                  <FileText className="w-6 h-6" />
                </div>
                <span className="text-sm font-semibold text-slate-700">Click or drag PDF to upload</span>
                <span className="text-xs text-slate-400 mt-0.5">PDF documents (unlimited size)</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* PDF URL Text Field Section */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-slate-700">
            Or PDF Link / URL (Direct Link)
          </label>
          {value && (
            <span className="text-[11px] font-medium text-emerald-600 flex items-center gap-1">
              <Check className="w-3 h-3" /> Ready in app
            </span>
          )}
        </div>

        <div className="relative flex items-center">
          <div className="absolute left-3 text-slate-400 pointer-events-none">
            <LinkIcon className="w-4 h-4" />
          </div>

          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Paste PDF link (e.g. https://... or /uploads/...)"
            className="w-full pl-9 pr-24 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
          />

          <div className="absolute right-1.5 flex items-center gap-1">
            {value ? (
              <>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-md transition-colors"
                  title="Copy link to reuse in other lectures"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                <a
                  href={normalizeMediaUrl(value)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-md transition-colors"
                  title="Open PDF in new tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={() => onChange('')}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  title="Clear PDF URL"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : null}
          </div>
        </div>

        <p className="text-[11px] text-slate-500 leading-relaxed">
          Upload a PDF above or paste an existing PDF URL here. Once a file is uploaded, its link appears in this box automatically so you can copy and reuse it across multiple lectures or batches.
        </p>
      </div>
    </div>
  );
}
