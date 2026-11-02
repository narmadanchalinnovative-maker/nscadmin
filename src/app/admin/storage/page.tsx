'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { ApiService } from '@/lib/api-service';
import { toast } from 'sonner';
import { Loader2, Trash2, Database, Image as ImageIcon, Video, FileText, File } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface StorageStats {
  Image: { size: number; count: number };
  Video: { size: number; count: number };
  Document: { size: number; count: number };
  Other: { size: number; count: number };
  Total: { size: number; count: number };
}

interface FileInfo {
  name: string;
  size: number;
  category: 'Image' | 'Video' | 'Document' | 'Other';
  createdAt: string;
  folder: string;
}

export default function StorageManagerPage() {
  const { adminUser } = useAuth();
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  useEffect(() => {
    fetchStorageData();
  }, []);

  const fetchStorageData = async () => {
    try {
      setIsLoading(true);
      const res = await ApiService.get('/admin/storage');
      if (res.success) {
        setStats(res.stats || null);
        setFiles(Array.isArray(res.files) ? res.files : []);
        setSelectedFiles(new Set()); // clear selections on refresh
      }
    } catch (error) {
      toast.error('Failed to fetch storage data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (file: FileInfo) => {
    if (!confirm(`Are you sure you want to delete ${file.name}? This action cannot be undone.`)) return;

    try {
      setIsDeleting(file.name);
      const res = await ApiService.delete(`/admin/storage`, { folder: file.folder, name: file.name });
      if (res.success) {
        toast.success('File deleted successfully');
        fetchStorageData(); // Refresh the list
      } else {
        toast.error(res.message || 'Failed to delete file');
      }
    } catch (error) {
      toast.error('Error deleting file');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedFiles.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedFiles.size} selected files? This cannot be undone.`)) return;

    try {
      setIsBulkDeleting(true);
      const filesToDelete = files
        .filter(f => selectedFiles.has(f.name))
        .map(f => ({ folder: f.folder, name: f.name }));

      const res = await ApiService.post('/admin/storage/bulk-delete', { files: filesToDelete });
      
      if (res.success) {
        toast.success(res.message || 'Files deleted successfully');
        fetchStorageData();
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
      setSelectedFiles(new Set(files.map(f => f.name)));
    }
  };

  const toggleSelect = (name: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(name)) {
      newSelected.delete(name);
    } else {
      newSelected.add(name);
    }
    setSelectedFiles(newSelected);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Image': return <ImageIcon className="w-5 h-5 text-blue-500" />;
      case 'Video': return <Video className="w-5 h-5 text-purple-500" />;
      case 'Document': return <FileText className="w-5 h-5 text-green-500" />;
      default: return <File className="w-5 h-5 text-gray-500" />;
    }
  };

  if (!adminUser) return null;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Storage Manager</h1>
          <p className="text-gray-500 mt-1">Manage and monitor VPS disk space</p>
        </div>
        <div className="flex items-center gap-3">
          {selectedFiles.size > 0 && (
            <button
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
              className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg transition flex items-center gap-2 border border-red-200"
            >
              {isBulkDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Delete Selected ({selectedFiles.size})
            </button>
          )}
          <select 
            onChange={(e) => {
              const val = e.target.value;
              if (!val) return;
              if (val === 'All') {
                setSelectedFiles(new Set(files.map(f => f.name)));
              } else {
                setSelectedFiles(new Set(files.filter(f => f.category === val).map(f => f.name)));
              }
              e.target.value = ''; // reset after selection
            }}
            className="bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-lg outline-none cursor-pointer text-sm font-medium"
          >
            <option value="">Quick Select...</option>
            <option value="All">All Files</option>
            <option value="Image">All Images</option>
            <option value="Video">All Videos</option>
            <option value="Document">All Documents</option>
          </select>
          <button
            onClick={fetchStorageData}
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg transition flex items-center gap-2"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
            Refresh
          </button>
        </div>
      </div>

      {isLoading && !stats ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <>
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Total Used</p>
                  <p className="text-2xl font-bold text-gray-900">{formatBytes(stats.Total.size)}</p>
                  <p className="text-xs text-gray-400 mt-1">{stats.Total.count} files</p>
                </div>
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                  <Database className="w-6 h-6 text-slate-600" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-50 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 mb-1">Images</p>
                  <p className="text-2xl font-bold text-gray-900">{formatBytes(stats.Image.size)}</p>
                  <p className="text-xs text-gray-400 mt-1">{stats.Image.count} files</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-blue-600" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-purple-50 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600 mb-1">Videos</p>
                  <p className="text-2xl font-bold text-gray-900">{formatBytes(stats.Video.size)}</p>
                  <p className="text-xs text-gray-400 mt-1">{stats.Video.count} files</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Video className="w-6 h-6 text-purple-600" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-green-50 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 mb-1">Documents / Text</p>
                  <p className="text-2xl font-bold text-gray-900">{formatBytes(stats.Document.size)}</p>
                  <p className="text-xs text-gray-400 mt-1">{stats.Document.count} files</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">File Manager</h2>
              <p className="text-sm text-gray-500">All uploaded files across your VPS.</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-12">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300 w-4 h-4 cursor-pointer"
                        checked={selectedFiles.size === files.length && files.length > 0}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">File</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Size</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Uploaded</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {files.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        No files found in storage.
                      </td>
                    </tr>
                  ) : (
                    files.map((file, idx) => (
                      <tr 
                        key={`${file.name}-${idx}`} 
                        className={`transition-colors ${selectedFiles.has(file.name) ? 'bg-blue-50/50' : 'hover:bg-gray-50/50'}`}
                      >
                        <td className="px-6 py-4">
                          <input 
                            type="checkbox" 
                            className="rounded border-gray-300 w-4 h-4 cursor-pointer"
                            checked={selectedFiles.has(file.name)}
                            onChange={() => toggleSelect(file.name)}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {getCategoryIcon(file.category)}
                            <div className="max-w-xs truncate font-medium text-gray-900" title={file.name}>
                              {file.name}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {file.category}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-700">
                          {formatBytes(file.size)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatDistanceToNow(new Date(file.createdAt), { addSuffix: true })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDelete(file)}
                            disabled={isDeleting === file.name || isBulkDeleting}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors disabled:opacity-50 inline-flex items-center justify-center"
                            title="Delete File"
                          >
                            {isDeleting === file.name ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <Trash2 className="w-5 h-5" />
                            )}
                          </button>
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
