'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { examGoalService } from '@/lib/services/examGoals';
import { createExamGoalFormSchema } from '@/schemas';
import { EntityForm } from '@/components/admin/EntityForm';
import { toast } from 'sonner';

export default function EditExamGoalPage() {
  const router = useRouter();
  const params = useParams();
  const { adminUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState<any>(null);

  useEffect(() => {
    if (params.id) {
      fetchExamGoal(params.id as string);
    }
  }, [params.id]);

  const fetchExamGoal = async (id: string) => {
    try {
      const data = await examGoalService.get(id);
      if (data) {
        setInitialData(data);
      } else {
        toast.error('Exam goal not found');
        router.push('/admin/exam-goals');
      }
    } catch (error) {
      console.error('Error fetching exam goal:', error);
      toast.error('Failed to fetch exam goal');
    }
  };

  const handleSubmit = async (formData: any) => {
    if (!adminUser?.uid) {
      toast.error('User not authenticated');
      return;
    }

    try {
      setLoading(true);
      await examGoalService.update(params.id as string, formData, adminUser.uid);
      toast.success('Exam goal updated successfully');
      router.push('/admin/exam-goals');
    } catch (error) {
      console.error('Error updating exam goal:', error);
      toast.error('Failed to update exam goal');
    } finally {
      setLoading(false);
    }
  };

  if (!initialData) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <EntityForm
        schema={createExamGoalFormSchema}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        title="Edit Exam Goal"
        loading={loading}
        defaultValues={initialData}
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
