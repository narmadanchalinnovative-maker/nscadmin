'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { eventService } from '@/lib/services/events';
import { createEventFormSchema } from '@/schemas';
import { EntityForm } from '@/components/admin/EntityForm';
import { toast } from 'sonner';

export default function CreateEventPage() {
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
      await eventService.create(
        {
          ...formData,
          thumbnail: formData.thumbnail || '',
        },
        adminUser.uid
      );
      toast.success('Event created successfully');
      router.push('/admin/events');
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error('Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <EntityForm
        schema={createEventFormSchema}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        title="Create New Event"
        loading={loading}
        fields={[
          {
            name: 'title',
            label: 'Event Title',
            type: 'text',
            placeholder: 'Enter event title',
            required: true,
          },
          {
            name: 'description',
            label: 'Description',
            type: 'textarea',
            placeholder: 'Enter event description',
            required: true,
          },
          {
            name: 'thumbnail',
            label: 'Thumbnail URL',
            type: 'url',
            placeholder: 'https://example.com/image.jpg',
            required: false,
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
