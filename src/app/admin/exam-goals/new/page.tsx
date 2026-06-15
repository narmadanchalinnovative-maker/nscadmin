'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { examGoalService } from '@/lib/services/examGoals';
import { createExamGoalFormSchema } from '@/schemas';
import { EntityForm } from '@/components/admin/EntityForm';
import { toast } from 'sonner';

export default function CreateExamGoalPage() {
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
      await examGoalService.create(formData, adminUser.uid);
      toast.success('Exam goal created successfully');
      router.push('/admin/exam-goals');
    } catch (error) {
      console.error('Error creating exam goal:', error);
      toast.error('Failed to create exam goal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <EntityForm
        schema={createExamGoalFormSchema}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        title="Create New Exam Goal"
        loading={loading}
        fields={[
          {
            name: 'label',
            label: 'Exam Goal Label',
            type: 'text',
            placeholder: 'e.g., UPSC CSE-GS',
            required: true,
          },
          {
            name: 'order',
            label: 'Display Order',
            type: 'number',
            placeholder: '0',
            required: false,
          },
        ]}
      />
    </div>
  );
}
