import axios, { AxiosError } from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('emi_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Redirect to login on 401
api.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('emi_token');
      localStorage.removeItem('emi_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default api;

// ── Auth ────────────────────────────────────────────────────────────────────

export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string; turnstileToken?: string }) =>
    api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data: { token: string; password: string }) =>
    api.post('/auth/reset-password', data),
  resendVerification: () => api.post('/auth/resend-verification'),
};

// ── Dashboard ───────────────────────────────────────────────────────────────

export const dashboardApi = {
  getStats: () => api.get('/dashboard'),
};

// ── Loans ───────────────────────────────────────────────────────────────────

export const loansApi = {
  list: (params?: object) => api.get('/loans', { params }),
  datatable: (params?: object) => api.get('/loans/datatable', { params }),
  get: (id: string) => api.get(`/loans/${id}`),
  create: (data: object) => api.post('/loans', data),
  update: (id: string, data: object) => api.put(`/loans/${id}`, data),
  delete: (id: string) => api.delete(`/loans/${id}`),
  foreclose: (id: string) => api.post(`/loans/${id}/foreclose`),
};

// ── EMIs ────────────────────────────────────────────────────────────────────

export const emisApi = {
  markStatus: (data: { id: string; status: 'pending' | 'paid' }) =>
    api.post('/emis/mark-status', data),
  bulkUpdate: (data: { loanDetailId: string; emiDetails: object[] }) =>
    api.post('/emis/bulk-update', data),
  skip: (data: { emiId: string; loanId: string }) => api.post('/emis/skip', data),
};

// ── Documents ───────────────────────────────────────────────────────────────

export const documentsApi = {
  upload: (loanId: string, formData: FormData) =>
    api.post(`/loans/${loanId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  delete: (docId: string) => api.delete(`/loans/documents/${docId}`),
};

// ── Contact ─────────────────────────────────────────────────────────────────

export const contactApi = {
  submit: (data: { name: string; email: string; subject: string; message: string }) =>
    api.post('/contact', data),
};

// ── Profile ─────────────────────────────────────────────────────────────────

export const profileApi = {
  get: () => api.get('/profile'),
  update: (data: { name: string; email: string }) => api.patch('/profile', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put('/profile/password', data),
  deleteAccount: () => api.delete('/profile'),
};
