import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api',
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth-token');
    if (token) {
        config.headers['auth-token'] = token;
    }
    return config;
});

export default api;
