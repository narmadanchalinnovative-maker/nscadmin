'use client';

import { useState } from 'react';
import { BaseEntity, PaginatedResponse } from '@/types';
import { ChevronLeft, ChevronRight, Edit2, Trash2, ToggleLeft, ToggleRight, ArrowRight } from 'lucide-react';

interface DataTableProps<T extends Record<string, any>> {
  data: PaginatedResponse<T & { id: string }>;
  onEdit: (item: T & { id: string }) => void;
  onDelete: (id: string) => void;
  onToggleStatus?: (id: string, currentStatus: 'active' | 'inactive') => void;
  onPageChange: (page: number) => void;
  onNext?: (item: T & { id: string }) => void;
  loading?: boolean;
}

export function DataTable<T extends Record<string, any>>({
  data,
  onEdit,
  onDelete,
  onToggleStatus,
  onPageChange,
  onNext,
  loading = false,
}: DataTableProps<T>) {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full"></div>
        </div>
      </div>
    );
  }

  const items = Array.isArray(data?.data) ? data.data : [];

  if (items.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <p className="text-gray-600">No items found</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Title</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Description</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Created By</th>
            <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.title || (item as any).label}</td>
              <td className="px-6 py-4 text-sm text-gray-600 line-clamp-2">
                {item.description || '-'}
              </td>
              <td className="px-6 py-4">
                  <button
                    onClick={() => {
                      if (onToggleStatus) {
                        onToggleStatus(item.id!, item.status);
                      }
                    }}
                    disabled={!onToggleStatus}
                    className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      item.status === 'active'
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : !item.status 
                          ? 'bg-gray-100 text-gray-700' 
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                    } ${!onToggleStatus ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {item.status === 'active' ? (
                      <ToggleRight className="w-4 h-4" />
                    ) : (
                      <ToggleLeft className="w-4 h-4" />
                    )}
                    <span className="capitalize">{item.status || 'N/A'}</span>
                  </button>
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">{item.createdBy || '-'}</td>
              <td className="px-6 py-4 text-center">
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => onEdit(item)}
                    className="p-2 hover:bg-blue-100 text-blue-600 rounded transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {onNext && (
                    <button
                      onClick={() => onNext(item)}
                      className="p-2 hover:bg-green-100 text-green-600 rounded transition-colors"
                      title="Next / Questions"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                  {confirmDelete === item.id ? (
                    <>
                      <button
                        onClick={() => {
                          onDelete(item.id!);
                          setConfirmDelete(null);
                        }}
                        className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="px-2 py-1 bg-gray-300 text-gray-800 text-xs rounded hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(item.id!)}
                      className="p-2 hover:bg-red-100 text-red-600 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="bg-white px-6 py-4 border-t border-gray-200 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Page {data.page} of {data.totalPages} ({data.total} total items)
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => onPageChange(data.page - 1)}
            disabled={data.page === 1}
            className="p-2 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => onPageChange(data.page + 1)}
            disabled={data.page === data.totalPages}
            className="p-2 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
