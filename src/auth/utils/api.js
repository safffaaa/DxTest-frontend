import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:5000',
  // timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      // Send only the token as that's what's working in the actual requests
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
instance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      console.error('API Error:', error.response.data);
      if (error.response.status === 401) {
        // Handle unauthorized access
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Network Error:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// API methods
export const registerUser = async (formData) => {
  try {
    const response = await instance.post('/api/register', formData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const loginUser = async (credentials) => {
  try {
    const response = await instance.post('/api/login', credentials);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Country API methods
export const getCountries = async () => {
  try {
    const response = await instance.get('/api/countries');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createCountry = async (countryData) => {
  try {
    const response = await instance.post('/api/countries', countryData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateCountry = async (id, countryData) => {
  try {
    const response = await instance.put(`/api/countries/${id}`, countryData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteCountry = async (id) => {
  try {
    const response = await instance.delete(`/api/countries/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export default instance;