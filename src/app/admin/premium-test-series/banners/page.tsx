'use client';

import React, { useEffect, useState } from 'react';
import { premiumTestService } from '@/lib/services/premiumTests';
import { PremiumBanner } from '@/types';
import {
  Image as ImageIcon,
  Video,
  Plus,
  Trash2,
  Sparkles,
  Play,
  Layers,
  CheckCircle2,
  Eye,
  Film,
  Flame,
} from 'lucide-react';
import { toast } from 'sonner';

export default function PremiumBannersPage() {
  const [banners, setBanners] = useState<PremiumBanner[]>([]);
  const [loading, setLoading] = useState(true);

  // Live Preview Media Type
  const [previewTab, setPreviewTab] = useState<'video' | 'gif' | 'image'>('video');

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    mediaType: 'video' as 'video' | 'gif' | 'image',
    imageUrl: '',
    videoUrl: '',
    gifUrl: '',
    examGoal: 'SCHOOL EDUCATION',
    badgeText: 'PRO BUNDLE',
    order: 1,
    status: 'active' as 'active' | 'inactive',
  });

  useEffect(() => {
    loadBanners();
  }, []);

  async function loadBanners() {
    try {
      setLoading(true);
      const data = await premiumTestService.listBanners();
      setBanners(data || []);
      if (data && data.length > 0) {
        setPreviewTab(data[0].mediaType || 'video');
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load media banners');
    } finally {
      setLoading(false);
    }
  }

  const handleCreateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
      toast.error('Title is required!');
      return;
    }

    try {
      await premiumTestService.createBanner({
        title: formData.title,
        subtitle: formData.subtitle || undefined,
        mediaType: formData.mediaType,
        imageUrl: formData.imageUrl || 'http://201.18.192.154:3001/uploads/banner_AyRDLxbDewLRWi6bJMPd.png',
        videoUrl: formData.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        gifUrl: formData.gifUrl || 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM2QzZTllOTgzYzExMzg2MzY1Yzg2NGQzZTgyYjc4OGQ3Yzg2NjM5NyZlcD12MV9pbnRlcm5hbF9naWZzX2dpZklkJmN0PWc/xT9IgzoKnwFNmISR8I/giphy.gif',
        examGoal: formData.examGoal,
        badgeText: formData.badgeText || 'PRO BUNDLE',
        order: Number(formData.order) || 1,
        status: formData.status,
      });

      toast.success('Media Banner created successfully!');
      setShowAddModal(false);
      setFormData({
        title: '',
        subtitle: '',
        mediaType: 'video',
        imageUrl: '',
        videoUrl: '',
        gifUrl: '',
        examGoal: 'SCHOOL EDUCATION',
        badgeText: 'PRO BUNDLE',
        order: 1,
        status: 'active',
      });
      loadBanners();
    } catch (e: any) {
      toast.error(e.message || 'Failed to create banner');
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;
    try {
      await premiumTestService.deleteBanner(id);
      toast.success('Banner deleted');
      loadBanners();
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete banner');
    }
  };

  const activeBanner = banners.find((b) => b.mediaType === previewTab) || banners[0];

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Film className="w-5 h-5 text-amber-500" />
            <span>Multi-Format Media Banners</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              {banners.length} banners
            </span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Configure intro video teasers, animated GIFs, and posters for student app top carousel.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold text-xs sm:text-sm shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Media Banner</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Mobile App 16:9 Banner Preview */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-blue-500" />
              <span>Live App Simulation (16:9)</span>
            </h3>
            <span className="text-[11px] text-amber-600 font-semibold">Zero-Crop Ratio</span>
          </div>

          <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 shadow-xl text-white">
            {/* Tabs preview */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-1.5 overflow-x-auto">
                <button
                  onClick={() => setPreviewTab('video')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    previewTab === 'video'
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  🎬 Intro Video
                </button>
                <button
                  onClick={() => setPreviewTab('gif')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    previewTab === 'gif'
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  ✨ Teaser GIF
                </button>
                <button
                  onClick={() => setPreviewTab('image')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    previewTab === 'image'
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  🖼️ Poster
                </button>
              </div>

              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-500 text-slate-950">
                {activeBanner?.badgeText || 'PRO BUNDLE'}
              </span>
            </div>

            {/* 16:9 Media Display */}
            <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center">
              {previewTab === 'video' ? (
                <div className="w-full h-full relative flex items-center justify-center bg-slate-900">
                  <video
                    src={activeBanner?.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'}
                    controls
                    className="w-full h-full object-cover"
                    poster={activeBanner?.imageUrl || undefined}
                  />
                </div>
              ) : previewTab === 'gif' ? (
                <img
                  src={activeBanner?.gifUrl || 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM2QzZTllOTgzYzExMzg2MzY1Yzg2NGQzZTgyYjc4OGQ3Yzg2NjM5NyZlcD12MV9pbnRlcm5hbF9naWZzX2dpZklkJmN0PWc/xT9IgzoKnwFNmISR8I/giphy.gif'}
                  alt="Teaser GIF"
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={activeBanner?.imageUrl || 'http://201.18.192.154:3001/uploads/banner_AyRDLxbDewLRWi6bJMPd.png'}
                  alt="Banner Poster"
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {/* Banner Meta Under Player */}
            <div className="mt-3.5 space-y-1">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-white text-sm truncate">
                  {activeBanner?.title || 'School Education Test Series'}
                </h4>
                <span className="text-[11px] px-2 py-0.5 rounded bg-white/10 text-amber-400 font-semibold">
                  AIR & Percentile
                </span>
              </div>
              <p className="text-xs text-slate-400 line-clamp-2">
                {activeBanner?.subtitle || 'Watch intro video & attempt mock series designed strictly as per latest exam pattern.'}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Manage Banners List */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Active Banners Database ({banners.length})
            </h3>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
            {loading ? (
              <div className="py-12 text-center text-gray-500">Loading banners...</div>
            ) : banners.length === 0 ? (
              <div className="py-12 text-center text-gray-500">
                No media banners uploaded. Add one using the button above.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {banners.map((b) => (
                  <div key={b.id} className="p-4 flex items-center justify-between gap-4 hover:bg-gray-50/80 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-16 h-12 rounded-lg bg-slate-900 overflow-hidden shrink-0 border border-gray-200">
                        <img
                          src={b.imageUrl || 'http://201.18.192.154:3001/uploads/banner_AyRDLxbDewLRWi6bJMPd.png'}
                          alt={b.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-gray-900 text-sm truncate">{b.title}</h4>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase bg-amber-100 text-amber-800">
                            {b.mediaType}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 truncate mt-0.5">{b.subtitle || 'No description'}</p>
                        <div className="text-[11px] text-gray-400 mt-1">
                          Goal: <span className="text-indigo-600 font-semibold">{b.examGoal || 'General'}</span> • Order: {b.order || 1}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setPreviewTab(b.mediaType || 'image')}
                        className="px-2.5 py-1.5 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-100 flex items-center gap-1"
                      >
                        <Play className="w-3 h-3 text-amber-600 fill-amber-600" /> Preview
                      </button>
                      <button
                        onClick={() => handleDeleteBanner(b.id!)}
                        className="p-1.5 rounded-lg border border-gray-300 text-gray-500 hover:text-red-600 hover:bg-red-50"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Media Banner Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Film className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-gray-900 text-base">Add Multi-Format Banner</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-700">✕</button>
            </div>

            <form onSubmit={handleCreateBanner} className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Banner Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MP Police Maths & Reasoning Special Series"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Subtitle / Tagline</label>
                <input
                  type="text"
                  placeholder="e.g. Watch intro video & attempt mock series by top faculty"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Default Media Type</label>
                  <select
                    value={formData.mediaType}
                    onChange={(e) => setFormData({ ...formData, mediaType: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 font-semibold"
                  >
                    <option value="video">🎬 Intro Video (MP4)</option>
                    <option value="gif">✨ Teaser Animated GIF</option>
                    <option value="image">🖼️ Static 16:9 Poster</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Exam Goal</label>
                  <select
                    value={formData.examGoal}
                    onChange={(e) => setFormData({ ...formData, examGoal: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300"
                  >
                    <option value="SCHOOL EDUCATION">SCHOOL EDUCATION</option>
                    <option value="COMPETETIVE EXAMS">COMPETETIVE EXAMS</option>
                    <option value="TECHNICAL TRAININGS">TECHNICAL TRAININGS</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Intro Video Stream URL (.mp4 / HLS)</label>
                <input
                  type="url"
                  placeholder="https://.../intro_video.mp4"
                  value={formData.videoUrl}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Poster Image URL (16:9)</label>
                <input
                  type="url"
                  placeholder="http://201.18.192.154:3001/uploads/banner_...png"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Animated GIF URL</label>
                <input
                  type="url"
                  placeholder="https://media.giphy.com/.../giphy.gif"
                  value={formData.gifUrl}
                  onChange={(e) => setFormData({ ...formData, gifUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 font-mono text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-blue-600 text-white font-bold rounded-xl">Save Banner</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
