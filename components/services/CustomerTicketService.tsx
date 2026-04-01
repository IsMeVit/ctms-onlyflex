import useSWR, { SWRResponse } from 'swr';
import apiService from './apiService/apiService';

type TicketWithBooking = any;

async function fetchTickets(status?: string): Promise<TicketWithBooking[]> {
  // The app exposes customer bookings at /api/customer/booking which includes tickets.
  const url = `/api/customer/booking${status ? `?status=${encodeURIComponent(status)}` : ''}`;
  const res = await apiService(url, { method: 'GET' });
  if (!res.success) throw new Error(res.errors?.message || 'Failed to fetch bookings');

  // Normalize into a flat tickets array where each ticket contains its booking and showtime/movie data
  const payload = res.data as any;
  const bookings = Array.isArray(payload) ? payload : payload.bookings || [];

  const tickets: TicketWithBooking[] = [];
  bookings.forEach((booking: any) => {
    (booking.tickets || []).forEach((t: any) => {
      tickets.push({
        ...t,
        booking: booking,
      });
    });
  });

  return tickets;
}

const CustomerTicketService = {
  FetchAll: (status?: string): SWRResponse<TicketWithBooking[], any> => {
    const key = `/api/customer/booking${status ? `?status=${status}` : ''}`;
    return useSWR<TicketWithBooking[]>(key, () => fetchTickets(status));
  },
};

export default CustomerTicketService;
