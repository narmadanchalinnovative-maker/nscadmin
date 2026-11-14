'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/auth-context';
import { ApiService } from '@/lib/api-service';
import { toast } from 'sonner';
import { 
  Loader2, 
  Trash2, 
  Database, 
  Image as ImageIcon, 
  Video, 
  FileText, 
  File, 
  ExternalLink, 
  Copy, 
  Check, 
  Search, 
  RefreshCw,
  AlertCircle
} from 'lucide-react';
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
  displayName?: string;
  originalName?: string;
  rawName?: string;
  size: number;
  category: 'Image' | 'Video' | 'Document' | 'Other';
  createdAt: string;
  folder: string;
  url: string;
  hlsUrl?: string;
}

export default function StorageManagerPage() {
  const { adminUser } = useAuth();
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'All' | 'Video' | 'Image' | 'Document'>('All');

  useEffect(() => {
    fetchStorageData();
  }, []);

  const fetchStorageData = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      // 1. Try ApiService with 15s timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      let data: any = null;
      try {
        const res = await ApiService.get('/admin/storage');
        if (res && res.success) {
          data = res;
        }
      } catch (e) {
        // Fallback to direct backend call
      }

      // If ApiService didn't succeed, try direct fallback
      if (!data || !data.success) {
        try {
          const directRes = await fetch('http://201.18.192.154:3001/api/admin/storage', {
            signal: controller.signal,
            headers: {
              ...(ApiService.token ? { Authorization: `Bearer ${ApiService.token}` } : {})
            }
          });
          if (directRes.ok) {
            data = await directRes.json();
          }
        } catch (fallbackErr) {
          console.warn('Direct storage fetch failed:', fallbackErr);
        }
      }

      clearTimeout(timeoutId);

      if (data && data.success) {
        setStats(data.stats || null);
        setFiles(Array.isArray(data.files) ? data.files : []);
        setSelectedFiles(new Set());
      } else {
        throw new Error(data?.message || 'Could not load storage data from server');
      }
    } catch (err: any) {
      console.error('Failed to fetch storage data:', err);
      setErrorMsg(err.message || 'Failed to fetch storage data');
      toast.error('Could not load storage details. Please try refreshing.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (file: FileInfo) => {
    const fileIdentifier = file.rawName || file.name;
    const displayName = file.displayName || file.name;

    if (!confirm(`Are you sure you want to permanently delete "${displayName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setIsDeleting(fileIdentifier);
      const res = await ApiService.delete('/admin/storage', { 
        folder: file.folder, 
        name: fileIdentifier 
      });

      if (res && res.success) {
        toast.success(`Deleted ${displayName}`);
        setFiles(prev => prev.filter(f => (f.rawName || f.name) !== fileIdentifier));
        setSelectedFiles(prev => {
          const next = new Set(prev);
          next.delete(fileIdentifier);
          return next;
        });
      } else {
        toast.error(res?.message || 'Failed to delete file');
      }
    } catch (error) {
      toast.error('Error deleting file');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedFiles.size === 0) return;
    if (!confirm(`Are you sure you want to permanently delete ${selectedFiles.size} selected file(s)? This cannot be undone.`)) {
      return;
    }

    try {
      setIsBulkDeleting(true);
      const filesToDelete = files
        .filter(f => selectedFiles.has(f.rawName || f.name))
        .map(f => ({ folder: f.folder, name: f.rawName || f.name }));

      const res = await ApiService.post('/admin/storage/bulk-delete', { files: filesToDelete });
      
      if (res && res.success) {
        toast.success(res.message || 'Selected files deleted successfully');
        fetchStorageData();
      } else {
        toast.error(res?.message || 'Failed to delete selected files');
      }
    } catch (error) {
      toast.error('Error during bulk deletion');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const toggleSelectAll = () => {
    if (selectedFiles.size === filteredFiles.length && filteredFiles.length > 0) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(filteredFiles.map(f => f.rawName || f.name)));
    }
  };

  const toggleSelect = (identifier: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(identifier)) {
      newSelected.delete(identifier);
    } else {
      newSelected.add(identifier);
    }
    setSelectedFiles(newSelected);
  };

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Image': 
        return <ImageIcon className="w-5 h-5 text-blue-500 flex-shrink-0" />;
      case 'Video': 
        return <Video className="w-5 h-5 text-purple-500 flex-shrink-0" />;
      case 'Document': 
        return <FileText className="w-5 h-5 text-emerald-500 flex-shrink-0" />;
      default: 
        return <File className="w-5 h-5 text-slate-500 flex-shrink-0" />;
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'Image':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">Image</span>;
      case 'Video':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">Video</span>;
      case 'Document':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">Document</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200">Other</span>;
    }
  };

  // Filtered files by search & category
  const filteredFiles = useMemo(() => {
    return files.filter(f => {
      const matchesCategory = activeCategory === 'All' || f.category === activeCategory;
      const term = searchQuery.toLowerCase().trim();
      const name = (f.displayName || f.name || '').toLowerCase();
      const matchesSearch = !term || name.includes(term);
      return matchesCategory && matchesSearch;
    });
  }, [files, activeCategory, searchQuery]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Storage Manager</h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage, inspect, and open original uploaded videos, images, and documents on your VPS.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {selectedFiles.size > 0 && (
            <button
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
              className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 border border-red-200 shadow-sm"
            >
              {isBulkDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Delete Selected ({selectedFiles.size})
            </button>
          )}

          <button
            onClick={fetchStorageData}
            disabled={isLoading}
            className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm font-medium">{errorMsg}</p>
          </div>
          <button 
            onClick={fetchStorageData} 
            className="text-xs bg-red-100 hover:bg-red-200 text-red-800 font-semibold px-3 py-1.5 rounded-lg transition"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Total Disk Usage</p>
              <p className="text-2xl font-bold text-slate-900">{formatBytes(stats.Total.size)}</p>
              <p className="text-xs text-slate-400 mt-1">{stats.Total.count} original files</p>
            </div>
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
              <Database className="w-6 h-6 text-slate-600" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-purple-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-purple-600 mb-1">Videos</p>
              <p className="text-2xl font-bold text-slate-900">{formatBytes(stats.Video.size)}</p>
              <p className="text-xs text-purple-500 mt-1">{stats.Video.count} lecture videos</p>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
              <Video className="w-6 h-6 text-purple-600" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-blue-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 mb-1">Images</p>
              <p className="text-2xl font-bold text-slate-900">{formatBytes(stats.Image.size)}</p>
              <p className="text-xs text-blue-500 mt-1">{stats.Image.count} photos & thumbnails</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-emerald-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 mb-1">Documents / PDFs</p>
              <p className="text-2xl font-bold text-slate-900">{formatBytes(stats.Document.size)}</p>
              <p className="text-xs text-emerald-500 mt-1">{stats.Document.count} study materials</p>
            </div>
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>
      )}

      {/* Main File Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        {/* Toolbar: Category tabs, Search & Quick Selection */}
        <div className="p-5 border-b border-slate-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Category Filter Tabs */}
            <div className="inline-flex p-1 bg-slate-100 rounded-xl">
              {(['All', 'Video', 'Image', 'Document'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeCategory === cat
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {cat === 'All' ? 'All Files' : `${cat}s`}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search files by name..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span>Showing {filteredFiles.length} {filteredFiles.length === 1 ? 'file' : 'files'}</span>
            {selectedFiles.size > 0 && (
              <span className="font-medium text-blue-600">{selectedFiles.size} selected</span>
            )}
          </div>
        </div>

        {/* Loading Spinner */}
        {isLoading && files.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-sm font-medium text-slate-500">Scanning VPS storage files...</p>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="py-20 text-center text-slate-500 space-y-2">
            <File className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-base font-semibold text-slate-700">No files found</p>
            <p className="text-xs text-slate-400">
              {searchQuery ? `No matches found for "${searchQuery}"` : 'No files found in storage.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/70 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider w-10">
                    <input 
                      type="checkbox" 
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                      checked={selectedFiles.size === filteredFiles.length && filteredFiles.length > 0}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">File Name</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Type</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Size</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Date</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredFiles.map((file, idx) => {
                  const identifier = file.rawName || file.name;
                  const displayName = file.displayName || file.name;
                  const isSelected = selectedFiles.has(identifier);

                  return (
                    <tr 
                      key={`${identifier}-${idx}`} 
                      className={`transition-colors ${isSelected ? 'bg-blue-50/40' : 'hover:bg-slate-50/60'}`}
                    >
                      <td className="px-5 py-4">
                        <input 
                          type="checkbox" 
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                          checked={isSelected}
                          onChange={() => toggleSelect(identifier)}
                        />
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {getCategoryIcon(file.category)}
                          <div className="min-w-0">
                            <a
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-slate-900 hover:text-blue-600 transition truncate block max-w-md"
                              title={`Click to open ${displayName}`}
                            >
                              {displayName}
                            </a>
                            <span className="text-[11px] text-slate-400 block truncate max-w-xs font-mono">
                              {file.rawName || file.name}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        {getCategoryBadge(file.category)}
                      </td>

                      <td className="px-5 py-4 text-xs font-semibold text-slate-700">
                        {formatBytes(file.size)}
                      </td>

                      <td className="px-5 py-4 text-xs text-slate-500">
                        {file.createdAt ? (
                          <span title={new Date(file.createdAt).toLocaleString()}>
                            {formatDistanceToNow(new Date(file.createdAt), { addSuffix: true })}
                          </span>
                        ) : '—'}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Open in new tab button */}
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                            title="Open and view original file in new tab"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>

                          {/* Copy URL button */}
                          <button
                            onClick={() => handleCopyUrl(file.url)}
                            className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                            title="Copy link to clipboard"
                          >
                            {copiedUrl === file.url ? (
                              <Check className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>

                          {/* Delete button */}
                          <button
                            onClick={() => handleDelete(file)}
                            disabled={isDeleting === identifier || isBulkDeleting}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                            title="Delete file permanently"
                          >
                            {isDeleting === identifier ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
