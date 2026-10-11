'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { eventService } from '@/lib/services/events';
import { Event } from '@/types';
import { createEventFormSchema } from '@/schemas';
import { EntityForm } from '@/components/admin/EntityForm';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const { adminUser } = useAuth();
  const [event, setEvent] = useState<Event & { id: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const eventId = params.id as string;

  useEffect(() => {
    async function fetchEvent() {
      try {
        const data = await eventService.get(eventId);
        if (data) {
          setEvent(data);
        } else {
          toast.error('Event not found');
          router.push('/admin/events');
        }
      } catch (error) {
        console.error('Error fetching event:', error);
        toast.error('Failed to fetch event');
        router.push('/admin/events');
      } finally {
        setLoading(false);
      }
    }

    fetchEvent();
  }, [eventId, router]);

  const handleSubmit = async (formData: any) => {
    if (!adminUser?.uid || !event) {
      toast.error('User not authenticated');
      return;
    }

    try {
      setSubmitting(true);
      await eventService.update(
        event.id,
        {
          ...formData,
          thumbnail: formData.thumbnail || '',
        },
        adminUser.uid
      );
      toast.success('Event updated successfully');
      router.push('/admin/events');
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error('Failed to update event');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          <p className="text-gray-600">Loading event...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return null;
  }

  return (
    <div>
      <EntityForm
        schema={createEventFormSchema}
        defaultValues={{
          title: event.title,
          description: event.description,
          thumbnail: event.thumbnail,
          status: event.status,
        }}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        title="Edit Event"
        loading={submitting}
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
            label: 'Event Thumbnail',
            type: 'image',
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
