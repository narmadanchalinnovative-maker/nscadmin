'use client';

import { useState } from 'react';
import { Send, Loader2, AlertCircle, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '@/lib/firebase'; // ensure we import from your firebase setup
import { ImageUpload } from '@/components/admin/ImageUpload';

export default function NotificationsPage() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; msg: String }>({ type: null, msg: '' });

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return;

    setLoading(true);
    setStatus({ type: null, msg: '' });

    try {
      const functions = getFunctions();
      const sendGlobalNotification = httpsCallable(functions, 'sendGlobalNotification');
      
      const result = await sendGlobalNotification({ title, message, imageUrl });
      console.log('Function result:', result);

      setStatus({ type: 'success', msg: 'Notification sent successfully to all users!' });
      setTitle('');
      setMessage('');
      setImageUrl('');
    } catch (error: any) {
      console.error('Error sending notification:', error);
      setStatus({ type: 'error', msg: error.message || 'Failed to send notification.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Push Notifications</h1>
        <p className="text-gray-600 mt-2">Send global push notifications to all app users.</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSend} className="space-y-6">
          
          {status.type === 'success' && (
            <div className="bg-green-50 text-green-700 p-4 rounded-lg flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5" />
              <p>{status.msg}</p>
            </div>
          )}

          {status.type === 'error' && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5" />
              <p>{status.msg}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notification Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., New Live Class Scheduled!"
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-blue-500 focus:border-blue-500 bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notification Message
            </label>
            <textarea
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g., Thermodynamics starts in 30 mins. Join now!"
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-blue-500 focus:border-blue-500 bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notification Image (Optional)
            </label>
            <ImageUpload 
              value={imageUrl}
              onChange={setImageUrl}
              storagePath="notifications"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || !title || !message}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
              {loading ? 'Sending...' : 'Send Notification'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
