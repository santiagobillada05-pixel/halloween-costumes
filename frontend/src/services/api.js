import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Interceptor para unwrap de respuesta
api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const message =
      err.response?.data?.error ||
      err.response?.data?.errors?.[0]?.msg ||
      err.message ||
      'Error de conexión';
    return Promise.reject(new Error(message));
  }
);

// ─── Costumes ─────────────────────────────────────────────────
export const costumesApi = {
  getAll:  (params) => api.get('/costumes', { params }),
  getById: (id)     => api.get(`/costumes/${id}`),
  create:  (data)   => api.post('/costumes', data),
  update:  (id, data) => api.put(`/costumes/${id}`, data),
  delete:  (id)     => api.delete(`/costumes/${id}`),
};

// ─── Transactions ─────────────────────────────────────────────
export const transactionsApi = {
  getAll:   (params) => api.get('/transactions', { params }),
  create:   (data)   => api.post('/transactions', data),
  getStats: ()       => api.get('/transactions/stats/summary'),
};

// ─── Bot ──────────────────────────────────────────────────────
export const botApi = {
  chat: (message) => api.post('/bot/chat', { message }),
};
