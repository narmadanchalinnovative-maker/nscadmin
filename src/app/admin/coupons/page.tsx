'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Plus, Pencil, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { CouponForm } from '@/components/admin/coupons/CouponForm';

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'coupons'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCoupons(data);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching coupons:', error);
      toast.error('Failed to fetch coupons');
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleEdit = (coupon: any) => {
    setEditingCoupon(coupon);
    setIsFormOpen(true);
  };

  const handleToggleStatus = async (coupon: any) => {
    try {
      await updateDoc(doc(db, 'coupons', coupon.id), { isActive: !coupon.isActive });
      toast.success(`Coupon ${coupon.id} is now ${!coupon.isActive ? 'Active' : 'Inactive'}`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    try {
      await deleteDoc(doc(db, 'coupons', id));
      toast.success('Coupon deleted');
    } catch (error) {
      console.error('Error deleting coupon:', error);
      toast.error('Failed to delete coupon');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Coupons Management</h1>
        <button
          onClick={() => { setEditingCoupon(null); setIsFormOpen(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Create Coupon
        </button>
      </div>

      {isFormOpen ? (
        <div className="bg-white p-6 rounded-lg shadow">
          <CouponForm 
            initialData={editingCoupon} 
            onClose={() => setIsFormOpen(false)} 
          />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="p-4 font-semibold text-gray-600">Code</th>
                <th className="p-4 font-semibold text-gray-600">Discount</th>
                <th className="p-4 font-semibold text-gray-600">Scope</th>
                <th className="p-4 font-semibold text-gray-600">Status</th>
                <th className="p-4 font-semibold text-gray-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="p-4 text-center text-gray-500">Loading coupons...</td></tr>
              ) : coupons.length === 0 ? (
                <tr><td colSpan={5} className="p-4 text-center text-gray-500">No coupons found.</td></tr>
              ) : (
                coupons.map((coupon) => (
                  <tr key={coupon.id} className="border-b hover:bg-gray-50">
                    <td className="p-4 font-bold text-blue-600">{coupon.id}</td>
                    <td className="p-4">₹{coupon.discountAmount}</td>
                    <td className="p-4">
                      {coupon.scope === 'ALL_COURSES' ? (
                        <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-medium">All Courses</span>
                      ) : (
                        <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-medium">Course: {coupon.courseTitle || coupon.courseId}</span>
                      )}
                    </td>
                    <td className="p-4">
                      <button 
                        onClick={() => handleToggleStatus(coupon)}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${coupon.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                      >
                        {coupon.isActive ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {coupon.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="p-4 text-right flex justify-end gap-2">
                      <button onClick={() => handleEdit(coupon)} className="text-gray-500 hover:text-blue-600"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(coupon.id)} className="text-gray-500 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
