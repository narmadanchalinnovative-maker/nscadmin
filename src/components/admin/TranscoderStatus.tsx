import React, { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2, AlertCircle } from 'lucide-react';

interface TranscoderStatusProps {
  videoUrl: string;
}

export function TranscoderStatus({ videoUrl }: TranscoderStatusProps) {
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    if (!videoUrl) return;
    
    try {
      const decodedUrl = decodeURIComponent(videoUrl);
      // Example: hls_lectures/1788453745768_2026-06-17 09-23-58/manifest.m3u8
      const folderMatch = decodedUrl.match(/hls_lectures\/([^\/]+)\//);
      if (!folderMatch || !folderMatch[1]) return;
      
      const folderName = folderMatch[1];

      const unsubscribe = onSnapshot(doc(db, 'transcoder_jobs', folderName), (docSnap) => {
        if (docSnap.exists()) {
          setStatus(docSnap.data());
        }
      });

      return () => unsubscribe();
    } catch (e) {
      console.error('Error parsing videoUrl for TranscoderStatus:', e);
    }
  }, [videoUrl]);

  if (!status) {
    return (
      <span className="inline-flex items-center gap-1 mt-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full animate-pulse max-w-max">
        <Loader2 className="w-3 h-3 animate-spin" />
        Processing Video...
      </span>
    );
  }

  if (status.status === 'FAILED') {
    return (
      <div className="mt-2 flex flex-col items-start gap-1">
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full max-w-max">
          <AlertCircle className="w-3 h-3" />
          Video Processing Failed
        </span>
        <button 
          onClick={() => alert(status.error || 'Unknown Error')} 
          className="text-xs text-red-600 underline hover:text-red-800"
        >
          View Error Log
        </button>
      </div>
    );
  }

  const progress = status.progress || 0;
  
  let etaText = "";
  if (status.status === "RUNNING") {
    if (progress > 0 && status.createdAt) {
      const startMs = status.createdAt.seconds ? status.createdAt.seconds * 1000 : Date.now();
      const elapsedMs = Date.now() - startMs;
      if (elapsedMs > 5000) {
        const estimatedTotalMs = (elapsedMs / progress) * 100;
        const remainingMs = estimatedTotalMs - elapsedMs;
        if (remainingMs > 0) {
          const remainingMinutes = Math.floor(remainingMs / 60000);
          const remainingSeconds = Math.floor((remainingMs % 60000) / 1000);
          etaText = remainingMinutes > 0 ? ` • ETA: ${remainingMinutes}m ${remainingSeconds}s` : ` • ETA: ${remainingSeconds}s`;
        }
      } else {
        etaText = " • Estimating...";
      }
    } else {
      etaText = " • Estimating...";
    }
  }
  
  return (
    <span className="inline-flex items-center gap-1 mt-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full max-w-max">
      <Loader2 className="w-3 h-3 animate-spin" />
      Processing Video... {progress}% {etaText}
    </span>
  );
}
