import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
});

export async function fetchCategories() {
  const res = await api.get('/categories');
  return res.data;
}

export async function fetchEvents() {
  const res = await api.get('/events');
  return res.data;
}

export async function fetchEventOptions(eventId) {
  const res = await api.get(`/events/${eventId}/options`);
  return res.data;
}

export async function autocompleteProducts(q) {
  const res = await api.get('/products/autocomplete', { params: { q } });
  return res.data;
}

export async function fetchItems(params = {}) {
  const res = await api.get('/items', { params });
  return res.data;
}

export async function createItem(payload) {
  const res = await api.post('/items', payload);
  return res.data;
}


