import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
})

// Request interceptor
api.interceptors.request.use(
  config => config,
  error => Promise.reject(error)
)

// Response interceptor
api.interceptors.response.use(
  response => response.data,
  error => {
    const message = error.response?.data?.detail || error.message || 'Unknown error'
    return Promise.reject(new Error(message))
  }
)

export const analysisApi = {
  list: (params) => api.get('/analyses', { params }),
  get: (id) => api.get(`/analyses/${id}`),
  create: (data) => api.post('/analyses', data),
  update: (id, data) => api.patch(`/analyses/${id}`, data),
  delete: (id) => api.delete(`/analyses/${id}`),
  reanalyze: (id) => api.post(`/analyses/${id}/reanalyze`),
  getSentiment: (id) => api.get(`/analyses/${id}/sentiment`),
}

export const dashboardApi = {
  getStats: () => api.get('/dashboard'),
  getCategories: () => api.get('/categories'),
  health: () => api.get('/health'),
}

export default api
