const API_BASE = process.env.REACT_APP_API_BASE || 'http://127.0.0.1:8000/api';

function storedToken() {
  try {
    return JSON.parse(localStorage.getItem('shaheer-user'))?.token || null;
  } catch {
    return null;
  }
}

function extractErrorMessage(data, status) {
  if (!data) return `Request failed (${status})`;
  if (typeof data.detail === 'string') return data.detail;
  if (Array.isArray(data.non_field_errors) && data.non_field_errors.length) return data.non_field_errors[0];
  const firstKey = Object.keys(data)[0];
  if (firstKey) {
    const value = data[firstKey];
    const message = Array.isArray(value) ? value[0] : value;
    if (typeof message === 'string') return `${firstKey === 'non_field_errors' ? '' : firstKey + ': '}${message}`;
  }
  return `Request failed (${status})`;
}

async function request(path, options = {}) {
  const isForm = options.body instanceof FormData;
  const headers = isForm ? {} : { 'Content-Type': 'application/json' };
  // Only admin endpoints get the login token, so an old/expired token can never break public pages.
  if (path.startsWith('/admin/')) {
    const token = storedToken();
    if (token) headers.Authorization = `Token ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : null;
  if (!res.ok) {
    if (path.startsWith('/admin/') && (res.status === 401 || res.status === 403)) {
      throw new Error('Your admin session has expired or you are not an admin. Please log in again.');
    }
    throw new Error(extractErrorMessage(data, res.status));
  }
  return data;
}

const json = (method, body) => ({ method, body: JSON.stringify(body) });
const list = (data) => data.results || data;

export const api = {
  getCategories: () => request('/categories/'),
  getCars: (params = {}) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
    ).toString();
    return request(`/cars/${query ? `?${query}` : ''}`);
  },
  getCar: (id) => request(`/cars/${id}/`),
  checkAvailability: (payload) => request('/cars/check-availability/', json('POST', payload)),
  getPaymentMethods: () => request('/payment-methods/'),
  createBooking: (payload) => request('/bookings/', json('POST', payload)),
  getBookingsByEmail: (email) => request(`/bookings/?email=${encodeURIComponent(email)}`),
  register: (payload) => request('/auth/register/', json('POST', payload)),
  login: (payload) => request('/auth/login/', json('POST', payload)),
  sendContactMessage: (payload) => request('/contact/', json('POST', payload)),
  getReviews: () => request('/reviews/'),
  createReview: (payload) => request('/reviews/', json('POST', payload)),
};

// ---------------- Admin panel (staff only) ----------------
export const adminApi = {
  dashboard: () => request('/admin/dashboard/'),

  cars: () => request('/admin/cars/').then(list),
  car: (id) => request(`/admin/cars/${id}/`),
  saveCar: (id, payload) =>
    id ? request(`/admin/cars/${id}/`, json('PATCH', payload)) : request('/admin/cars/', json('POST', payload)),
  deleteCar: (id) => request(`/admin/cars/${id}/`, { method: 'DELETE' }),
  uploadImages: (carId, files) => {
    const form = new FormData();
    Array.from(files).forEach((f) => form.append('images', f));
    return request(`/admin/cars/${carId}/images/`, { method: 'POST', body: form });
  },
  deleteImage: (id) => request(`/admin/car-images/${id}/`, { method: 'DELETE' }),
  makePrimary: (id) => request(`/admin/car-images/${id}/make-primary/`, { method: 'POST' }),

  categories: () => request('/admin/categories/').then(list),
  addCategory: (name) => request('/admin/categories/', json('POST', { name })),
  deleteCategory: (id) => request(`/admin/categories/${id}/`, { method: 'DELETE' }),

  paymentMethods: () => request('/admin/payment-methods/').then(list),
  addPaymentMethod: (payload) => request('/admin/payment-methods/', json('POST', payload)),
  updatePaymentMethod: (id, payload) => request(`/admin/payment-methods/${id}/`, json('PATCH', payload)),
  deletePaymentMethod: (id) => request(`/admin/payment-methods/${id}/`, { method: 'DELETE' }),

  bookings: (status) => request(`/admin/bookings/${status ? `?status=${status}` : ''}`).then(list),
  updateBooking: (id, status) => request(`/admin/bookings/${id}/`, json('PATCH', { status })),
  deleteBooking: (id) => request(`/admin/bookings/${id}/`, { method: 'DELETE' }),

  customers: () => request('/admin/customers/').then(list),
  deleteCustomer: (id) => request(`/admin/customers/${id}/`, { method: 'DELETE' }),

  messages: () => request('/admin/messages/').then(list),
  markMessageRead: (id) => request(`/admin/messages/${id}/`, json('PATCH', { is_read: true })),
  deleteMessage: (id) => request(`/admin/messages/${id}/`, { method: 'DELETE' }),

  admins: () => request('/admin/admins/').then(list),
  addAdmin: (username, password) => request('/admin/admins/', json('POST', { username, password })),
  deleteAdmin: (id) => request(`/admin/admins/${id}/`, { method: 'DELETE' }),
  changePassword: (old, next) => request('/admin/admins/change-password/', json('POST', { old, new: next })),
};

export default api;
