'use client';

import { useState, useEffect, useCallback } from 'react';
import { ApiService } from '@/lib/api-service';
import {
  UploadCloud,
  Loader2,
  FileText,
  Trash2,
  Plus,
  X,
  ExternalLink,
  BookOpen,
  Lock,
  Unlock,
  Tag,
  DollarSign,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';

interface Note {
  id: string;
  batchId: string;
  courseId?: string | null;
  title: string;
  description?: string;
  pdfUrl: string;
  type?: string;
  isPaid?: boolean;
  price?: number;
  createdAt?: any;
}

interface BatchCourse {
  id: string;
  title: string;
  price?: number;
}

export function BatchNotesManager({ batchId }: { batchId: string }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [courses, setCourses] = useState<BatchCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Filter State
  const [filterCourse, setFilterCourse] = useState<string>('all');
  const [filterAccess, setFilterAccess] = useState<'all' | 'free' | 'paid'>('all');

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('Complete Study Material');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState<number | string>(0);
  const [file, setFile] = useState<File | null>(null);

  // Fetch courses belonging to this batch
  const fetchBatchCourses = useCallback(async () => {
    if (!batchId) return;
    try {
      const res = await ApiService.get(`/admin/data/courses?batchId=${batchId}`);
      if (res && res.success && Array.isArray(res.data)) {
        setCourses(res.data);
      } else if (Array.isArray(res)) {
        setCourses(res);
      } else {
        setCourses([]);
      }
    } catch (err) {
      console.warn('Could not load batch courses:', err);
      setCourses([]);
    }
  }, [batchId]);

  // Fetch notes from VPS PostgreSQL API
  const fetchNotes = useCallback(async () => {
    if (!batchId) return;
    try {
      setLoading(true);
      const res = await ApiService.get(`/admin/data/batch_notes?batchId=${batchId}`);
      if (res && res.success && Array.isArray(res.data)) {
        setNotes(res.data);
      } else if (Array.isArray(res)) {
        setNotes(res);
      } else {
        setNotes([]);
      }
    } catch (err) {
      console.error('Error fetching batch notes:', err);
      toast.error('Failed to load batch notes');
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  useEffect(() => {
    fetchNotes();
    fetchBatchCourses();
  }, [fetchNotes, fetchBatchCourses]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !file) {
      toast.error('Title and PDF file are required');
      return;
    }

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Please upload a valid PDF file');
      return;
    }

    const numericPrice = isPaid ? parseFloat(String(price)) || 0 : 0;
    if (isPaid && numericPrice <= 0) {
      toast.error('Please enter a valid price for paid note');
      return;
    }

    try {
      setIsUploading(true);
      setProgress(40);

      // 1. Upload PDF to VPS Storage
      const formData = new FormData();
      formData.append('file', file);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/external-api';
      const uploadRes = await fetch(`${apiUrl}/video/upload-file`, {
        method: 'POST',
        body: formData,
      });

      const data = await uploadRes.json();
      setProgress(85);

      if (!uploadRes.ok || !data.success) {
        throw new Error(data.error || data.message || 'File upload failed');
      }

      const pdfUrl = data.fileUrl || data.url || data.file || data.path || data.data?.fileUrl || data.data?.url;
      if (!pdfUrl) {
        throw new Error('No PDF URL returned by server');
      }

      // 2. Save note record to PostgreSQL via Admin API
      const notePayload = {
        batchId,
        courseId: selectedCourseId ? selectedCourseId : null,
        title: title.trim(),
        description: description.trim(),
        type,
        isPaid: Boolean(isPaid),
        price: numericPrice,
        pdfUrl,
      };

      const saveRes = await ApiService.post('/admin/data/batch_notes', notePayload);
      setProgress(100);

      if (saveRes && saveRes.success === false) {
        throw new Error(saveRes.message || saveRes.error || 'Failed to save note record');
      }

      toast.success(isPaid ? `Paid Note (₹${numericPrice}) added! 🔒` : 'Free Note added! 📄');
      setShowForm(false);
      setTitle('');
      setDescription('');
      setSelectedCourseId('');
      setIsPaid(false);
      setPrice(0);
      setFile(null);

      // Refresh list immediately
      await fetchNotes();
    } catch (error: any) {
      console.error('Note upload error:', error);
      toast.error(error.message || 'Failed to upload and save note');
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  const handleDelete = async (note: Note) => {
    if (!confirm(`Are you sure you want to delete note "${note.title}"?`)) return;
    try {
      const res = await ApiService.delete(`/admin/data/batch_notes/${note.id}`);
      if (res && res.success === false) {
        throw new Error(res.message || 'Failed to delete note');
      }
      toast.success('Note deleted successfully');
      setNotes((prev) => prev.filter((n) => n.id !== note.id));
    } catch (error: any) {
      console.error('Delete note error:', error);
      toast.error(error.message || 'Failed to delete note');
    }
  };

  // Filter notes by Course and Access (Free/Paid)
  const filteredNotes = notes.filter((n) => {
    const matchesCourse =
      filterCourse === 'all'
        ? true
        : filterCourse === 'batch_only'
        ? !n.courseId
        : n.courseId === filterCourse;

    const matchesAccess =
      filterAccess === 'all'
        ? true
        : filterAccess === 'free'
        ? !n.isPaid || (n.price || 0) <= 0
        : n.isPaid && (n.price || 0) > 0;

    return matchesCourse && matchesAccess;
  });

  return (
    <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Batch & Course Notes (Free & Paid)</h2>
          <p className="text-sm text-gray-500">
            Upload study materials, handwritten notes by Course, and set Free or Paid pricing
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-medium hover:bg-blue-100 transition-colors shrink-0"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'Add Note'}
        </button>
      </div>

      {/* ===================================================================== */}
      {/* ADD NOTE FORM                                                         */}
      {/* ===================================================================== */}
      {showForm && (
        <form onSubmit={handleUpload} className="mb-8 bg-gray-50 p-6 rounded-xl border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Note Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border bg-white text-sm"
                placeholder="e.g. Complete Physics Notes Chapter 1-5"
                required
              />
            </div>

            {/* Note Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Note Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border bg-white text-sm"
              >
                <option value="Complete Study Material">Complete Study Material</option>
                <option value="Handwritten Notes">Handwritten Notes</option>
                <option value="Practice Assignment">Practice Assignment</option>
                <option value="Revision Notes">Revision Notes</option>
                <option value="Formula Sheet">Formula Sheet</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Course Association (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Link to Course (Optional)
              </label>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border bg-white text-sm"
              >
                <option value="">-- All Courses / Entire Batch --</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    📚 {c.title}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-gray-400 mt-1">
                Select a specific course, or leave as entire batch note.
              </p>
            </div>

            {/* Access & Pricing (Free or Paid) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Access & Pricing *
              </label>
              <div className="flex items-center gap-3 mt-1.5">
                <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="radio"
                    name="pricingType"
                    checked={!isPaid}
                    onChange={() => {
                      setIsPaid(false);
                      setPrice(0);
                    }}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="flex items-center gap-1 font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                    <Unlock className="w-3.5 h-3.5 text-emerald-600" /> Free Note
                  </span>
                </label>

                <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="radio"
                    name="pricingType"
                    checked={isPaid}
                    onChange={() => {
                      setIsPaid(true);
                      if (!price || Number(price) <= 0) setPrice(99);
                    }}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="flex items-center gap-1 font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                    <Lock className="w-3.5 h-3.5 text-amber-600" /> Paid Note (₹)
                  </span>
                </label>
              </div>

              {/* Price Input if Paid */}
              {isPaid && (
                <div className="mt-2.5">
                  <div className="relative rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 sm:text-sm font-bold">
                      ₹
                    </div>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="e.g. 99"
                      className="block w-full rounded-md border-gray-300 pl-7 pr-12 focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border bg-white"
                      required={isPaid}
                    />
                  </div>
                  <p className="text-[11px] text-amber-600 mt-1">
                    Students will need to purchase this note or enroll in the course to unlock.
                  </p>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border bg-white text-sm"
                placeholder="e.g. Chapter-wise solved notes and formula reference"
              />
            </div>

            {/* PDF File Upload */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">PDF File *</label>
              <input
                type="file"
                accept="application/pdf,.pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border bg-white text-sm"
                required
              />
              {file && (
                <p className="text-xs text-slate-500 mt-1">
                  Selected: <span className="font-semibold text-slate-700">{file.name}</span> ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isUploading || !file || !title.trim()}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading {Math.round(progress)}%...
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                {isPaid ? `Upload Paid Note (₹${price})` : 'Upload Free Note'}
              </>
            )}
          </button>
        </form>
      )}

      {/* ===================================================================== */}
      {/* FILTER BAR                                                            */}
      {/* ===================================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-gray-100">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter By:
          </span>

          {/* Filter Course */}
          <select
            value={filterCourse}
            onChange={(e) => setFilterCourse(e.target.value)}
            className="text-xs rounded-lg border-gray-200 border p-1.5 bg-gray-50 text-gray-700 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Courses ({notes.length})</option>
            <option value="batch_only">Entire Batch Notes Only</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>

          {/* Filter Access */}
          <select
            value={filterAccess}
            onChange={(e) => setFilterAccess(e.target.value as any)}
            className="text-xs rounded-lg border-gray-200 border p-1.5 bg-gray-50 text-gray-700 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Access Types</option>
            <option value="free">Free Notes Only 🟢</option>
            <option value="paid">Paid Notes Only 🔒</option>
          </select>
        </div>

        <div className="text-xs text-gray-500">
          Showing <span className="font-semibold text-gray-800">{filteredNotes.length}</span> of {notes.length} notes
        </div>
      </div>

      {/* ===================================================================== */}
      {/* NOTES LIST                                                            */}
      {/* ===================================================================== */}
      {loading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No notes match the selected filters.</p>
          <p className="text-xs text-gray-400 mt-1">Click &quot;Add Note&quot; above to upload PDF study materials.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotes.map((note) => {
            const courseMatch = courses.find((c) => c.id === note.courseId);
            const isNotePaid = note.isPaid && (note.price || 0) > 0;

            return (
              <div
                key={note.id}
                className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-xs transition-all"
              >
                <div className="flex items-start gap-4 min-w-0">
                  <div
                    className={`p-3 rounded-lg shrink-0 ${
                      isNotePaid ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-500'
                    }`}
                  >
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                        {note.title}
                      </h3>

                      {/* Free vs Paid Badge */}
                      {isNotePaid ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 border border-amber-300">
                          <Lock className="w-3 h-3 text-amber-600" />
                          Paid ₹{note.price}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 border border-emerald-300">
                          <Unlock className="w-3 h-3 text-emerald-600" />
                          Free
                        </span>
                      )}

                      {/* Course Association Badge */}
                      {courseMatch ? (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                          <BookOpen className="w-3 h-3 text-purple-600" />
                          {courseMatch.title}
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                          🎓 Entire Batch Note
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                        {note.type || 'Study Material'}
                      </span>
                      {note.description && (
                        <p className="text-xs text-gray-500 truncate max-w-md">{note.description}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={note.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                  >
                    <span>View PDF</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDelete(note)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Delete Note"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
