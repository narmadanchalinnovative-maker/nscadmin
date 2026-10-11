import { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, Timestamp, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { sendDoubtMessage, uploadChatMedia } from '@/lib/firestore-service';
import { useAuth } from '@/lib/auth-context';
import { X, Send, Image as ImageIcon, Video, Loader2, PlayCircle } from 'lucide-react';
import { toast } from 'sonner';
import { normalizeMediaUrl } from '@/lib/media';

interface Message {
  id: string;
  text: string;
  mediaUrl?: string | null;
  mediaType?: 'image' | 'video' | null;
  senderId: string;
  senderName: string;
  createdAt: any;
}

export default function AdminDoubtChatModal({ doubt, onClose }: { doubt: any, onClose: () => void }) {
  const { adminUser } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isVideo, setIsVideo] = useState(false);

  useEffect(() => {
    if (!doubt?.id) return;
    updateDoc(doc(db, 'doubts', doubt.id), { hasUnreadAdmin: false }).catch(console.error);
    const q = query(
      collection(db, 'doubts', doubt.id, 'messages'),
      orderBy('createdAt', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message)));
      setTimeout(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }, 100);
    });
    return () => unsubscribe();
  }, [doubt?.id]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!text.trim()) return;
    try {
      const msg = text;
      setText('');
      await sendDoubtMessage(doubt.id, msg, undefined, undefined, adminUser?.email?.split('@')[0] || 'Admin');
    } catch (err) {
      toast.error('Failed to send message');
      setText(text);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = '';

    setUploading(true);
    try {
      const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
      const url = await uploadChatMedia(doubt.id, file);
      await sendDoubtMessage(doubt.id, '', url, mediaType, adminUser?.email?.split('@')[0] || 'Admin');
    } catch (err) {
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const triggerFilePick = (video: boolean) => {
    setIsVideo(video);
    if (fileInputRef.current) {
      fileInputRef.current.accept = video ? 'video/*' : 'image/*';
      fileInputRef.current.click();
    }
  };

  if (!doubt) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl h-[80vh] rounded-2xl shadow-xl flex flex-col overflow-hidden m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-slate-50">
          <div>
            <h3 className="font-semibold text-gray-900">Chat with {doubt.userName || 'Student'}</h3>
            <p className="text-xs text-gray-500">{doubt.subjectName} - {doubt.lectureName}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Original Doubt */}
        <div className="p-4 bg-amber-50 border-b border-amber-100">
          <p className="text-sm font-medium text-amber-800">Original Doubt:</p>
          <p className="text-sm text-amber-900 mt-1">{doubt.doubtText}</p>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              No messages yet. Send a reply!
            </div>
          ) : (
            messages.map((msg) => {
              const isAdmin = msg.senderId === 'admin' || msg.senderId === adminUser?.uid;
              return (
                <div key={msg.id} className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                  <div className={`text-xs text-gray-500 mb-1 px-1 ${isAdmin ? 'hidden' : 'block'}`}>
                    {msg.senderName}
                  </div>
                  <div className={`max-w-[75%] rounded-2xl p-3 shadow-sm ${isAdmin ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-red-500 text-white rounded-tl-sm border border-red-600'}`}>
                    
                    {msg.mediaUrl && msg.mediaType === 'image' && (
                      <a href={normalizeMediaUrl(msg.mediaUrl)} target="_blank" rel="noreferrer">
                        <img src={normalizeMediaUrl(msg.mediaUrl)} alt="attachment" className="rounded-lg mb-2 max-h-48 object-cover" />
                      </a>
                    )}

                    {msg.mediaUrl && msg.mediaType === 'video' && (
                      <a href={normalizeMediaUrl(msg.mediaUrl)} target="_blank" rel="noreferrer" className="block relative bg-black rounded-lg mb-2 h-32 w-48 flex items-center justify-center hover:opacity-90 transition-opacity">
                        <PlayCircle className="w-10 h-10 text-white" />
                      </a>
                    )}

                    {msg.text && <p className="text-sm whitespace-pre-wrap">{msg.text}</p>}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1 px-1">
                    {msg.createdAt?.toDate ? new Date(msg.createdAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input Area */}
        <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100 flex items-end gap-2">
          <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
          
          <div className="flex gap-1 pb-1">
            <button type="button" onClick={() => triggerFilePick(false)} disabled={uploading} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors disabled:opacity-50">
              <ImageIcon className="w-5 h-5" />
            </button>
            <button type="button" onClick={() => triggerFilePick(true)} disabled={uploading} className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-colors disabled:opacity-50">
              <Video className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 bg-gray-50 rounded-xl border border-gray-200 overflow-hidden focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 transition-all">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type a reply..."
              className="w-full bg-transparent border-none focus:ring-0 text-sm px-4 py-3 text-gray-900"
            />
          </div>

          {uploading ? (
            <div className="p-3 text-blue-600">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : (
            <button type="submit" disabled={!text.trim()} className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:hover:bg-blue-600">
              <Send className="w-5 h-5" />
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
