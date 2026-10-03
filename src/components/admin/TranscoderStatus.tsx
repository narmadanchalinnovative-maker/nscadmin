import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Loader2, AlertCircle } from 'lucide-react';

interface TranscoderStatusProps {
  lectureId: string;
}

export function TranscoderStatus({ lectureId }: TranscoderStatusProps) {
  const [percent, setPercent] = useState<number>(0);
  const [eta, setEta] = useState<string>('Estimating...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!lectureId) return;
    
    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001';
    let socket: Socket;

    try {
      socket = io();
      
      socket.on('transcode_progress', (data: { lectureId: string, percent: number, eta: string }) => {
        if (data.lectureId === lectureId) {
          setPercent(data.percent);
          if (data.eta) setEta(data.eta);
        }
      });

      socket.on('data_updated', (data: { collection: string, action: string, data: any }) => {
        if (data.collection === 'lectures' && data.data?.id === lectureId) {
          if (data.data.videoProcessingStatus === 'ERROR') {
             setError(data.data.videoProcessingError || 'Transcoding Failed');
          }
        }
      });

      return () => {
        socket.disconnect();
      };
    } catch (e) {
      console.error('Error connecting to socket for TranscoderStatus:', e);
    }
  }, [lectureId]);

  if (error) {
    return (
      <div className="mt-2 flex flex-col items-start gap-1">
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full max-w-max">
          <AlertCircle className="w-3 h-3" />
          Processing Failed
        </span>
        <button 
          onClick={() => alert(error)} 
          className="text-xs text-red-600 underline hover:text-red-800"
        >
          View Error
        </button>
      </div>
    );
  }

  return (
    <div className="mt-2 w-full max-w-sm">
      <div className="flex justify-between text-xs text-gray-600 mb-1">
        <span className="flex items-center gap-1">
          <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
          {percent === 0 && eta === 'Estimating...' ? 'Video Queued...' : 'Processing Video...'}
        </span>
        <span>{percent}% (ETA: {eta})</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
        <div 
          className="bg-blue-500 h-1.5 rounded-full transition-all duration-300 ease-out" 
          style={{ width: `${percent}%` }}
        ></div>
      </div>
    </div>
  );
}
