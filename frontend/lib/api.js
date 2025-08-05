import config, { buildApiUrl, API_ENDPOINTS } from './config'

// Professional API Client with error handling, retries, and caching
class ApiClient {
  constructor() {
    this.cache = new Map()
    this.retryCount = 3
    this.retryDelay = 1000
  }

  // Generic request method with professional error handling
  async request(endpoint, options = {}) {
    const url = buildApiUrl(endpoint)
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      credentials: 'include',
      ...options
    }

    let lastError
    
    // Retry logic for failed requests
    for (let attempt = 0; attempt <= this.retryCount; attempt++) {
      try {
        const response = await fetch(url, defaultOptions)
        
        // Handle different HTTP status codes professionally
        if (response.ok) {
          const data = await response.json()
          return { success: true, data }
        }
        
        // Handle specific error codes
        const errorData = await response.json().catch(() => ({}))
        
        switch (response.status) {
          case 400:
            return { success: false, error: errorData.error || 'Datos inválidos' }
          case 401:
            return { success: false, error: 'No autorizado', redirect: '/login' }
          case 403:
            return { success: false, error: 'Acceso denegado' }
          case 404:
            return { success: false, error: 'Recurso no encontrado' }
          case 429:
            return { success: false, error: 'Demasiadas solicitudes. Inténtalo más tarde.' }
          case 500:
            throw new Error('Error interno del servidor')
          default:
            throw new Error(`Error ${response.status}: ${response.statusText}`)
        }
        
      } catch (error) {
        lastError = error
        
        // Don't retry on client errors (4xx)
        if (error.name === 'TypeError' || error.message.includes('400')) {
          break
        }
        
        // Wait before retrying
        if (attempt < this.retryCount) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * (attempt + 1)))
        }
      }
    }
    
    // Return final error after all retries failed
    return { 
      success: false, 
      error: 'Error de conexión. Verifica tu internet e inténtalo de nuevo.',
      originalError: lastError
    }
  }

  // GET request with caching
  async get(endpoint, options = {}) {
    const cacheKey = `${endpoint}${JSON.stringify(options)}`
    
    // Check cache first
    if (options.cache !== false && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)
      if (Date.now() - cached.timestamp < config.CACHE_TTL) {
        return cached.data
      }
    }
    
    const result = await this.request(endpoint, { method: 'GET', ...options })
    
    // Cache successful results
    if (result.success && options.cache !== false) {
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      })
    }
    
    return result
  }

  // POST request
  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options
    })
  }

  // PUT request
  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options
    })
  }

  // DELETE request
  async delete(endpoint, options = {}) {
    return this.request(endpoint, {
      method: 'DELETE',
      ...options
    })
  }

  // Add authentication token to requests
  setAuthToken(token) {
    this.authToken = token
  }

  // Get authenticated headers
  getAuthHeaders() {
    return this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {}
  }

  // Clear cache
  clearCache() {
    this.cache.clear()
  }
}

// Create singleton instance
const apiClient = new ApiClient()

// Professional API methods following REST conventions
export const api = {
  // Authentication endpoints
  auth: {
    login: (credentials) => apiClient.post(API_ENDPOINTS.LOGIN, credentials),
    register: (userData) => apiClient.post(API_ENDPOINTS.REGISTER, userData),
    getProfile: () => apiClient.get(API_ENDPOINTS.PROFILE, {
      headers: apiClient.getAuthHeaders()
    }),
    logout: () => apiClient.post(API_ENDPOINTS.LOGOUT, {}, {
      headers: apiClient.getAuthHeaders()
    })
  },

  // Products endpoints
  products: {
    getAll: () => apiClient.get(API_ENDPOINTS.PRODUCTS),
    getCategories: () => apiClient.get(API_ENDPOINTS.CATEGORIES),
    getById: (id) => apiClient.get(`${API_ENDPOINTS.PRODUCTS}/${id}`)
  },

  // Orders endpoints (future)
  orders: {
    create: (orderData) => apiClient.post(API_ENDPOINTS.ORDERS, orderData, {
      headers: apiClient.getAuthHeaders()
    }),
    getHistory: () => apiClient.get(API_ENDPOINTS.ORDER_HISTORY, {
      headers: apiClient.getAuthHeaders()
    })
  },

  // Reservations endpoints  
  reservations: {
    create: (reservationData) => apiClient.post('/api/reservations', reservationData),
    getAvailability: (date) => apiClient.get(`/api/reservations/availability/${date}`),
    getUserReservations: () => apiClient.get('/api/reservations/user', {
      headers: apiClient.getAuthHeaders()
    }),
    cancel: (reservationId) => apiClient.put(`/api/reservations/${reservationId}/cancel`, {}, {
      headers: apiClient.getAuthHeaders()
    })
  },

  // Cart endpoints
  cart: {
    get: (sessionId) => apiClient.get('/api/cart', {
      headers: {
        ...apiClient.getAuthHeaders(),
        'X-Session-ID': sessionId || localStorage.getItem('cart_session_id')
      }
    }),
    addItem: (itemData) => apiClient.post('/api/cart/items', itemData, {
      headers: {
        ...apiClient.getAuthHeaders(),
        'X-Session-ID': itemData.session_id || localStorage.getItem('cart_session_id')
      }
    }),
    updateItem: (itemId, updateData) => apiClient.put(`/api/cart/items/${itemId}`, updateData, {
      headers: apiClient.getAuthHeaders()
    }),
    removeItem: (itemId) => apiClient.delete(`/api/cart/items/${itemId}`, {
      headers: apiClient.getAuthHeaders()
    }),
    clear: (sessionId) => apiClient.delete('/api/cart', {
      headers: {
        ...apiClient.getAuthHeaders(),
        'X-Session-ID': sessionId || localStorage.getItem('cart_session_id')
      }
    })
  },

  // Toppings endpoints for pizza customization
  toppings: {
    getAll: () => apiClient.get('/api/toppings')
  },

  // Order endpoints
  orders: {
    create: (orderData) => apiClient.post('/api/orders', orderData, {
      timeout: 30000 // 30 seconds for order creation
    }),
    getByNumber: (orderNumber) => apiClient.get(`/api/orders/${orderNumber}`),
    getUserOrders: (userId, email) => {
      const params = new URLSearchParams()
      if (userId) params.append('userId', userId)
      if (email) params.append('email', email)
      return apiClient.get(`/api/orders?${params.toString()}`)
    },
    updateStatus: (orderNumber, status, notes) => apiClient.put(`/api/orders/${orderNumber}/status`, {
      status,
      notes
    }),
    cancel: (orderNumber, reason) => apiClient.put(`/api/orders/${orderNumber}/cancel`, {
      reason
    })
  },

  // Health check
  health: () => apiClient.get(API_ENDPOINTS.HEALTH),

  // Utility methods
  setAuthToken: (token) => apiClient.setAuthToken(token),
  clearCache: () => apiClient.clearCache()
}

export default api 