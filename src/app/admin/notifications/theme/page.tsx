'use client';

import { useState, useEffect } from 'react';
import { Save, Send, Loader2, AlertCircle, CheckCircle2, Smartphone, AppWindow, Bell, Info, RotateCcw } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, collection, addDoc, Timestamp } from 'firebase/firestore';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { normalizeMediaUrl } from '@/lib/media';

const DEFAULT_THEME = {
  // In-App Theme
  appBarColor: '#FFFFFF',
  appBarTitleColor: '#172033',
  appBarIconColor: '#172033',
  backgroundColor: '#F7F8FC',
  backgroundImageUrl: '',
  cardColor: '#FFFFFF',
  textColorPrimary: '#1B2430',
  textColorSecondary: '#5A677B',
  // Push Theme
  pushBackgroundColor: '#1C1C1E',
  pushBackgroundImageUrl: '',
  pushIconColor: '#4F46E5',
  pushTextColorPrimary: '#F9FAFB',
  pushTextColorSecondary: '#9CA3AF',
};

export default function NotificationStudioPage() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [themeStatus, setThemeStatus] = useState<{ type: 'success' | 'error' | null; msg: string }>({ type: null, msg: '' });
  const [sendStatus, setSendStatus] = useState<{ type: 'success' | 'error' | null; msg: string }>({ type: null, msg: '' });

  // Theme State
  const [theme, setTheme] = useState(DEFAULT_THEME);

  // Send Notification State
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [targetScreen, setTargetScreen] = useState('');
  const [sendPush, setSendPush] = useState(true);
  const [sendInApp, setSendInApp] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    async function loadTheme() {
      try {
        const docRef = doc(db, 'app_config', 'notification_theme');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setTheme(prev => ({ ...prev, ...docSnap.data() }));
        }
      } catch (error) {
        console.error("Error loading theme", error);
      } finally {
        setFetching(false);
      }
    }
    loadTheme();
  }, []);

  const handleChange = (field: string, value: string) => {
    setTheme(prev => ({ ...prev, [field]: value }));
  };

  const handleResetDefaults = () => {
    if (confirm('Are you sure you want to reset all theme colors to default?')) {
      setTheme(DEFAULT_THEME);
    }
  };

  const handleSaveTheme = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setThemeStatus({ type: null, msg: '' });

    try {
      const docRef = doc(db, 'app_config', 'notification_theme');
      await setDoc(docRef, { ...theme, updatedBy: 'admin', createdBy: 'admin' }, { merge: true });
      setThemeStatus({ type: 'success', msg: 'Theme updated successfully! Changes saved.' });
    } catch (error: any) {
      setThemeStatus({ type: 'error', msg: error.message || 'Failed to save theme.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return;
    if (!sendPush && !sendInApp) {
      setSendStatus({ type: 'error', msg: 'Please select at least one notification method (Push or In-App).' });
      return;
    }

    setSending(true);
    setSendStatus({ type: null, msg: '' });

    try {
      await addDoc(collection(db, 'notifications'), {
        title,
        message,
        imageUrl: imageUrl || '',
        targetScreen: targetScreen || '',
        icon: 'notifications_none_rounded',
        iconColor: parseInt(theme.appBarIconColor.replace('#', '0xFF'), 16),
        backgroundColor: parseInt(theme.cardColor.replace('#', '0xFF'), 16),
        sendPush: sendPush,
        sendInApp: sendInApp,
        pushIconColor: theme.pushIconColor, 
        pushBackgroundColor: theme.pushBackgroundColor,
        pushBackgroundImageUrl: theme.pushBackgroundImageUrl,
        pushTextColorPrimary: theme.pushTextColorPrimary,
        pushTextColorSecondary: theme.pushTextColorSecondary,
        createdAt: Timestamp.now(),
      });

      setSendStatus({ type: 'success', msg: 'Notification scheduled successfully!' });
      setTitle('');
      setMessage('');
      setImageUrl('');
      setTargetScreen('');
    } catch (error: any) {
      console.error('Error sending notification:', error);
      setSendStatus({ type: 'error', msg: error.message || 'Failed to send notification.' });
    } finally {
      setSending(false);
    }
  };

  if (fetching) return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Notification Studio</h1>
        <p className="text-gray-600 mt-2">Draft notifications and customize how they look in the app.</p>
      </div>

      <div className="flex flex-col xl:flex-row gap-8">
        
        {/* LEFT COLUMN: Controls */}
        <div className="flex-1 space-y-8">
          
          {/* SECTION 1: SEND NOTIFICATION */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Send className="w-5 h-5 text-blue-600" /> Draft & Send Notification
            </h2>
            
            <form onSubmit={handleSendNotification} className="space-y-6">
              {sendStatus.type === 'success' && (
                <div className="bg-green-50 text-green-700 p-4 rounded-lg flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5" />
                  <p>{sendStatus.msg}</p>
                </div>
              )}
              {sendStatus.type === 'error' && (
                <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center gap-3">
                  <AlertCircle className="w-5 h-5" />
                  <p>{sendStatus.msg}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div 
                  className={`border rounded-xl p-4 cursor-pointer transition-all ${sendPush ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-200 bg-white hover:border-blue-200'}`}
                  onClick={() => setSendPush(!sendPush)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Smartphone className={`w-6 h-6 ${sendPush ? 'text-blue-600' : 'text-gray-400'}`} />
                      <div>
                        <h3 className={`font-semibold ${sendPush ? 'text-blue-900' : 'text-gray-700'}`}>Push Notification</h3>
                        <p className="text-[10px] text-gray-500 leading-tight">Shows on Lock Screen</p>
                      </div>
                    </div>
                    <div className={`w-10 h-6 rounded-full transition-colors ${sendPush ? 'bg-blue-600' : 'bg-gray-200'} relative`}>
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${sendPush ? 'left-5' : 'left-1'}`}></div>
                    </div>
                  </div>
                </div>

                <div 
                  className={`border rounded-xl p-4 cursor-pointer transition-all ${sendInApp ? 'border-green-500 bg-green-50 ring-1 ring-green-500' : 'border-gray-200 bg-white hover:border-green-200'}`}
                  onClick={() => setSendInApp(!sendInApp)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AppWindow className={`w-6 h-6 ${sendInApp ? 'text-green-600' : 'text-gray-400'}`} />
                      <div>
                        <h3 className={`font-semibold ${sendInApp ? 'text-green-900' : 'text-gray-700'}`}>In-App Notification</h3>
                        <p className="text-[10px] text-gray-500 leading-tight">Shows in Notification List</p>
                      </div>
                    </div>
                    <div className={`w-10 h-6 rounded-full transition-colors ${sendInApp ? 'bg-green-600' : 'bg-gray-200'} relative`}>
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${sendInApp ? 'left-5' : 'left-1'}`}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notification Title</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Notification Message</label>
                <textarea
                  required
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="e.g., Thermodynamics starts in 30 mins. Join now!"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-blue-500 focus:border-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notification Image (Optional)</label>
                <p className="text-[11px] text-gray-500 mb-2">This image will be sent as the large banner/thumbnail for the notification.</p>
                <ImageUpload value={imageUrl} onChange={setImageUrl} storagePath="notifications" />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={sending || !title || !message || (!sendPush && !sendInApp)}
                  className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium w-full sm:w-auto justify-center"
                >
                  {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  {sending ? 'Sending...' : 'Send Notification'}
                </button>
              </div>
            </form>
          </div>

          {/* SECTION 2: THEME CUSTOMIZER */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span className="w-5 h-5 flex items-center justify-center bg-indigo-100 rounded text-indigo-600">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                </span>
                Theme Customization
              </h2>
              <button
                type="button"
                onClick={handleResetDefaults}
                className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-md"
              >
                <RotateCcw className="w-4 h-4" /> Reset Default
              </button>
            </div>

            <form onSubmit={handleSaveTheme}>
              {themeStatus.type === 'success' && (
                <div className="bg-green-50 text-green-700 p-4 rounded-lg flex items-center gap-3 mb-6">
                  <CheckCircle2 className="w-5 h-5" />
                  <p>{themeStatus.msg}</p>
                </div>
              )}
              {themeStatus.type === 'error' && (
                <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center gap-3 mb-6">
                  <AlertCircle className="w-5 h-5" />
                  <p>{themeStatus.msg}</p>
                </div>
              )}

              {/* TABS (Visual only for grouping) */}
              <div className="space-y-8">
                
                {/* IN-APP THEME */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">1. In-App Notification Theme</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <ColorPicker label="App Bar Background" value={theme.appBarColor} onChange={(val) => handleChange('appBarColor', val)} />
                    <ColorPicker label="App Bar Title Text" value={theme.appBarTitleColor} onChange={(val) => handleChange('appBarTitleColor', val)} />
                    <ColorPicker label="App Bar Icons" value={theme.appBarIconColor} onChange={(val) => handleChange('appBarIconColor', val)} />
                    <ColorPicker label="Page Background Color" value={theme.backgroundColor} onChange={(val) => handleChange('backgroundColor', val)} />
                    <ColorPicker label="Notification Card Color" value={theme.cardColor} onChange={(val) => handleChange('cardColor', val)} />
                    <ColorPicker label="Primary Text Color" value={theme.textColorPrimary} onChange={(val) => handleChange('textColorPrimary', val)} />
                    <ColorPicker label="Secondary Text Color" value={theme.textColorSecondary} onChange={(val) => handleChange('textColorSecondary', val)} />
                  </div>

                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Festival/Event Background Image</h4>
                    <p className="text-xs text-gray-500 mb-3">Upload an image or GIF to show as the full background of the in-app notification screen.</p>
                    <ImageUpload value={theme.backgroundImageUrl} onChange={(val) => handleChange('backgroundImageUrl', val)} storagePath="app_themes" />
                  </div>
                </div>

                {/* PUSH THEME */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">2. Push Notification Theme</h3>
                  
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4 text-sm text-blue-800 flex gap-3 items-start">
                    <Info className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-600" />
                    <div>
                      Customize the base colors and background for your push notifications. Make sure your Flutter app uses custom layouts to support these properties fully.
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <ColorPicker label="Push Background Color" value={theme.pushBackgroundColor} onChange={(val) => handleChange('pushBackgroundColor', val)} />
                    <ColorPicker label="Push Icon Tint Color" value={theme.pushIconColor} onChange={(val) => handleChange('pushIconColor', val)} />
                    <ColorPicker label="Push Title Color" value={theme.pushTextColorPrimary} onChange={(val) => handleChange('pushTextColorPrimary', val)} />
                    <ColorPicker label="Push Message Color" value={theme.pushTextColorSecondary} onChange={(val) => handleChange('pushTextColorSecondary', val)} />
                  </div>

                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Push Notification Background Image</h4>
                    <p className="text-xs text-gray-500 mb-3">Upload an image or GIF to show as the full background of the Push Notification popup on the lock screen.</p>
                    <ImageUpload value={theme.pushBackgroundImageUrl || ''} onChange={(val) => handleChange('pushBackgroundImageUrl', val)} storagePath="app_themes" />
                  </div>
                </div>

              </div>

              <div className="flex justify-end pt-6 border-t mt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-md hover:bg-indigo-700 disabled:opacity-50 font-medium w-full sm:w-auto justify-center"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  {loading ? 'Saving Themes...' : 'Save Themes'}
                </button>
              </div>
            </form>
          </div>

        </div>

        {/* RIGHT COLUMN: Unified Live Preview */}
        <div className="w-full xl:w-[400px] flex-shrink-0 sticky top-6 space-y-6">
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
              </span>
              Live Delivery Preview
            </h3>
            <p className="text-xs text-gray-500 mt-1">See exactly how users will receive your alert.</p>
          </div>

          {!sendPush && !sendInApp && (
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-10 text-center">
              <Bell className="w-10 h-10 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 text-sm">Select a delivery method to preview.</p>
            </div>
          )}

          {/* Android Push Preview (Floating above) */}
          {sendPush && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex items-center gap-2 mb-2 ml-1">
                <Smartphone className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Lock Screen Push</span>
              </div>
              <div 
                className="rounded-[24px] p-4 shadow-2xl relative overflow-hidden ring-1 ring-black/5 min-h-[100px]"
                style={{ backgroundColor: theme.pushBackgroundColor }}
              >
                {theme.pushBackgroundImageUrl && (
                  <div 
                    className="absolute inset-0 bg-cover bg-center opacity-80"
                    style={{ backgroundImage: `url(${theme.pushBackgroundImageUrl})` }}
                  />
                )}

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-5 h-5 rounded flex items-center justify-center shadow-sm"
                        style={{ backgroundColor: theme.pushIconColor }}
                      >
                        <span className="text-[10px] font-bold text-white drop-shadow-md">N</span>
                      </div>
                      <span 
                        className="text-[11px] tracking-wide font-medium drop-shadow-md"
                        style={{ color: theme.pushTextColorSecondary, opacity: 0.9 }}
                      >
                        Narmadanchal • now
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <h4 
                        className="font-semibold text-[15px] leading-tight drop-shadow-md"
                        style={{ color: theme.pushTextColorPrimary }}
                      >
                        {title || <span style={{ opacity: 0.7 }}>Notification Title</span>}
                      </h4>
                      <p 
                        className="text-[13.5px] mt-1.5 leading-snug line-clamp-3 drop-shadow-md font-medium"
                        style={{ color: theme.pushTextColorSecondary }}
                      >
                        {message || <span style={{ opacity: 0.7 }}>The notification message will appear here...</span>}
                      </p>
                    </div>
                    {imageUrl && (
                      <div className="w-14 h-14 rounded-xl bg-gray-800 overflow-hidden flex-shrink-0 shadow-md border border-gray-700/50">
                        <img src={normalizeMediaUrl(imageUrl)} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Flutter App Theme Preview */}
          {sendInApp && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="flex items-center gap-2 mb-2 ml-1 mt-6">
                <AppWindow className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">In-App Screen</span>
              </div>
              
              <div 
                className="relative w-full aspect-[9/18] max-h-[650px] border-[10px] border-gray-900 rounded-[2.5rem] overflow-hidden shadow-2xl mx-auto"
                style={{ backgroundColor: theme.backgroundColor }}
              >
                {theme.backgroundImageUrl && (
                  <div 
                    className="absolute inset-0 bg-cover bg-center opacity-90 transition-all duration-300"
                    style={{ backgroundImage: `url(${theme.backgroundImageUrl})` }}
                  />
                )}
                
                <div className="relative z-10 flex flex-col h-full">
                  {/* Fake Status Bar */}
                  <div className="h-7 w-full flex justify-between items-center px-6" style={{ backgroundColor: theme.appBarColor }}>
                    <span className="text-[10px] font-medium" style={{ color: theme.appBarIconColor }}>9:41</span>
                    <div className="flex gap-1">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.appBarIconColor }}></div>
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.appBarIconColor }}></div>
                    </div>
                  </div>

                  {/* App Bar */}
                  <div className="px-5 py-3 flex justify-between items-center shadow-sm" style={{ backgroundColor: theme.appBarColor }}>
                    <div className="flex items-center gap-3">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={theme.appBarIconColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                      <span className="font-extrabold text-xl tracking-tight" style={{ color: theme.appBarTitleColor }}>Notifications</span>
                    </div>
                    <span className="text-xs font-bold" style={{ color: theme.appBarIconColor, opacity: 0.8 }}>Clear All</span>
                  </div>

                  {/* Notifications List */}
                  <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                    {/* Draft Preview Item */}
                    {(title || message) && (
                      <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-500"></div>
                        <NotificationPreviewCard 
                          theme={theme} 
                          title={title || "Notification Title"} 
                          message={message || "Message preview..."} 
                          time="Just now" 
                          iconColor="#3B82F6" 
                          iconBg="#DBEAFE" 
                          image={imageUrl}
                        />
                      </div>
                    )}

                    {/* Dummy Past Notifications */}
                    <NotificationPreviewCard theme={theme} title="Happy Diwali! 🪔" message="Get 50% off on all UPSC courses this festive season. Use code DIWALI50." time="10:30 AM" iconColor="#F59E0B" iconBg="#FEF3C7" />
                    <NotificationPreviewCard theme={theme} title="Live Class Started" message="Thermodynamics Part 2 has started. Join now to not miss anything!" time="Yesterday" iconColor="#10B981" iconBg="#D1FAE5" />
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function NotificationPreviewCard({ theme, title, message, time, iconColor, iconBg, image }: any) {
  return (
    <div 
      className="relative p-4 rounded-2xl flex gap-4 shadow-sm border transition-all duration-300 bg-opacity-95"
      style={{ 
        backgroundColor: theme.cardColor, 
        borderColor: `${theme.textColorSecondary}15`,
        boxShadow: `0 4px 12px ${theme.appBarIconColor}05` 
      }}
    >
      <div 
        className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: iconBg }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-[14.5px] leading-tight tracking-tight truncate" style={{ color: theme.textColorPrimary }}>{title}</h4>
        <p className="text-[13px] mt-1.5 leading-snug font-medium" style={{ color: theme.textColorSecondary }}>{message}</p>
        
        {image && (
          <div className="mt-3 rounded-xl overflow-hidden h-32 w-full bg-gray-100 border border-black/5">
            <img src={normalizeMediaUrl(image)} alt="" className="w-full h-full object-cover" />
          </div>
        )}

        <div className="flex items-center gap-1 mt-2.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={theme.textColorSecondary} strokeWidth="2" opacity="0.6"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span className="text-[10px] font-semibold tracking-wide" style={{ color: theme.textColorSecondary, opacity: 0.7 }}>{time}</span>
        </div>
      </div>
    </div>
  )
}

function ColorPicker({ label, value, onChange }: { label: string; value: string; onChange: (val: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">{label}</label>
      <div className="flex gap-2 items-center">
        <div className="relative">
          <input 
            type="color" 
            value={value} 
            onChange={(e) => onChange(e.target.value)} 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div 
            className="h-10 w-12 rounded-lg border shadow-sm transition-all"
            style={{ backgroundColor: value, borderColor: value === '#FFFFFF' ? '#E5E7EB' : `${value}40` }}
          ></div>
        </div>
        <input 
          type="text" 
          value={value} 
          onChange={(e) => onChange(e.target.value)} 
          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-gray-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-gray-50 hover:bg-white uppercase font-mono text-sm transition-colors"
        />
      </div>
    </div>
  );
}
