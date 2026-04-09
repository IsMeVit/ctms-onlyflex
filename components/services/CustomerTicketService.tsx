import useSWR, { SWRResponse } from 'swr';
import apiService from './apiService/apiService';

type TicketSeat = {
  row?: string | null;
  seatNumber?: number | null;
};

type TicketMovie = {
  id?: string;
  title?: string | null;
  posterUrl?: string | null;
};

type TicketHall = {
  id?: string;
  name?: string | null;
} | string | null;

type TicketShowtime = {
  startTime?: string | null;
  endTime?: string | null;
  movie?: TicketMovie | null;
  hall?: TicketHall;
};

type TicketRecord = {
  id: string;
  status?: string | null;
  finalPrice?: number | string | null;
  seat?: TicketSeat | null;
};

type BookingRecord = {
  id: string;
  isScanned?: boolean | null;
  bookingStatus?: string | null;
  finalAmount?: number | string | null;
  showtime?: TicketShowtime | null;
  tickets?: TicketRecord[];
};

export type TicketWithBooking = TicketRecord & {
  booking: BookingRecord;
};

async function fetchTickets(status?: string): Promise<TicketWithBooking[]> {
  // The app exposes customer bookings at /api/customer/booking which includes tickets.
  const url = `/api/customer/booking${status ? `?status=${encodeURIComponent(status)}` : ''}`;
  const res = await apiService(url, { method: 'GET' });
  if (!res.success) throw new Error(res.errors?.message || 'Failed to fetch bookings');

  // Normalize into a flat tickets array where each ticket contains its booking and showtime/movie data
  const payload = res.data as { bookings?: BookingRecord[] } | BookingRecord[];
  const bookings = Array.isArray(payload) ? payload : payload.bookings || [];

  const tickets: TicketWithBooking[] = [];
  bookings.forEach((booking) => {
    (booking.tickets || []).forEach((t) => {
      tickets.push({
        ...t,
        booking: booking,
      });
    });
  });

  return tickets;
}

const CustomerTicketService = {
  FetchAll: (status?: string): SWRResponse<TicketWithBooking[], Error> => {
    const key = `/api/customer/booking${status ? `?status=${status}` : ''}`;
    return useSWR<TicketWithBooking[]>(key, () => fetchTickets(status), {
      refreshInterval: 5 * 60 * 1000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    });
  },
};

export default CustomerTicketService;
