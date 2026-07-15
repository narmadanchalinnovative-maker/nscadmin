'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';

export default function SupportSettingsPage() {
  const { adminUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    whatsapp: '',
    phone: '',
    email: '',
    telegram: '',
  });

  useEffect(() => {
    fetchSupportSettings();
  }, []);

  const fetchSupportSettings = async () => {
    try {
      const docRef = doc(db, 'app_config', 'support');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setFormData({
          whatsapp: data.whatsapp || '',
          phone: data.phone || '',
          email: data.email || '',
          telegram: data.telegram || '',
        });
      }
    } catch (error) {
      console.error('Error fetching support settings:', error);
      toast.error('Failed to load support settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const docRef = doc(db, 'app_config', 'support');
      const payload = {
        ...formData,
        updatedBy: adminUser?.email || 'admin@example.com',
        createdBy: adminUser?.email || 'admin@example.com',
      };
      await setDoc(docRef, payload, { merge: true });
      toast.success('Support settings updated successfully');
    } catch (error) {
      console.error('Error saving support settings:', error);
      toast.error('Failed to save support settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Support Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage the contact details displayed in the mobile app support screen.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700">
              WhatsApp Number
            </label>
            <div className="mt-1">
              <input
                type="text"
                name="whatsapp"
                id="whatsapp"
                value={formData.whatsapp}
                onChange={handleChange}
                placeholder="e.g. +918000000000"
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">Include country code. Used for the WhatsApp button.</p>
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <div className="mt-1">
              <input
                type="text"
                name="phone"
                id="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="e.g. +919000000000"
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">Used for direct phone calls.</p>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <div className="mt-1">
              <input
                type="email"
                name="email"
                id="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="e.g. support@nscclasses.com"
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
              />
            </div>
          </div>

          <div>
            <label htmlFor="telegram" className="block text-sm font-medium text-gray-700">
              Telegram Link
            </label>
            <div className="mt-1">
              <input
                type="url"
                name="telegram"
                id="telegram"
                value={formData.telegram}
                onChange={handleChange}
                placeholder="e.g. https://t.me/nscclasses"
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={saving}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
