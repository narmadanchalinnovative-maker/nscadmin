'use client';

import { useState, useEffect } from 'react';
import { batchService } from '@/lib/services/batches';
import { Batch } from '@/types';
import { BatchNotesManager } from '@/components/admin/BatchNotesManager';
import { Loader2, BookOpen } from 'lucide-react';

export default function NotesManagementPage() {
  const [batches, setBatches] = useState<(Batch & { id: string })[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBatches() {
      try {
        const result = await batchService.list(1, 100);
        setBatches(result.data || []);
      } catch (error) {
        console.error('Failed to load batches:', error);
      } finally {
        setLoading(false);
      }
    }
    loadBatches();
  }, []);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Batch Notes</h1>
        <p className="text-gray-600 mt-1">Select a batch to manage its study materials and notes</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Batch</label>
        {loading ? (
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading batches...</span>
          </div>
        ) : (
          <select
            value={selectedBatchId}
            onChange={(e) => setSelectedBatchId(e.target.value)}
            className="w-full md:w-1/2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border bg-white"
          >
            <option value="">-- Choose a Batch --</option>
            {batches.map((batch) => (
              <option key={batch.id} value={batch.id}>
                {batch.title}
              </option>
            ))}
          </select>
        )}
      </div>

      {selectedBatchId ? (
        <BatchNotesManager batchId={selectedBatchId} />
      ) : (
        <div className="text-center p-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No Batch Selected</h3>
          <p className="text-gray-500 mt-1">Please select a batch from the dropdown above to view and upload notes.</p>
        </div>
      )}
    </div>
  );
}
