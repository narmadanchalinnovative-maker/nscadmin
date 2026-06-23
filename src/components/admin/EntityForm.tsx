'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ZodType, any } from 'zod';
import { BaseEntity } from '@/types';
import { X, Loader2 } from 'lucide-react';
import { ImageUpload } from './ImageUpload';
import { VideoUpload } from './VideoUpload';

interface EntityFormProps {
  schema: ZodType<any>;
  defaultValues?: Record<string, any>;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  title: string;
  fields: {
    name: string;
    label: string;
    type?: 'text' | 'textarea' | 'select' | 'url' | 'number' | 'image' | 'video';
    placeholder?: string;
    required?: boolean;
    options?: Array<{ label: string; value: string }>;
    storagePath?: string;
  }[];
  loading?: boolean;
}

export function EntityForm({
  schema,
  defaultValues,
  onSubmit,
  onCancel,
  title,
  fields,
  loading = false,
}: EntityFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema as any),
    defaultValues: defaultValues || {},
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <button
            onClick={onCancel}
            disabled={isSubmitting || loading}
            className="p-2 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 text-gray-500 hover:text-gray-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {fields.map((field) => (
            <div key={field.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.label}
                {field.required !== false && <span className="text-red-500"> *</span>}
              </label>

              {field.type === 'textarea' ? (
                <textarea
                  {...register(field.name)}
                  placeholder={field.placeholder}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none text-gray-900"
                />
              ) : field.type === 'select' ? (
                <select
                  {...register(field.name)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                >
                  <option value="">Select {field.label}</option>
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : field.type === 'image' ? (
                <ImageUpload
                  value={watch(field.name)}
                  onChange={(url) => setValue(field.name, url, { shouldValidate: true })}
                  storagePath={field.storagePath}
                />
              ) : field.type === 'video' ? (
                <VideoUpload
                  value={watch(field.name)}
                  onChange={(url) => setValue(field.name, url, { shouldValidate: true })}
                  storagePath={field.storagePath}
                />
              ) : (
                <input
                  {...(field.type === 'number' ? register(field.name, { valueAsNumber: true }) : register(field.name))}
                  type={field.type || 'text'}
                  placeholder={field.placeholder}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                />
              )}

              {errors[field.name] && (
                <p className="mt-1 text-sm text-red-600">
                  {String(errors[field.name]?.message)}
                </p>
              )}
            </div>
          ))}

          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting || loading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting || loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                'Save'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
