'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { testService } from '@/lib/services/tests';
import { createTestFormSchema } from '@/schemas';
import { EntityForm } from '@/components/admin/EntityForm';
import { toast } from 'sonner';

export default function CreateTestPage() {
  const router = useRouter();
  const { adminUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData: any) => {
    if (!adminUser?.uid) {
      toast.error('User not authenticated');
      return;
    }

    try {
      setLoading(true);
      await testService.create(formData, adminUser.uid);
      toast.success('Test created successfully');
      router.push('/admin/tests');
    } catch (error) {
      console.error('Error creating test:', error);
      toast.error('Failed to create test');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <EntityForm
        schema={createTestFormSchema}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        title="Create New Test"
        loading={loading}
        fields={[
          {
            name: 'title',
            label: 'Test Title',
            type: 'text',
            placeholder: 'Enter test title',
            required: true,
          },
          {
            name: 'description',
            label: 'Description',
            type: 'textarea',
            placeholder: 'Enter test description',
            required: true,
          },
          {
            name: 'status',
            label: 'Status',
            type: 'select',
            required: true,
            options: [
              { label: 'Active', value: 'active' },
              { label: 'Inactive', value: 'inactive' },
            ],
          },
        ]}
      />
    </div>
  );
}
