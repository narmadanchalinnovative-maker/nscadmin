'use client';

import { useState, useEffect } from 'react';
import { listDocuments, updateDocument } from '@/lib/firestore-service';
import { useAuth } from '@/lib/auth-context';
import { Loader2, Headset, CheckCircle2, Circle, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import AdminTicketChatModal from './AdminTicketChatModal';

interface Ticket {
  id: string;
  userId: string;
  userName: string;
  subject: string;
  description: string;
  status: string;
  hasUnreadAdmin?: boolean;
  createdAt: any;
}

export default function SupportTicketsPage() {
  const { adminUser } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const response = await listDocuments<Ticket>('support_tickets', 1, 100, undefined, 'createdAt', 'desc');
      setTickets(response.data);
    } catch (error) {
      console.error('Error fetching support tickets:', error);
      toast.error('Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (ticketId: string, currentStatus: string) => {
    if (!adminUser?.uid) return;
    
    const newStatus = currentStatus === 'open' ? 'resolved' : 'open';
    const originalTickets = [...tickets];
    
    // Optimistic update
    setTickets(tickets.map(t => t.id === ticketId ? { ...t, status: newStatus } : t));
    
    try {
      await updateDocument('support_tickets', ticketId, { status: newStatus }, adminUser.uid);
      toast.success('Ticket status updated');
    } catch (error) {
      // Revert on error
      setTickets(originalTickets);
      toast.error('Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Headset className="w-8 h-8 text-blue-600" />
            Support Tickets
          </h1>
          <p className="mt-2 text-gray-600">
            View and manage support tickets raised by users.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-slate-50 text-slate-600 font-medium">
              <tr>
                <th className="px-6 py-4">User Name</th>
                <th className="px-6 py-4">Subject</th>
                <th className="px-6 py-4 w-1/3">Description</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 cursor-pointer" onClick={() => setSelectedTicket(ticket)}>
                    {ticket.userName || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-blue-600">
                    {ticket.subject}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500 cursor-pointer" onClick={() => setSelectedTicket(ticket)}>
                    {ticket.createdAt?.toDate ? new Date(ticket.createdAt.toDate()).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setSelectedTicket(ticket)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-full transition-colors relative"
                        title="Open Chat"
                      >
                        <MessageSquare className="w-4 h-4" />
                        {ticket.hasUnreadAdmin && (
                          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white" />
                        )}
                      </button>
                      <button
                      onClick={() => toggleStatus(ticket.id, ticket.status)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        ticket.status === 'resolved'
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                      }`}
                    >
                      {ticket.status === 'resolved' ? (
                        <><CheckCircle2 className="w-3.5 h-3.5" /> Resolved</>
                      ) : (
                        <><Circle className="w-3.5 h-3.5" /> Open</>
                      )}
                    </button>
                    </div>
                  </td>
                </tr>
              ))}
              {tickets.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No support tickets found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {selectedTicket && (
        <AdminTicketChatModal ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />
      )}
    </div>
  );
}
