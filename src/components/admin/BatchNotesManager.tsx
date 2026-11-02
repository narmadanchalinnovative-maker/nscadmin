'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { UploadCloud, Loader2, FileText, Trash2, Plus, X } from 'lucide-react';
import { toast } from 'sonner';

interface Note {
  id: string;
  title: string;
  description: string;
  pdfUrl: string;
  type: string;
  createdAt: any;
}

export function BatchNotesManager({ batchId }: { batchId: string }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('Complete Study Material');
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (!db || !batchId) {
      setLoading(false);
      return;
    }

    try {
      const q = query(
        collection(db, `batches/${batchId}/notes`),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const fetchedNotes = (snapshot?.docs || []).map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Note[];
          setNotes(fetchedNotes);
          setLoading(false);
        },
        (error) => {
          console.warn('BatchNotesManager onSnapshot warning:', error);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (e) {
      console.warn('BatchNotesManager listener setup error:', e);
      setLoading(false);
    }
  }, [batchId]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !file) {
      toast.error('Title and PDF file are required');
      return;
    }

    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file');
      return;
    }

    try {
      setIsUploading(true);
      setProgress(50);
      
      const formData = new FormData();
      formData.append('file', file);
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/external-api';
      const response = await fetch(`${apiUrl}/video/upload-file`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setProgress(100);
        const pdfUrl = data.fileUrl;
        
        await addDoc(collection(db, `batches/${batchId}/notes`), {
          title,
          description,
          type,
          pdfUrl,
          createdAt: serverTimestamp(),
        });
        
        toast.success('Note added successfully');
        setShowForm(false);
        setTitle('');
        setDescription('');
        setFile(null);
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to save note');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (note: Note) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    try {
      await deleteDoc(doc(db, `batches/${batchId}/notes/${note.id}`));
      toast.success('Note deleted');
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete note');
    }
  };

  return (
    <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Batch Notes & PDFs</h2>
          <p className="text-sm text-gray-500">Upload study materials and handwritten notes</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-medium hover:bg-blue-100 transition-colors"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'Add Note'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleUpload} className="mb-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border bg-white"
                placeholder="e.g. Complete Study Material"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Note Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border bg-white"
              >
                <option value="Complete Study Material">Complete Study Material</option>
                <option value="Handwritten Notes">Handwritten Notes</option>
                <option value="Practice Assignment">Practice Assignment</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border bg-white"
                placeholder="e.g. PDF notes for all subjects included in this batch"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">PDF File *</label>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border bg-white"
                required
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={isUploading || !file || !title}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading {Math.round(progress)}%
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                Upload Note
              </>
            )}
          </button>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : notes.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No notes added to this batch yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div key={note.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-red-50 text-red-500 rounded-lg">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{note.title}</h3>
                  <p className="text-sm text-gray-500">{note.description || note.type}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={note.pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                >
                  View
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
          ))}
        </div>
      )}
    </div>
  );
}
