// Configuration file for environment variables and API settings
export const CONFIG = {
  // API Base URL - Change this to your backend server URL
  API_BASE_URL: 'http://192.168.0.124:4000',
  
  // App Configuration
  APP_NAME: 'Freelance Hive',
  APP_VERSION: '1.0.0',
  
  // API Endpoints
  ENDPOINTS: {
    USERS: '/users',
    LOGIN: '/users/login',
    PROFILE: '/profile',
    GIGS: '/gigs',
    ORDERS: '/orders',
    MESSAGES: '/messages',
    PAYMENTS: '/payments',
  },
  
  // Storage Keys
  STORAGE_KEYS: {
    USER: 'user',
    TOKEN: 'token',
    SETTINGS: 'settings',
  },
  
  // UI Configuration
  UI: {
    PRIMARY_COLOR: '#007BFF',
    SUCCESS_COLOR: '#28a745',
    WARNING_COLOR: '#ffc107',
    DANGER_COLOR: '#dc3545',
    LIGHT_BG: '#f8f9fa',
    DARK_TEXT: '#2c3e50',
    LIGHT_TEXT: '#7f8c8d',
  },
};

// Helper function to get full API URL
export const getApiUrl = (endpoint) => {
  return `${CONFIG.API_BASE_URL}${endpoint}`;
};

// Helper function to get image URL
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  return `${CONFIG.API_BASE_URL}${imagePath}`;
};

export default CONFIG; 