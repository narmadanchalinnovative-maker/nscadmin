'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Loader2, ArrowUp, ArrowDown } from 'lucide-react';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { bannerService, Banner } from '@/lib/services/banners';
import { ApiService } from '@/lib/api-service';


interface Batch {
  id: string;
  title: string;
}

interface Course {
  id: string;
  title: string;
}

export default function BannersPage() {
  const { adminUser } = useAuth();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [linkType, setLinkType] = useState<'none' | 'custom' | 'batch' | 'course'>('none');
  const [formData, setFormData] = useState({
    imageUrl: '',
    routeName: '',
    status: 'active' as 'active' | 'inactive',
  });

  const fetchData = async () => {
    try {
      const data = await bannerService.listAll();
      setBanners(data);

      const batchSnap: any = await ApiService.get('/admin/data/batches');
      setBatches((batchSnap?.data || batchSnap || []).map((d: any) => ({ id: d.id, title: d.title })));

      const courseSnap: any = await ApiService.get('/admin/data/courses');
      setCourses((courseSnap?.data || courseSnap || []).map((d: any) => ({ id: d.id, title: d.title })));
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (banner?: Banner) => {
    if (banner) {
      setEditingBanner(banner);
      setFormData({
        imageUrl: banner.imageUrl,
        routeName: banner.routeName,
        status: banner.status,
      });

      if (!banner.routeName) {
        setLinkType('none');
      } else if (banner.routeName.startsWith('/batches/')) {
        setLinkType('batch');
      } else if (banner.routeName.startsWith('/courses/')) {
        setLinkType('course');
      } else {
        setLinkType('custom');
      }
    } else {
      setEditingBanner(null);
      setFormData({
        imageUrl: '',
        routeName: '',
        status: 'active',
      });
      setLinkType('none');
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBanner(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.imageUrl) {
      toast.error('Image is required');
      return;
    }
    if (linkType !== 'none' && !formData.routeName) {
      toast.error('Please select a valid destination for the banner');
      return;
    }
    if (!adminUser) return;

    setSaving(true);
    try {
      const finalRouteName = linkType === 'none' ? '' : formData.routeName;
      
      const baseData = {
        imageUrl: formData.imageUrl,
        routeName: finalRouteName,
        status: formData.status,
        updatedBy: adminUser.email || 'admin',
      };

      if (editingBanner) {
        await bannerService.update(editingBanner.id, baseData);
        toast.success('Banner updated successfully');
      } else {
        const order = banners.length > 0 ? Math.max(...banners.map(b => b.order)) + 1 : 1;
        await bannerService.create({
          ...baseData,
          order,
          createdBy: adminUser.email || 'admin',
        });
        toast.success('Banner added successfully');
      }
      
      await fetchData();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving banner:', error);
      toast.error('Failed to save banner');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;
    
    try {
      await bannerService.delete(id);
      toast.success('Banner deleted');
      fetchData();
    } catch (error) {
      console.error('Error deleting banner:', error);
      toast.error('Failed to delete banner');
    }
  };

  const handleReorder = async (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === banners.length - 1)) return;
    
    const newBanners = [...banners];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    
    const tempOrder = newBanners[index].order;
    newBanners[index].order = newBanners[swapIndex].order;
    newBanners[swapIndex].order = tempOrder;
    
    const temp = newBanners[index];
    newBanners[index] = newBanners[swapIndex];
    newBanners[swapIndex] = temp;
    
    setBanners(newBanners);

    try {
      await Promise.all([
        bannerService.update(newBanners[index].id, { order: newBanners[index].order }),
        bannerService.update(newBanners[swapIndex].id, { order: newBanners[swapIndex].order })
      ]);
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order');
      fetchData(); // Revert on failure
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
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Banners</h1>
          <p className="text-sm text-gray-500">Manage app dashboard banners</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Banner
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="p-4 font-medium text-gray-600 text-sm">Image</th>
                <th className="p-4 font-medium text-gray-600 text-sm">Route Name</th>
                <th className="p-4 font-medium text-gray-600 text-sm">Status</th>
                <th className="p-4 font-medium text-gray-600 text-sm text-center">Order</th>
                <th className="p-4 font-medium text-gray-600 text-sm text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {banners.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    No banners found. Click "Add Banner" to create one.
                  </td>
                </tr>
              ) : (
                banners.map((banner, index) => (
                  <tr key={banner.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <img src={banner.imageUrl} alt="Banner" className="w-32 h-16 object-cover rounded shadow-sm border border-gray-200" />
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-gray-700 bg-gray-100 px-2 py-1 rounded">
                        {banner.routeName || 'None'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        banner.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {banner.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center items-center gap-1">
                        <button
                          onClick={() => handleReorder(index, 'up')}
                          disabled={index === 0}
                          className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <span className="text-sm font-medium w-4 text-center">{banner.order}</span>
                        <button
                          onClick={() => handleReorder(index, 'down')}
                          disabled={index === banners.length - 1}
                          className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(banner)}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(banner.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                {editingBanner ? 'Edit Banner' : 'Add New Banner'}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <span className="text-xl leading-none">&times;</span>
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Banner Image
                  </label>
                  <ImageUpload
                    value={formData.imageUrl}
                    onChange={(url) => setFormData(prev => ({ ...prev, imageUrl: url }))}
                    storagePath="banners"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Link Destination Type
                  </label>
                  <select
                    value={linkType}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setLinkType(val);
                      setFormData(prev => ({ ...prev, routeName: '' }));
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 bg-white"
                  >
                    <option value="none">None (Not Clickable)</option>
                    <option value="batch">Specific Batch</option>
                    <option value="course">Specific Course</option>
                    <option value="custom">Custom Route</option>
                  </select>
                </div>

                {linkType === 'batch' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Batch
                    </label>
                    <select
                      value={formData.routeName.replace('/batches/', '')}
                      onChange={(e) => setFormData(prev => ({ ...prev, routeName: `/batches/${e.target.value}` }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 bg-white"
                    >
                      <option value="">-- Select a Batch --</option>
                      {batches.map(b => (
                        <option key={b.id} value={b.id}>{b.title}</option>
                      ))}
                    </select>
                  </div>
                )}

                {linkType === 'course' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Course
                    </label>
                    <select
                      value={formData.routeName.replace('/courses/', '')}
                      onChange={(e) => setFormData(prev => ({ ...prev, routeName: `/courses/${e.target.value}` }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 bg-white"
                    >
                      <option value="">-- Select a Course --</option>
                      {courses.map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>
                )}

                {linkType === 'custom' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Custom Route
                    </label>
                    <input
                      type="text"
                      value={formData.routeName}
                      onChange={(e) => setFormData(prev => ({ ...prev, routeName: e.target.value }))}
                      placeholder="/details or /tests"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 bg-white"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'active' | 'inactive' }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 bg-white"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={saving}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {saving ? 'Saving...' : 'Save Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
