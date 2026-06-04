// src/services/api.js
import axios from 'axios';
import toast from 'react-hot-toast';


// Make sure this points to your backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

console.log('API Base URL:', API_BASE_URL); 


const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});



// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`Making ${config.method?.toUpperCase()} request to: ${config.url}`); // Debug log
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`Response from ${response.config.url}:`, response.status); // Debug log
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.status, error.response?.data);
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/admin/login';
      toast.error('Session expired. Please login again.');
    } else if (error.response?.status === 404) {
      console.error('Endpoint not found:', error.config?.url);
    } else if (error.code === 'ERR_NETWORK') {
      console.error('Network error - Backend might not be running');
      toast.error('Cannot connect to server. Please ensure backend is running.');
    }
    return Promise.reject(error);
  }
);

// Contact API
export const contactAPI = {
  submit: (data) => api.post('/contact/submit', data),
  getAll: () => {
    console.log('Fetching contacts from:', '/contact/submissions');
    return api.get('/contact/submissions');
  },
  updateStatus: (id, status) => api.put(`/contact/submissions/${id}/status`, { status }),
};


// src/services/api.js - Add dynamic service API
export const dynamicServiceAPI = {
  getAll: () => api.get('/dynamic-services'),
  create: (data) => api.post('/dynamic-services', data),
  update: (id, data) => api.put(`/dynamic-services/${id}`, data),
  delete: (id) => api.delete(`/dynamic-services/${id}`),
};


// Careers API
export const careersAPI = {
  getPositions: () => api.get('/careers/positions'),
  apply: (data) => api.post('/careers/apply', data),
  createPosition: (data) => api.post('/careers/positions', data),
  updatePosition: (id, data) => api.put(`/careers/positions/${id}`, data),
  deletePosition: (id) => api.delete(`/careers/positions/${id}`),
};


// Case Studies API
export const caseStudiesAPI = {
  getAll: () => {
    console.log('Fetching case studies from:', '/case-studies');
    return api.get('/case-studies');
  },
  getById: (id) => api.get(`/case-studies/${id}`),
  create: (data) => api.post('/case-studies', data),
  update: (id, data) => api.put(`/case-studies/${id}`, data),
  delete: (id) => api.delete(`/case-studies/${id}`),
};

// Admin API
// src/services/api.js - Ensure CRUD endpoints are correct

export const adminAPI = {
  // Case Studies CRUD
  createCaseStudy: (data) => api.post('/admin/case-studies', data),
  updateCaseStudy: (id, data) => api.put(`/admin/case-studies/${id}`, data),
  deleteCaseStudy: (id) => api.delete(`/admin/case-studies/${id}`),
  
  // Career Positions CRUD
  createPosition: (data) => api.post('/admin/positions', data),
  updatePosition: (id, data) => api.put(`/admin/positions/${id}`, data),
  deletePosition: (id) => api.delete(`/admin/positions/${id}`),
  
  // Contacts
  getContacts: () => api.get('/admin/contacts'),
  updateContactStatus: (id, status) => api.put(`/admin/contacts/${id}/status`, { status }),
  
  // Applications
  getApplications: () => api.get('/admin/applications'),
  updateApplicationStatus: (id, status) => api.put(`/admin/applications/${id}/status`, { status }),
  
  // Dashboard Stats
  getDashboardStats: () => api.get('/admin/dashboard/stats'),
};

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (email, password, role) => api.post('/auth/register', { email, password, role }),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
  isAuthenticated: () => !!localStorage.getItem('token'),
  isAdmin: () => {
    const user = authAPI.getCurrentUser();
    return user?.role === 'admin';
  },
};

// Chatbot API
// Chatbot API
export const chatbotAPI = {
  sendMessage: (sessionId, message, userEmail, userName, userPhone) => 
    api.post('/chatbot/message', { sessionId, message, userEmail, userName, userPhone }),
  getHistory: (sessionId) => api.get(`/chatbot/history/${sessionId}`),
  clearHistory: (sessionId) => api.delete(`/chatbot/history/${sessionId}`),
};

// src/services/api.js - Add navigation API
export const navigationAPI = {
  getAll: () => api.get('/navigation'),
  create: (data) => api.post('/navigation', data),
  update: (id, data) => api.put(`/navigation/${id}`, data),
  delete: (id) => api.delete(`/navigation/${id}`),
};

// src/services/api.js - Add hero API
export const heroAPI = {
  getSettings: () => api.get('/hero'),
  updateSettings: (data) => api.put('/hero', data),
  uploadVideo: (formData) => api.post('/hero/upload-video', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

export default api;