import useSWR from "swr";
import apiService from "./apiService/apiService";

const path = "/api/customer/booking/";

type FetchAllParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: string;
};

const BookingService = {
  // Fetch all bookings with optional params
  FetchAll: (params: FetchAllParams = {}) => {
    const query: string[] = [];
    if (params.page) query.push(`page=${params.page}`);
    if (params.limit) query.push(`limit=${params.limit}`);
    if (params.search) query.push(`search=${params.search}`);
    if (params.status) query.push(`status=${params.status}`);
    if (params.sortBy) query.push(`sortBy=${params.sortBy}`);
    if (params.sortOrder) query.push(`sortOrder=${params.sortOrder}`);
    const url = path + (query.length ? `?${query.join("&")}` : "");
    return useSWR(url);
  },

  // Fetch one booking by id
  fetchOne: async (id: string) => {
    try {
      const response = await apiService(`${path}${id}`, {
        method: "GET",
      });
      return response;
    } catch (error) {
      return error;
    }
  },

  // Create a new booking
  create: async (data: any) => {
    try {
      const response = await apiService(path, {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response;
    } catch (error) {
      return error;
    }
  },

  // Update a booking by id
  update: async (id: string, data: any) => {
    try {
      const response = await apiService(`${path}${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      return response;
    } catch (error) {
      return error;
    }
  },

  // Delete a booking by id
  delete: async (id: string) => {
    try {
      const response = await apiService(`${path}${id}`, {
        method: "DELETE",
      });
      return response;
    } catch (error) {
      return error;
    }
  },
};

export default BookingService;