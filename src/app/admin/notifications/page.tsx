'use client';

import { useState } from 'react';
import { Send, Loader2, AlertCircle, CheckCircle2, Smartphone, AppWindow, Bell } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { ImageUpload } from '@/components/admin/ImageUpload';

export default function NotificationsPage() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [targetScreen, setTargetScreen] = useState('');
  const [sendPush, setSendPush] = useState(true);
  const [sendInApp, setSendInApp] = useState(true);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; msg: string }>({ type: null, msg: '' });

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return;
    if (!sendPush && !sendInApp) {
      setStatus({ type: 'error', msg: 'Please select at least one notification method (Push or In-App).' });
      return;
    }

    setLoading(true);
    setStatus({ type: null, msg: '' });

    try {
      const API_BASE = '/external-notifications';
      const response = await fetch(`${API_BASE}/admin/notifications/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          title,
          message,
          imageUrl,
          targetScreen,
          sendPush,
          sendInApp
        })
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to send notification');
      }

      setStatus({ type: 'success', msg: 'Notification sent successfully!' });
      setTitle('');
      setMessage('');
      setImageUrl('');
      setTargetScreen('');
    } catch (error: any) {
      console.error('Error sending notification:', error);
      setStatus({ type: 'error', msg: error.message || 'Failed to send notification.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Push Notifications</h1>
          <p className="text-gray-600 mt-2">Draft and preview your notifications in real-time before sending.</p>
        </div>
        <a 
          href="/admin/notifications/theme" 
          className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-md hover:bg-indigo-100 transition-colors border border-indigo-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72"/><path d="m14 7 3 3"/><path d="M5 6v4"/><path d="M19 14v4"/><path d="M10 2v2"/><path d="M7 8H3"/><path d="M21 16h-4"/><path d="M11 22h-2"/></svg>
          Theme Customizer
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT COLUMN: FORM */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div 
                className={`border rounded-lg p-4 cursor-pointer transition-all ${sendPush ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-200'}`}
                onClick={() => setSendPush(!sendPush)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Smartphone className={`w-6 h-6 ${sendPush ? 'text-blue-600' : 'text-gray-400'}`} />
                    <div>
                      <h3 className={`font-semibold ${sendPush ? 'text-blue-900' : 'text-gray-700'}`}>Push Notification</h3>
                      <p className="text-[10px] text-gray-500 leading-tight">Shows on lock screen & system tray</p>
                    </div>
                  </div>
                  <div className={`w-10 h-6 rounded-full transition-colors ${sendPush ? 'bg-blue-600' : 'bg-gray-200'} relative`}>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${sendPush ? 'left-5' : 'left-1'}`}></div>
                  </div>
                </div>
              </div>

              <div 
                className={`border rounded-lg p-4 cursor-pointer transition-all ${sendInApp ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white hover:border-green-200'}`}
                onClick={() => setSendInApp(!sendInApp)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AppWindow className={`w-6 h-6 ${sendInApp ? 'text-green-600' : 'text-gray-400'}`} />
                    <div>
                      <h3 className={`font-semibold ${sendInApp ? 'text-green-900' : 'text-gray-700'}`}>In-App Notification</h3>
                      <p className="text-[10px] text-gray-500 leading-tight">Shows in the app's notification tab</p>
                    </div>
                  </div>
                  <div className={`w-10 h-6 rounded-full transition-colors ${sendInApp ? 'bg-green-600' : 'bg-gray-200'} relative`}>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${sendInApp ? 'left-5' : 'left-1'}`}></div>
                  </div>
                </div>
              </div>
            </div>

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
                Target Screen Route (Optional)
              </label>
              <select
                value={targetScreen}
                onChange={(e) => setTargetScreen(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">Default (App Home / Notification Details)</option>
                <option value="/dashboard-home">Home Dashboard</option>
                <option value="/profile-my-profile">My Profile</option>
                <option value="/my-courses-paid">My Paid Courses</option>
                <option value="/my-courses-free">My Free Courses</option>
                <option value="/batch-home">Batches Home</option>
                <option value="/live-classes">Live Classes</option>
                <option value="/tests-home">Tests Home</option>
                <option value="/my-history">My History</option>
                <option value="/my-downloads">My Downloads</option>
                <option value="/my-doubts">My Doubts</option>
                <option value="/search">Search Screen</option>
              </select>
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

            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button
                type="submit"
                disabled={loading || !title || !message || (!sendPush && !sendInApp)}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors w-full sm:w-auto justify-center shadow-sm"
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

        {/* RIGHT COLUMN: LIVE PREVIEW */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sticky top-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-indigo-600" /> Live Preview
            </h2>
            
            <div className="space-y-8 bg-gray-50 p-6 rounded-xl border border-gray-100">
              
              {!sendPush && !sendInApp && (
                <div className="text-center text-gray-400 py-10">
                  <Smartphone className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No delivery method selected.</p>
                </div>
              )}

              {/* PUSH PREVIEW */}
              {sendPush && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Push Notification (Lock Screen)</h3>
                  <div className="bg-[#1C1C1E] text-white rounded-[20px] p-4 w-full max-w-sm shadow-xl relative overflow-hidden transition-all duration-300 ease-out hover:scale-[1.02]">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-indigo-500 rounded flex items-center justify-center">
                          <span className="text-[10px] font-bold text-white">N</span>
                        </div>
                        <span className="text-xs text-gray-300 tracking-wide">Narmadanchal • now</span>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm text-gray-100 leading-tight">
                          {title || <span className="text-gray-500">Notification Title</span>}
                        </h4>
                        <p className="text-[13px] text-gray-400 mt-1.5 leading-snug line-clamp-3">
                          {message || <span className="text-gray-600">The notification message will appear here...</span>}
                        </p>
                      </div>
                      {imageUrl && (
                        <div className="w-14 h-14 rounded-lg bg-gray-800 overflow-hidden flex-shrink-0 shadow-sm border border-gray-700">
                          <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* IN-APP PREVIEW */}
              {sendInApp && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">In-App Notification (List View)</h3>
                  <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex gap-4 w-full max-w-sm transition-all duration-300 ease-out hover:shadow-md hover:border-gray-200">
                    <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 border border-blue-100">
                      <Bell className="w-6 h-6 text-blue-600 opacity-80" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 text-[15px] truncate">
                        {title || <span className="text-gray-400 font-normal">Notification Title</span>}
                      </h4>
                      <p className="text-gray-600 text-[13px] mt-1 leading-relaxed">
                        {message || <span className="text-gray-400">Detailed notification message appears here inside the app list.</span>}
                      </p>
                      {imageUrl && (
                        <div className="mt-3 rounded-xl overflow-hidden h-36 w-full bg-gray-50 border border-gray-100">
                          <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <p className="text-gray-400 text-[11px] mt-2.5 font-medium">Just now</p>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

