'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { ApiService } from '@/lib/api-service';
import { toast } from 'sonner';
import { Loader2, Trash2, Cloud, Image as ImageIcon, Video, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface CloudinaryStats {
  usedBytes: number;
  totalBytes: number;
}

interface CloudinaryFile {
  public_id: string;
  name: string;
  size: number;
  format: string;
  category: 'Image' | 'Video' | 'Document';
  createdAt: string;
  url: string;
}

export default function CloudinaryManagerPage() {
  const { adminUser } = useAuth();
  const [stats, setStats] = useState<CloudinaryStats | null>(null);
  const [files, setFiles] = useState<CloudinaryFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  useEffect(() => {
    fetchCloudinaryData();
  }, []);

  const fetchCloudinaryData = async () => {
    try {
      setIsLoading(true);
      const res = await ApiService.get('/admin/cloudinary');
      if (res.success) {
        setStats(res.stats);
        setFiles(res.files);
        setSelectedFiles(new Set()); // clear selections on refresh
      } else {
        toast.error(res.message || 'Failed to fetch data');
      }
    } catch (error) {
      toast.error('Failed to fetch Cloudinary data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedFiles.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedFiles.size} selected files from Cloudinary? This action is PERMANENT and cannot be undone.`)) return;

    try {
      setIsBulkDeleting(true);
      const filesToDelete = files
        .filter(f => selectedFiles.has(f.public_id))
        .map(f => ({ public_id: f.public_id, category: f.category }));

      const res = await ApiService.post('/admin/cloudinary/bulk-delete', { items: filesToDelete });
      
      if (res.success) {
        toast.success(res.message || 'Files deleted successfully');
        fetchCloudinaryData();
      } else {
        toast.error(res.message || 'Failed to delete files');
      }
    } catch (error) {
      toast.error('Error during bulk delete');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedFiles.size === files.length && files.length > 0) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(files.map(f => f.public_id)));
    }
  };

  const toggleSelectFile = (public_id: string) => {
    const newSet = new Set(selectedFiles);
    if (newSet.has(public_id)) {
      newSet.delete(public_id);
    } else {
      newSet.add(public_id);
    }
    setSelectedFiles(newSet);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!adminUser) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Cloud className="w-6 h-6 text-blue-500" />
            Cloudinary Manager
          </h1>
          <p className="text-gray-500">Monitor and manage your CDN storage</p>
        </div>
        <button
          onClick={fetchCloudinaryData}
          disabled={isLoading}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          Refresh Data
        </button>
      </div>

      {isLoading && !stats ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <>
          {/* Storage Progress Bar */}
          {stats && (
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex justify-between mb-2">
                <h3 className="font-semibold text-gray-900">Total CDN Storage Used</h3>
                <span className="text-sm font-medium text-gray-600">
                  {formatBytes(stats.usedBytes)} / {formatBytes(stats.totalBytes)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div 
                  className={`h-4 rounded-full transition-all duration-500 ${
                    (stats.usedBytes / stats.totalBytes) > 0.9 ? 'bg-red-500' : 
                    (stats.usedBytes / stats.totalBytes) > 0.7 ? 'bg-yellow-500' : 
                    'bg-blue-500'
                  }`}
                  style={{ width: `${Math.min((stats.usedBytes / stats.totalBytes) * 100, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-right">
                {((stats.usedBytes / stats.totalBytes) * 100).toFixed(2)}% used of 25GB limit
              </p>
            </div>
          )}

          {/* Files List */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <div className="flex items-center gap-4">
                <h3 className="font-semibold text-gray-900">Uploaded Assets</h3>
                <span className="bg-blue-100 text-blue-700 py-1 px-3 rounded-full text-xs font-medium">
                  {files.length} files
                </span>
              </div>
              
              {selectedFiles.size > 0 && (
                <button
                  onClick={handleBulkDelete}
                  disabled={isBulkDeleting}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 text-sm font-medium"
                >
                  {isBulkDeleting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Delete Selected ({selectedFiles.size})
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="p-4 w-12">
                      <input
                        type="checkbox"
                        checked={selectedFiles.size === files.length && files.length > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                    </th>
                    <th className="p-4 font-medium text-gray-500 text-sm">File Name</th>
                    <th className="p-4 font-medium text-gray-500 text-sm">Category</th>
                    <th className="p-4 font-medium text-gray-500 text-sm">Format</th>
                    <th className="p-4 font-medium text-gray-500 text-sm">Size</th>
                    <th className="p-4 font-medium text-gray-500 text-sm">Uploaded</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {files.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-500">
                        No files found in Cloudinary
                      </td>
                    </tr>
                  ) : (
                    files.map((file) => (
                      <tr 
                        key={file.public_id} 
                        className={`hover:bg-gray-50 transition-colors ${selectedFiles.has(file.public_id) ? 'bg-blue-50' : ''}`}
                      >
                        <td className="p-4">
                          <input
                            type="checkbox"
                            checked={selectedFiles.has(file.public_id)}
                            onChange={() => toggleSelectFile(file.public_id)}
                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          />
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${
                              file.category === 'Video' ? 'bg-purple-100 text-purple-600' :
                              file.category === 'Image' ? 'bg-green-100 text-green-600' :
                              'bg-orange-100 text-orange-600'
                            }`}>
                              {file.category === 'Video' ? <Video className="w-5 h-5" /> :
                               file.category === 'Image' ? <ImageIcon className="w-5 h-5" /> :
                               <FileText className="w-5 h-5" />}
                            </div>
                            <div>
                              <a href={file.url} target="_blank" rel="noopener noreferrer" className="font-medium text-gray-900 hover:text-blue-600 truncate max-w-[300px] block">
                                {file.name}
                              </a>
                              <p className="text-xs text-gray-500 break-all w-64 truncate">{file.public_id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-gray-600">
                          {file.category}
                        </td>
                        <td className="p-4 text-sm text-gray-600 uppercase">
                          {file.format}
                        </td>
                        <td className="p-4 text-sm font-medium text-gray-900">
                          {formatBytes(file.size)}
                        </td>
                        <td className="p-4 text-sm text-gray-600 whitespace-nowrap">
                          {formatDistanceToNow(new Date(file.createdAt), { addSuffix: true })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
