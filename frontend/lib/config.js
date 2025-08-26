// Environment Configuration - Professional approach
const config = {
  // API Configuration
  API_BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  ADMIN_API_BASE_URL: process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://localhost:3003/api/admin',
  
  // App Configuration
  APP_NAME: 'Bella Vista Restaurant',
  APP_DESCRIPTION: 'Auténtica cocina italiana con ingredientes frescos y recetas tradicionales',
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  
  // Business Configuration
  BUSINESS: {
    name: 'Bella Vista',
    phone: '(555) 123-PIZZA',
    email: 'hello@bellavista.com',
    address: 'Calle Gran Vía, 123, 28013 Madrid, España',
    hours: 'Lun-Dom: 11:00 - 23:00',
    delivery: 'Entrega hasta las 22:30'
  },
  
  // Features Flags
  FEATURES: {
    enableSocialLogin: true,
    enablePushNotifications: false,
    enableRealTimeOrders: false,
    enablePayments: false
  },
  
  // Performance Settings
  CACHE_TTL: 5 * 60 * 1000, // 5 minutes
  IMAGE_OPTIMIZATION: true,
  
  // Security Settings
  FORCE_HTTPS: process.env.NODE_ENV === 'production',
  CSRF_PROTECTION: true,
  
  // Analytics
  GOOGLE_ANALYTICS_ID: process.env.NEXT_PUBLIC_GA_ID,
  
  // Social Media
  SOCIAL: {
    facebook: '#',
    instagram: '#',
    twitter: '#'
  }
}

export default config

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  PROFILE: '/api/auth/profile',
  LOGOUT: '/api/auth/logout',
  
  // Products
  PRODUCTS: '/api/products',
  CATEGORIES: '/api/products/categories',
  
  // Orders (future)
  ORDERS: '/api/orders',
  ORDER_HISTORY: '/api/orders/history',
  
  // Health
  HEALTH: '/health'
}

// Build full API URL
export const buildApiUrl = (endpoint) => {
  return `${config.API_BASE_URL}${endpoint}`
}

// Build admin API URL
export const buildAdminApiUrl = (endpoint) => {
  return `${config.ADMIN_API_BASE_URL}${endpoint}`
} 