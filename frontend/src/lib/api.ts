import axios from 'axios';
import { Destination, Itinerary, Booking, Homestay } from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

export const getDestinations = async (params?: {
  query?: string;
  search?: string;
  city?: string;
  state?: string;
  category?: string;
  limit?: number;
  offset?: number;
}): Promise<{ results: Destination[]; total: number; message?: string }> => {
  const res = await api.get('/destinations', { params });
  return res.data;
};

export const getDestinationById = async (id: number | string): Promise<Destination> => {
  const res = await api.get(`/destinations/${id}`);
  return res.data;
};

export const generateItinerary = async (payload: {
  destination?: string;
  state?: string;
  days: number;
  budget: string;
  interests?: string[];
  pace?: string;
  group_type?: string;
}): Promise<Itinerary> => {
  const res = await api.post('/itinerary/generate', payload);
  return res.data;
};

export const getItineraryById = async (id: string): Promise<Itinerary> => {
  const res = await api.get(`/itinerary/${id}`);
  return res.data;
};

export const createDirectBooking = async (payload: {
  homestay_id?: string;
  place_name?: string;
  guest_name: string;
  guest_phone: string;
  guest_email: string;
  check_in: string;
  check_out: string;
  amount: number;
  payment_status?: string;
}): Promise<{ success: boolean; booking_id: string; message: string }> => {
  const res = await api.post('/checkout/direct-booking', payload);
  return res.data;
};

export const getHomestays = async (params?: {
  state?: string;
  is_tribal?: boolean;
}): Promise<Homestay[]> => {
  const res = await api.get('/homestays', { params });
  return res.data;
};

export default api;
