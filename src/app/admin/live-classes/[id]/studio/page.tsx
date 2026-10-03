'use client';

import { useEffect, useRef, useState, use } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  Camera, CameraOff, Mic, MicOff, 
  MonitorUp, Settings, StopCircle, 
  Play, Users, MessageSquare, Send,
  Activity, Wifi, ArrowUpRight
} from 'lucide-react';
import { toast } from 'sonner';
import { liveClassService } from '@/lib/services/liveClasses';
import { LiveClass } from '@/types';
import { useAuth } from '@/lib/auth-context';

export default function LiveStudioPage() {
  const router = useRouter();
  const { adminUser } = useAuth();
  const params = useParams();
  const id = params.id as string;
  const videoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  
  const [session, setSession] = useState<LiveClass | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [messages, setMessages] = useState<{name: string, text: string, time: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  
  const [networkStats, setNetworkStats] = useState({
    bitrate: '0.00',
    totalData: '0.00 MB',
    resolution: '0x0',
    fps: 0,
    packetsSent: 0,
    status: 'Idle'
  });

  // WebRTC Stats Monitor
  useEffect(() => {
    let interval: NodeJS.Timeout;
    let lastBytesSent = 0;
    let lastTimestamp = 0;

    if (isStreaming) {
      interval = setInterval(async () => {
        if (!pcRef.current) return;
        try {
          const stats = await pcRef.current.getStats();
          
          stats.forEach(report => {
            if (report.type === 'outbound-rtp' && report.kind === 'video') {
              const bytesSent = report.bytesSent || 0;
              const timestamp = report.timestamp;
              
              if (lastTimestamp > 0) {
                const bytesPerSec = ((bytesSent - lastBytesSent) * 1000) / (timestamp - lastTimestamp);
                const speedKBs = (bytesPerSec / 1024).toFixed(1); // KB/s
                const bitrateKbps = (bytesPerSec * 8) / 1000;
                
                let netStatus = 'Excellent';
                if (bitrateKbps < 100) netStatus = 'Poor (Low Bandwidth)';
                else if (bitrateKbps < 300) netStatus = 'Good';

                setNetworkStats({
                  bitrate: `${speedKBs} KB/s`,
                  totalData: `${(bytesSent / (1024 * 1024)).toFixed(2)} MB`,
                  resolution: `${report.frameWidth || 0}x${report.frameHeight || 0}`,
                  fps: report.framesPerSecond || 0,
                  packetsSent: report.packetsSent || 0,
                  status: netStatus
                });
              }
              
              lastBytesSent = bytesSent;
              lastTimestamp = timestamp;
            }
          });
        } catch(e) {
          console.error("Error getting stats", e);
        }
      }, 1000);
    } else {
      setNetworkStats(prev => ({ ...prev, status: 'Idle', bitrate: '0.00' }));
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isStreaming]);

  // Fetch session details
  useEffect(() => {
    async function fetchSession() {
      try {
        const data = await liveClassService.get(id);
        if (data) setSession(data);
      } catch (error) {
        toast.error('Failed to load live class details');
      }
    }
    fetchSession();
  }, [id]);

  // Init Camera
  useEffect(() => {
    let currentStream: MediaStream | null = null;
    async function initCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640, max: 640 },
            height: { ideal: 480, max: 480 },
            frameRate: { ideal: 10, max: 15 } // Reduced framerate to save data
          },
          audio: true
        });
        currentStream = mediaStream;
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error('Error accessing media devices:', err);
        toast.error('Camera/Microphone permission denied or device not found.');
      }
    }
    initCamera();

    return () => {
      // Cleanup
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, session?.id]);
  // Toggle Media
  const toggleCamera = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isCameraOn;
        setIsCameraOn(!isCameraOn);
      }
    }
  };

  const toggleMic = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isMicOn;
        setIsMicOn(!isMicOn);
      }
    }
  };

  const handleStartStream = async () => {
    if (!adminUser || isStreaming) return;
    try {
      setIsStreaming(true);
      
      // 1. Setup WebRTC PeerConnection
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      pcRef.current = pc;

      // 2. Add local tracks
      if (stream) {
        stream.getTracks().forEach(track => {
          const sender = pc.addTrack(track, stream);
          
          // Apply extreme compression (max 150kbps) to heavily save students' mobile data
          if (track.kind === 'video') {
            const params = sender.getParameters();
            if (!params.encodings) params.encodings = [{}];
            params.encodings[0].maxBitrate = 150000; // 150 kbps (was 400 kbps)
            sender.setParameters(params).catch(e => console.error("Failed to set bitrate:", e));
            
            // CRITICAL: Force H264 codec so MediaMTX can remux to HLS! (HLS doesn't support VP8/VP9)
            try {
              const transceivers = pc.getTransceivers();
              const videoTransceiver = transceivers.find(t => t.sender === sender);
              if (videoTransceiver && 'setCodecPreferences' in videoTransceiver) {
                const codecs = RTCRtpSender.getCapabilities('video')?.codecs || [];
                const h264Codecs = codecs.filter(c => c.mimeType.toLowerCase() === 'video/h264');
                if (h264Codecs.length > 0) {
                  videoTransceiver.setCodecPreferences([...h264Codecs, ...codecs]);
                }
              }
            } catch (e) {
              console.error("Failed to set H264 codec preference:", e);
            }
          }
        });
      }

      // 3. Create Offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Wait for ICE gathering (WHIP standard requires sending candidates in SDP)
      await new Promise<void>((resolve) => {
        if (pc.iceGatheringState === 'complete') {
          resolve();
        } else {
          const checkState = () => {
            if (pc.iceGatheringState === 'complete') {
              pc.removeEventListener('icegatheringstatechange', checkState);
              resolve();
            }
          };
          pc.addEventListener('icegatheringstatechange', checkState);
          // Fallback timeout in case ICE takes too long
          setTimeout(() => {
            pc.removeEventListener('icegatheringstatechange', checkState);
            resolve();
          }, 2000);
        }
      });

      // 4. Send WHIP POST to MediaMTX
      const response = await fetch(`/external-whip/live_${id}/whip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/sdp' },
        body: pc.localDescription?.sdp,
      });

      if (!response.ok) {
        throw new Error('Failed to publish stream to Media Server');
      }

      const answerSdp = await response.text();
      
      if (pc.signalingState === 'closed') {
        throw new Error('WebRTC connection was closed before completing the handshake.');
      }

      await pc.setRemoteDescription(new RTCSessionDescription({
        type: 'answer',
        sdp: answerSdp
      }));

      // 5. Update Firebase state
      await liveClassService.start(id, adminUser.uid, 'in-house-stream');
      
      toast.success('We are LIVE on KVM Origin! 🔴');
      
      // Send welcome message
      setMessages([{
        name: 'System',
        text: 'Live Stream Started via WebRTC.',
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
      }]);
    } catch (e) {
      console.error('Stream start error:', e);
      setIsStreaming(false);
      toast.error('Failed to start stream.');
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
    }
  };

  const handleStopStream = async () => {
    if (!adminUser) return;
    try {
      await liveClassService.stop(id, adminUser.uid);
      setIsStreaming(false);
      
      if (pcRef.current) {
        // Send WHIP DELETE if we had the resource URL, but MediaMTX handles disconnects automatically when WebRTC connection drops
        pcRef.current.close();
        pcRef.current = null;
      }

      toast.success('Live Stream Stopped.');
    } catch (e) {
      toast.error('Failed to stop stream.');
    }
  };

  const sendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setMessages([...messages, {
      name: 'Host (You)',
      text: chatInput,
      time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    }]);
    setChatInput('');
  };

  if (!session) {
    return <div className="flex h-screen items-center justify-center">Loading Studio...</div>;
  }

  return (
    <div className="flex h-[calc(100vh-100px)] gap-6 p-4 bg-gray-50 rounded-xl">
      {/* LEFT SIDE: VIDEO & CONTROLS */}
      <div className="flex-1 flex flex-col gap-4">
        
        <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{session.title}</h1>
            <p className="text-sm text-gray-500">Live Studio Environment</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">
              <Users size={16} />
              <span className="text-sm font-medium">0 Viewers</span>
            </div>
            {isStreaming ? (
              <div className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-1.5 rounded-lg border border-red-200 font-bold animate-pulse">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
                LIVE
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-gray-100 text-gray-500 px-4 py-1.5 rounded-lg border border-gray-200 font-bold">
                OFFLINE
              </div>
            )}
          </div>
        </div>

        {/* Video Player Area */}
        <div className="flex-1 bg-black rounded-xl overflow-hidden relative flex items-center justify-center shadow-inner">
          {!isCameraOn && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-gray-900">
              <div className="text-center text-gray-400">
                <CameraOff size={48} className="mx-auto mb-2 opacity-50" />
                <p>Camera is turned off</p>
              </div>
            </div>
          )}
          
          <video 
            ref={videoRef}
            autoPlay 
            playsInline 
            muted // Muted locally to prevent echo
            className="w-full h-full object-cover"
          />

          {/* Quick Stats Overlay */}
          {isStreaming && (
            <div className="absolute top-4 left-4 flex gap-2">
              <div className="bg-black/60 backdrop-blur text-white text-xs px-2.5 py-1.5 rounded flex items-center gap-1 font-mono">
                <Activity size={14} className="text-blue-400" />
                {networkStats.resolution} @ {networkStats.fps}fps
              </div>
              <div className={`bg-black/60 backdrop-blur text-xs px-2.5 py-1.5 rounded flex items-center gap-1 font-mono ${networkStats.status.includes('Poor') ? 'text-red-400' : 'text-green-400'}`}>
                <ArrowUpRight size={14} />
                {networkStats.bitrate}
              </div>
            </div>
          )}
        </div>

        {/* Controls Bar */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div className="flex gap-2">
            <button 
              onClick={toggleMic}
              className={`p-3 rounded-full transition-colors ${isMicOn ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' : 'bg-red-100 hover:bg-red-200 text-red-600'}`}
            >
              {isMicOn ? <Mic size={20} /> : <MicOff size={20} />}
            </button>
            <button 
              onClick={toggleCamera}
              className={`p-3 rounded-full transition-colors ${isCameraOn ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' : 'bg-red-100 hover:bg-red-200 text-red-600'}`}
            >
              {isCameraOn ? <Camera size={20} /> : <CameraOff size={20} />}
            </button>
            <button className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors">
              <MonitorUp size={20} />
            </button>
            <button className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors">
              <Settings size={20} />
            </button>
          </div>

          <div>
            {!isStreaming ? (
              <button 
                onClick={handleStartStream}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-semibold transition-all shadow-lg shadow-blue-200"
              >
                <Play size={18} fill="currentColor" />
                Go Live
              </button>
            ) : (
              <button 
                onClick={handleStopStream}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full font-semibold transition-all shadow-lg shadow-red-200"
              >
                <StopCircle size={18} />
                End Stream
              </button>
            )}
          </div>
        </div>

      </div>

      {/* RIGHT SIDE: MONITORING & CHAT */}
      <div className="w-80 flex flex-col gap-4">
        
        {/* Network Monitor */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity size={18} className="text-blue-600" />
              <h2 className="font-semibold text-gray-800">Traffic Monitor</h2>
            </div>
            {isStreaming && <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>}
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Status</span>
              <span className={`font-medium ${networkStats.status.includes('Poor') ? 'text-red-600' : networkStats.status === 'Idle' ? 'text-gray-500' : 'text-green-600'}`}>
                {networkStats.status}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Uplink (Out)</span>
              <span className="font-mono text-gray-900">{networkStats.bitrate}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Total Data</span>
              <span className="font-mono text-gray-900">{networkStats.totalData}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Packets Sent</span>
              <span className="font-mono text-gray-900">{networkStats.packetsSent}</span>
            </div>
          </div>
        </div>

        {/* Live Chat */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center gap-2">
            <MessageSquare size={18} className="text-gray-500" />
            <h2 className="font-semibold text-gray-800">Live Chat</h2>
          </div>
        
        <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3">
          {messages.length === 0 ? (
            <div className="text-center text-gray-400 text-sm mt-10">
              No messages yet.<br/>Say hello to your students!
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className="flex flex-col">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-bold text-gray-700">{msg.name}</span>
                  <span className="text-[10px] text-gray-400">{msg.time}</span>
                </div>
                <p className="text-sm text-gray-800 bg-gray-50 p-2 rounded-lg mt-1 border border-gray-100">
                  {msg.text}
                </p>
              </div>
            ))
          )}
        </div>

        <form onSubmit={sendChatMessage} className="p-3 border-t border-gray-100 flex gap-2">
          <input 
            type="text" 
            placeholder="Type a message..." 
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          />
          <button 
            type="submit"
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
      </div>
    </div>
  );
}
