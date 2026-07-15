'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';
import { ImageUpload } from '@/components/admin/ImageUpload';

export default function SettingsPage() {
  const { adminUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [building, setBuilding] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'app_config', 'branding');
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          setLogoUrl(snapshot.data().logoUrl || '');
        }
      } catch (error) {
        console.error('Error fetching branding settings:', error);
        toast.error('Failed to load branding settings');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    if (!adminUser) return;
    
    setSaving(true);
    try {
      const docRef = doc(db, 'app_config', 'branding');
      await setDoc(docRef, {
        logoUrl,
        updatedBy: adminUser.email,
        createdBy: adminUser.email, // In case it's created for the first time
        updatedAt: serverTimestamp(),
      }, { merge: true });
      
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleBuildApk = async () => {
    if (!logoUrl) {
      toast.error('Please upload and save a logo first.');
      return;
    }
    
    if (!confirm('Are you sure you want to trigger a remote APK build? This process will take 5-10 minutes on GitHub Actions.')) return;
    
    setBuilding(true);
    try {
      const triggerApkBuild = httpsCallable(functions, 'triggerApkBuild');
      await triggerApkBuild({
        appIconUrl: logoUrl,
        notificationIconUrl: logoUrl,
      });
      toast.success('Build triggered successfully! Check GitHub Actions for progress.');
    } catch (error: any) {
      console.error('Build trigger failed:', error);
      toast.error(error.message || 'Failed to trigger build');
    } finally {
      setBuilding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings & Branding</h1>
        <p className="text-sm text-gray-500">Manage app-wide branding assets</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">App Logo</h2>
          <p className="text-sm text-gray-600 mb-4">
            Upload the main logo for your app. This logo will appear on the splash screen, 
            dashboard headers, and various other places within the mobile app.
          </p>
          
          <div className="max-w-md">
            <ImageUpload
              value={logoUrl}
              onChange={(url) => setLogoUrl(url)}
              storagePath="branding"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
      
      <div className="mt-8 bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-blue-900">Generate Native App Build (APK)</h3>
            <div className="mt-2 text-sm text-blue-800 space-y-2">
              <p>
                To apply this logo as your <b>Home Screen App Icon</b> and <b>Push Notification Icon</b>, 
                we must compile a completely new APK via our automated CI/CD pipeline on GitHub.
              </p>
              <p>
                Clicking the button below will securely send your logo to the build server and generate a new APK automatically.
              </p>
            </div>
          </div>
          <button
            onClick={handleBuildApk}
            disabled={building || !logoUrl}
            className="flex-shrink-0 flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-md disabled:opacity-50 font-medium"
          >
            {building ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            {building ? 'Triggering Build...' : '🚀 Generate New APK'}
          </button>
        </div>
      </div>
    </div>
  );
}
