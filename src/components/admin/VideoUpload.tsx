'use client';

import { useState, useRef } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { UploadCloud, Loader2, X, FileVideo } from 'lucide-react';
import { toast } from 'sonner';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL, fetchFile } from '@ffmpeg/util';

interface VideoUploadProps {
  value?: string;
  onChange: (url: string) => void;
  storagePath?: string;
}

export function VideoUpload({ value, onChange, storagePath }: VideoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [eta, setEta] = useState('');
  const [enableCompression, setEnableCompression] = useState(true);
  const ffmpegRef = useRef(new FFmpeg());

  const loadFfmpeg = async () => {
    const ffmpeg = ffmpegRef.current;
    if (!ffmpeg.loaded) {
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
    }
  };

  const startUpload = (fileToUpload: File) => {
    setIsUploading(true);
    setProgress(0);
    setEta('');
    setStatusText('Uploading Video...');

    const startTime = Date.now();
    const basePath = 'raw_lectures';
    const storageRef = ref(storage!, `${basePath}/${Date.now()}_${fileToUpload.name}`);
    const uploadTask = uploadBytesResumable(storageRef, fileToUpload);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setProgress(p);
        
        // Calculate ETA
        if (snapshot.bytesTransferred > 0) {
          const elapsedSec = (Date.now() - startTime) / 1000;
          const speed = snapshot.bytesTransferred / elapsedSec; // bytes per second
          const remainingBytes = snapshot.totalBytes - snapshot.bytesTransferred;
          const etaSec = remainingBytes / speed;
          
          if (etaSec > 0 && etaSec !== Infinity) {
            if (etaSec > 3600) {
              const hours = Math.floor(etaSec / 3600);
              const mins = Math.floor((etaSec % 3600) / 60);
              setEta(`${hours}h ${mins}m remaining`);
            } else if (etaSec > 60) {
              const mins = Math.floor(etaSec / 60);
              const secs = Math.floor(etaSec % 60);
              setEta(`${mins}m ${secs}s remaining`);
            } else {
              setEta(`${Math.floor(etaSec)}s remaining`);
            }
          }
        }
      },
      (error) => {
        console.error('Upload error:', error);
        toast.error('Failed to upload video.');
        setIsUploading(false);
      },
      async () => {
        const bucket = uploadTask.snapshot.ref.bucket;
        const fullPath = uploadTask.snapshot.ref.fullPath;
        const fileNameWithoutExt = fullPath.split("/").pop()?.split(".").slice(0, -1).join(".") || "";
        const hlsUrl = `https://storage.googleapis.com/${bucket}/hls_lectures/${encodeURIComponent(fileNameWithoutExt)}/manifest.m3u8`;
        onChange(hlsUrl);
        setIsUploading(false);
      }
    );
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast.error('Please upload a video file.');
      return;
    }

    if (!storage) {
      toast.error('Firebase storage is not initialized.');
      return;
    }

    if (!enableCompression) {
      startUpload(file);
      return;
    }

    try {
      setIsCompressing(true);
      setProgress(0);
      setStatusText('Loading compressor...');
      
      await loadFfmpeg();
      const ffmpeg = ffmpegRef.current;
      
      setStatusText('Compressing Video...');
      ffmpeg.on('progress', ({ progress, time }) => {
        setProgress(Math.round(progress * 100));
      });
      
      const fileName = file.name;
      const outputName = 'compressed_' + fileName;
      
      // Load file into FFmpeg memory
      await ffmpeg.writeFile(fileName, await fetchFile(file));
      
      // Run compression
      const retcode = await ffmpeg.exec([
        '-i', fileName,
        '-vf', 'scale=-2:720',
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-crf', '32',
        '-c:a', 'aac',
        '-b:a', '128k',
        outputName
      ]);
      
      if (retcode !== 0) {
        throw new Error('FFmpeg failed with code ' + retcode);
      }
      
      setStatusText('Preparing upload...');
      const data = await ffmpeg.readFile(outputName);
      const compressedBlob = new Blob([data as any], { type: 'video/mp4' });
      const compressedFile = new File([compressedBlob], fileName, { type: 'video/mp4' });
      
      // Cleanup
      await ffmpeg.deleteFile(fileName);
      await ffmpeg.deleteFile(outputName);
      
      setIsCompressing(false);
      startUpload(compressedFile);
    } catch (error) {
      console.error('Compression/Upload error:', error);
      toast.error('An error occurred during compression or upload. Is the file too large?');
      setIsCompressing(false);
      setIsUploading(false);
    }
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
        <div className="relative flex flex-col space-y-4">
          <div className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              id="compressToggle" 
              checked={enableCompression} 
              onChange={(e) => setEnableCompression(e.target.checked)} 
              disabled={isUploading || isCompressing}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="compressToggle" className="text-sm font-medium text-gray-700">
              Enable Compression (Smaller size, faster upload, high CPU usage)
            </label>
          </div>
          
          <div className="relative w-full">
            <input
              type="file"
              accept="video/*"
              onChange={handleUpload}
              disabled={isUploading || isCompressing}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
            />
            <div className={`w-full px-4 py-6 border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors ${(isUploading || isCompressing) ? 'bg-gray-50 border-gray-300' : 'bg-gray-50 border-gray-300 hover:border-blue-500 hover:bg-blue-50'}`}>
              {(isUploading || isCompressing) ? (
                <>
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
                  <span className="text-sm text-gray-500">{statusText} {progress > 0 ? `${progress.toFixed(1)}%` : ''} {eta && isUploading ? ` • ${eta}` : ''}</span>
                </>
              ) : (
                <>
                  <FileVideo className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm font-medium text-gray-600">Click or drag video to {enableCompression ? 'compress & upload' : 'upload raw'}</span>
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


