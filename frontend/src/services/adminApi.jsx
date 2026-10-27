const API_BASE = process.env.REACT_APP_API_BASE || 'http://127.0.0.1:8000/api';

function getToken() {
  try {
    const raw = sessionStorage.getItem('shaheer-admin');
    return raw ? JSON.parse(raw).token : null;
  } catch {
    return null;
  }
}

function extractErrorMessage(data, status) {
  if (!data) return `Request failed (${status})`;
  if (typeof data.detail === 'string') return data.detail;
  const firstKey = Object.keys(data)[0];
  if (firstKey) {
    const value = data[firstKey];
    const message = Array.isArray(value) ? value[0] : value;
    if (typeof message === 'string') return message;
  }
  return `Request failed (${status})`;
}

async function request(path, options = {}) {
  const token = getToken();
  const isFormData = options.body instanceof FormData;
  const headers = { ...(options.headers || {}) };
  if (!isFormData) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Token ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (res.status === 204) return null;
  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : null;

  if (res.status === 401) {
    // The stored token doesn't match any account on the server anymore —
    // most often because the database was reset/re-migrated after the
    // token was issued. Clear it and tell the app to send the admin back
    // to login, instead of leaving a dead "Invalid token." error on screen.
    try { sessionStorage.removeItem('shaheer-admin'); } catch { /* ignore */ }
    window.dispatchEvent(new Event('admin-session-expired'));
    throw new Error('Your admin session expired. Please log in again.');
  }
  if (!res.ok) throw new Error(extractErrorMessage(data, res.status));
  return data;
}

const list = (data) => data?.results || data || [];

const adminApi = {
  stats: () => request('/admin/stats/'),

  // Cars
  getCars: () => request('/admin/cars/').then(list),
  getCar: (id) => request(`/admin/cars/${id}/`),
  createCar: (payload) => request('/admin/cars/', { method: 'POST', body: JSON.stringify(payload) }),
  updateCar: (id, payload) => request(`/admin/cars/${id}/`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteCar: (id) => request(`/admin/cars/${id}/`, { method: 'DELETE' }),

  // Car images
  uploadImage: (carId, file) => {
    const form = new FormData();
    form.append('car', carId);
    form.append('image', file);
    return request('/admin/car-images/', { method: 'POST', body: form });
  },
  deleteImage: (imageId) => request(`/admin/car-images/${imageId}/`, { method: 'DELETE' }),
  makeImagePrimary: (imageId) => request(`/admin/car-images/${imageId}/make-primary/`, { method: 'POST' }),

  // Categories
  getCategories: () => request('/admin/categories/').then(list),
  createCategory: (payload) => request('/admin/categories/', { method: 'POST', body: JSON.stringify(payload) }),
  deleteCategory: (id) => request(`/admin/categories/${id}/`, { method: 'DELETE' }),

  // Payment methods
  getPaymentMethods: () => request('/admin/payment-methods/').then(list),
  createPaymentMethod: (payload) => request('/admin/payment-methods/', { method: 'POST', body: JSON.stringify(payload) }),
  updatePaymentMethod: (id, payload) => request(`/admin/payment-methods/${id}/`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deletePaymentMethod: (id) => request(`/admin/payment-methods/${id}/`, { method: 'DELETE' }),

  // Bookings
  getBookings: (status) => request(`/admin/bookings/${status ? `?status=${status}` : ''}`).then(list),
  updateBookingStatus: (id, status) => request(`/admin/bookings/${id}/`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  deleteBooking: (id) => request(`/admin/bookings/${id}/`, { method: 'DELETE' }),

  // Customers
  getCustomers: () => request('/admin/customers/').then(list),
  deleteCustomer: (id) => request(`/admin/customers/${id}/`, { method: 'DELETE' }),

  // Messages
  getMessages: () => request('/admin/messages/').then(list),
  markMessageRead: (id) => request(`/admin/messages/${id}/`, { method: 'PATCH', body: JSON.stringify({ is_read: true }) }),
  deleteMessage: (id) => request(`/admin/messages/${id}/`, { method: 'DELETE' }),

  // Reviews
  getReviews: () => request('/admin/reviews/').then(list),
  deleteReview: (id) => request(`/admin/reviews/${id}/`, { method: 'DELETE' }),

  // Admin accounts
  getAdmins: () => request('/admin/accounts/').then(list),
  addAdmin: (payload) => request('/admin/accounts/', { method: 'POST', body: JSON.stringify(payload) }),
  deleteAdmin: (id) => request(`/admin/accounts/${id}/`, { method: 'DELETE' }),
  changePassword: (payload) => request('/admin/accounts/change-password/', { method: 'POST', body: JSON.stringify(payload) }),
};

export default adminApi;
