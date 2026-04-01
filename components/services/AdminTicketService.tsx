import useSWR from 'swr';
import apiService from './apiService/apiService';

async function fetchAll(filters?: Record<string, any>) {
  const qs = filters
    ? `?${Object.entries(filters)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&')}`
    : '';

  const res = await apiService(`/api/admin/tickets${qs}`, { method: 'GET' });
  if (!res.success) throw new Error(res.errors?.message || 'Failed to fetch admin tickets');
  return res.data;
}

async function fetchById(id: string) {
  const res = await apiService(`/api/admin/tickets/${id}`, { method: 'GET' });
  if (!res.success) throw new Error(res.errors?.message || 'Failed to fetch ticket');
  return res.data;
}

async function validateTicket(id: string) {
  const res = await apiService(`/api/admin/tickets/${id}/validate`, { method: 'PATCH' });
  if (!res.success) throw new Error(res.errors?.message || 'Failed to validate ticket');
  return res.data;
}

const AdminTicketService = {
  FetchAll: (filters?: Record<string, any>) => useSWR(['/api/admin/tickets', filters], () => fetchAll(filters)),
  FetchById: (id?: string) => useSWR(id ? `/api/admin/tickets/${id}` : null, () => fetchById(id as string)),
  ValidateTicket: async (id: string) => validateTicket(id),
};

export default AdminTicketService;
