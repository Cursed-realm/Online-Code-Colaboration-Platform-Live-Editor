// API utility with axios
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Add token to headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// Project endpoints
export const projectAPI = {
  create: (data) => api.post('/projects', data),
  joinProject: (roomId) => api.post(`/projects/${roomId}/join`),
  getProject: (roomId) => api.get(`/projects/${roomId}`),
  getUserProjects: () => api.get('/projects/user/projects'),
  updateProject: (roomId, data) => api.put(`/projects/${roomId}`, data),
  deleteProject: (roomId) => api.delete(`/projects/${roomId}`),
};

// GitHub endpoints
export const githubAPI = {
  getRepositories: () => api.get('/github/repositories'),
  getUser: () => api.get('/github/user'),
  pushToGithub: (data) => api.post('/github/push', data),
};

export default api;
