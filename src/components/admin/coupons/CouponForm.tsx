'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { couponService } from '@/lib/services/coupons';
import { ApiService } from '@/lib/api-service';

const couponSchema = z.object({
  code: z.string().min(3, "Code must be at least 3 characters").max(20).toUpperCase(),
  description: z.string().min(5, "Description is required"),
  discountAmount: z.coerce.number().min(1, "Discount must be at least ₹1"),
  isActive: z.boolean().default(true),
  scope: z.enum(['ALL_COURSES', 'SINGLE_COURSE']),
  courseId: z.string().optional(),
  terms: z.string().min(10, "Terms and conditions are required"),
}).refine((data) => {
  if (data.scope === 'SINGLE_COURSE' && (!data.courseId || data.courseId.trim() === '')) {
    return false;
  }
  return true;
}, {
  message: "Course ID is required when scope is Single Course",
  path: ["courseId"],
});

type CouponFormData = z.infer<typeof couponSchema>;

export function CouponForm({ initialData, onClose }: { initialData?: any, onClose: () => void }) {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch courses for the dropdown from Postgres
    ApiService.get('/admin/data/courses').then((res: any) => {
      const coursesData = res?.data || res || [];
      setCourses(coursesData.map((c: any) => ({ id: c.id, title: c.title })));
    }).catch(console.error);
  }, []);

  const form = useForm({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      code: initialData?.id || '',
      description: initialData?.description || '',
      discountAmount: initialData?.discountAmount || 0,
      isActive: initialData?.isActive ?? true,
      scope: initialData?.scope || 'ALL_COURSES',
      courseId: initialData?.courseId || '',
      terms: initialData?.terms || '1. This coupon is valid for a limited time only.\n2. Cannot be combined with other offers.\n3. The discount is non-transferable and not redeemable for cash.',
    }
  });

  const scopeValue = form.watch('scope');

  const onSubmit = async (data: CouponFormData) => {
    setLoading(true);
    try {
      const payload = {
        code: data.code,
        description: data.description,
        discountAmount: data.discountAmount,
        isActive: data.isActive,
        scope: data.scope,
        courseId: data.scope === 'SINGLE_COURSE' ? data.courseId : null,
        terms: data.terms,
      };

      if (initialData) {
        await couponService.update(initialData.id, payload, 'admin');
      } else {
        await couponService.create(payload, 'admin');
      }

      toast.success(`Coupon ${data.code} saved successfully!`);
      onClose();
    } catch (error) {
      console.error('Error saving coupon:', error);
      toast.error('Failed to save coupon');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">{initialData ? 'Edit Coupon' : 'Create New Coupon'}</h2>
        <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-700 text-sm">Cancel</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-1">Coupon Code</label>
          <input 
            {...form.register('code')} 
            disabled={!!initialData}
            className="w-full border rounded-md p-2 uppercase" 
            placeholder="e.g. WELCOME50"
          />
          {form.formState.errors.code && <p className="text-red-500 text-xs mt-1">{form.formState.errors.code?.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Discount Amount (₹)</label>
          <input 
            type="number" 
            {...form.register('discountAmount')} 
            className="w-full border rounded-md p-2" 
          />
          {form.formState.errors.discountAmount && <p className="text-red-500 text-xs mt-1">{form.formState.errors.discountAmount?.message}</p>}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Short Description</label>
          <input 
            {...form.register('description')} 
            className="w-full border rounded-md p-2" 
            placeholder="e.g. Flat ₹50 off for new users"
          />
          {form.formState.errors.description && <p className="text-red-500 text-xs mt-1">{form.formState.errors.description?.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Scope</label>
          <select {...form.register('scope')} className="w-full border rounded-md p-2">
            <option value="ALL_COURSES">All Courses</option>
            <option value="SINGLE_COURSE">Specific Course</option>
          </select>
        </div>

        {scopeValue === 'SINGLE_COURSE' && (
          <div>
            <label className="block text-sm font-medium mb-1">Target Course</label>
            <select {...form.register('courseId')} className="w-full border rounded-md p-2">
              <option value="">Select a course</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.title} ({c.id})</option>
              ))}
            </select>
            {form.formState.errors.courseId && <p className="text-red-500 text-xs mt-1">{form.formState.errors.courseId?.message}</p>}
          </div>
        )}

        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Terms and Conditions</label>
          <textarea 
            {...form.register('terms')} 
            className="w-full border rounded-md p-2 h-32" 
            placeholder="Enter terms line by line..."
          />
          {form.formState.errors.terms && <p className="text-red-500 text-xs mt-1">{form.formState.errors.terms?.message}</p>}
        </div>
        
        <div className="md:col-span-2 flex items-center gap-2">
          <input type="checkbox" id="isActive" {...form.register('isActive')} className="w-4 h-4" />
          <label htmlFor="isActive" className="text-sm font-medium">Coupon is Active</label>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t">
        <button 
          type="submit" 
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Coupon'}
        </button>
      </div>
    </form>
  );
}
