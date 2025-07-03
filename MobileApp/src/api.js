import { CONFIG, getApiUrl } from './config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = `${CONFIG.API_BASE_URL}/api`;

export const fetchData = async (endpoint, options = {}) => {
  try {
    // Get token from storage for authenticated requests
    const token = await AsyncStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN);
    
    // Prepare headers
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add authorization header if token exists
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Handle different response types
    const contentType = response.headers.get('content-type');
    let data;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      // Handle different error scenarios
      if (response.status === 401) {
        // Unauthorized - clear token and redirect to login
        await AsyncStorage.removeItem(CONFIG.STORAGE_KEYS.TOKEN);
        await AsyncStorage.removeItem(CONFIG.STORAGE_KEYS.USER);
        throw new Error('Session expired. Please login again.');
      } else if (response.status === 403) {
        throw new Error('Access denied. You do not have permission to perform this action.');
      } else if (response.status === 404) {
        throw new Error('Resource not found.');
      } else if (response.status >= 500) {
        throw new Error('Server error. Please try again later.');
      } else {
        throw new Error(data.error || data.message || 'Something went wrong');
      }
    }

    return data;
  } catch (error) {
    console.error('API Error:', error.message);
    
    // Handle network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error. Please check your internet connection.');
    }
    
    throw error;
  }
};

// Helper function for image uploads
export const uploadImage = async (imageUri, endpoint = '/upload') => {
  try {
    const token = await AsyncStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN);
    
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'upload.jpg',
    });

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Upload failed');
    }

    return data;
  } catch (error) {
    console.error('Upload Error:', error.message);
    throw error;
  }
};

// Helper function for file uploads
export const uploadFile = async (fileUri, fileName, endpoint = '/upload') => {
  try {
    const token = await AsyncStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN);
    
    const formData = new FormData();
    formData.append('file', {
      uri: fileUri,
      type: 'application/octet-stream',
      name: fileName,
    });

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Upload failed');
    }

    return data;
  } catch (error) {
    console.error('File Upload Error:', error.message);
    throw error;
  }
};