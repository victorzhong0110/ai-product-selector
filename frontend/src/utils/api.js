import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
})

// Request interceptor — attach JWT token if present
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

// Response interceptor
api.interceptors.response.use(
  response => response.data,
  error => {
    const message = error.response?.data?.detail || error.message || 'Unknown error'
    // If 401, clear stale token
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
    }
    return Promise.reject(new Error(message))
  }
)

// ─── Analysis API ─────────────────────────────────────

export const analysisApi = {
  list:         (params) => api.get('/analyses', { params }),
  get:          (id)     => api.get(`/analyses/${id}`),
  create:       (data)   => api.post('/analyses', data),
  update:       (id, data) => api.patch(`/analyses/${id}`, data),
  delete:       (id)     => api.delete(`/analyses/${id}`),
  reanalyze:    (id)     => api.post(`/analyses/${id}/reanalyze`),
  getSentiment: (id)     => api.get(`/analyses/${id}/sentiment`),

  // Tags on an analysis
  getTags:   (id)         => api.get(`/analyses/${id}/tags`),
  addTag:    (id, tag_id) => api.post(`/analyses/${id}/tags`, { tag_id }),
  removeTag: (id, tag_id) => api.delete(`/analyses/${id}/tags/${tag_id}`),

  // Exports
  exportShopify:    (id) => api.get(`/analyses/${id}/export/shopify`),
  exportWooCommerce:(id) => api.get(`/analyses/${id}/export/woocommerce`),
}

// ─── Dashboard API ────────────────────────────────────

export const dashboardApi = {
  getStats:     () => api.get('/dashboard'),
  getCategories:() => api.get('/categories'),
  health:       () => api.get('/health'),
}

// ─── Auth API ─────────────────────────────────────────

export const authApi = {
  login:    (email, password)           => api.post('/auth/login',    { email, password }),
  register: (email, username, password) => api.post('/auth/register', { email, username, password }),
  me:       ()                          => api.get('/auth/me'),
}

// ─── Settings API ─────────────────────────────────────

export const settingsApi = {
  get:  ()     => api.get('/settings'),
  save: (data) => api.put('/settings', data),
}

// ─── Tags API ─────────────────────────────────────────

export const tagsApi = {
  list:   ()           => api.get('/tags'),
  create: (name, color)=> api.post('/tags', { name, color }),
  delete: (id)         => api.delete(`/tags/${id}`),
}

// ─── Tracking API ─────────────────────────────────────

export const trackingApi = {
  list:        ()              => api.get('/tracking'),
  subscribe:   (analysis_id, frequency_hours, notify_threshold) =>
                 api.post('/tracking', { analysis_id, frequency_hours, notify_threshold }),
  unsubscribe: (id)            => api.delete(`/tracking/${id}`),
}

export default api
