// Admin Dashboard API Client
const API_BASE_URL = process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://localhost:3003/api/admin'

// Helper function to get auth token from localStorage
const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('admin_token')
    console.log('🔑 getAuthToken() called:', {
      hasWindow: typeof window !== 'undefined',
      tokenExists: !!token,
      tokenPreview: token ? token.substring(0, 20) + '...' : 'null',
      fullToken: token
    })
    return token
  }
  console.log('🔑 getAuthToken() called - no window object')
  return null
}

// Helper function to handle API requests
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`
  const token = getAuthToken()
  
  console.log('🌐 apiRequest() called:', {
    endpoint,
    url,
    hasToken: !!token,
    tokenPreview: token ? token.substring(0, 20) + '...' : 'null',
    options
  })
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  }
  
  console.log('📤 Request config:', {
    url,
    headers: config.headers,
    method: config.method || 'GET'
  })

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body)
  }

  try {
    console.log('🚀 Making fetch request to:', url)
    const response = await fetch(url, config)
    console.log('📥 Response received:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries())
    })
    
    const data = await response.json()
    console.log('📄 Response data:', data)
    
    if (!response.ok) {
      console.error('❌ API request failed:', {
        status: response.status,
        statusText: response.statusText,
        data
      })
      
      // Handle authentication errors
      if (response.status === 401) {
        console.log('🔒 Authentication failed - redirecting to login')
        // Token expired or invalid, redirect to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('admin_token')
          localStorage.removeItem('admin_user')
          window.location.href = '/login'
        }
        throw new Error('Authentication failed. Please login again.')
      }
      
      throw new Error(data.message || data.error || `HTTP error! status: ${response.status}`)
    }
    
    console.log('✅ API request successful:', data)
    return data
  } catch (error) {
    console.error(`❌ API request failed: ${endpoint}`, error)
    throw error
  }
}

export const reservations = {
  // Get all reservations
  getAll: async (params = {}) => {
    const searchParams = new URLSearchParams(params)
    return apiRequest(`/reservations?${searchParams}`)
  },

  // Get reservation by ID
  getById: async (id) => {
    return apiRequest(`/reservations/${id}`)
  },

  // Create new reservation
  create: async (reservationData) => {
    return apiRequest('/reservations', {
      method: 'POST',
      body: reservationData,
    })
  },

  // Update reservation
  update: async (id, reservationData) => {
    return apiRequest(`/reservations/${id}`, {
      method: 'PUT',
      body: reservationData,
    })
  },

  // Delete/Cancel reservation
  delete: async (id) => {
    return apiRequest(`/reservations/${id}`, {
      method: 'DELETE',
    })
  },

  // Mark arrival
  markArrival: async (id, arrivalData) => {
    return apiRequest(`/reservations/${id}/arrival`, {
      method: 'PUT',
      body: arrivalData,
    })
  },

  // Mark departure
  markDeparture: async (id, departureData) => {
    return apiRequest(`/reservations/${id}/departure`, {
      method: 'PUT',
      body: departureData,
    })
  },

  // Get calendar view
  getCalendar: async (params = {}) => {
    const searchParams = new URLSearchParams(params)
    return apiRequest(`/reservations/calendar?${searchParams}`)
  },

  // Get today's reservations
  getToday: async () => {
    return apiRequest('/reservations/today')
  },

  // Get statistics
  getStatistics: async () => {
    return apiRequest('/reservations/statistics')
  },

  // Get utilization data
  getUtilization: async (date) => {
    return apiRequest(`/reservations/utilization?date=${date}`)
  },

  // Get analytics
  getAnalytics: async () => {
    return apiRequest('/reservations/analytics/duration')
  },
}

export const tables = {
  // Get all tables
  getAll: async () => {
    return apiRequest('/tables')
  },

  // Get table by ID
  getById: async (id) => {
    return apiRequest(`/tables/${id}`)
  },

  // Create new table
  create: async (tableData) => {
    return apiRequest('/tables', {
      method: 'POST',
      body: tableData,
    })
  },

  // Update table
  update: async (id, tableData) => {
    return apiRequest(`/tables/${id}`, {
      method: 'PUT',
      body: tableData,
    })
  },

  // Delete table
  delete: async (id) => {
    return apiRequest(`/tables/${id}`, {
      method: 'DELETE',
    })
  },
}

// Dashboard API methods
export const dashboard = {
  // Get dashboard statistics
  getStats: async () => {
    return apiRequest('/dashboard')
  },

  // Get sales analytics
  getSalesAnalytics: async () => {
    return apiRequest('/dashboard/sales')
  },

  // Get top products
  getTopProducts: async () => {
    return apiRequest('/dashboard/top-products')
  },

  // Get recent activity
  getRecentActivity: async () => {
    return apiRequest('/dashboard/recent-activity')
  },

  // Get current month revenue
  getCurrentMonthRevenue: async () => {
    return apiRequest('/dashboard/current-month-revenue')
  },

  // Get previous month revenue
  getPreviousMonthRevenue: async () => {
    return apiRequest('/dashboard/previous-month-revenue')
  },

  // Get current month orders
  getCurrentMonthOrders: async () => {
    return apiRequest('/dashboard/current-month-orders')
  },

  // Get previous month orders
  getPreviousMonthOrders: async () => {
    return apiRequest('/dashboard/previous-month-orders')
  },

  // Get current month customers
  getCurrentMonthCustomers: async () => {
    return apiRequest('/dashboard/current-month-customers')
  },

  // Get previous month customers
  getPreviousMonthCustomers: async () => {
    return apiRequest('/dashboard/previous-month-customers')
  }
}

// Orders API methods
export const orders = {
  // Get all orders
  getAll: async (params = {}) => {
    const searchParams = new URLSearchParams(params)
    return apiRequest(`/orders?${searchParams}`)
  },

  // Get order by ID
  getById: async (id) => {
    return apiRequest(`/orders/${id}`)
  },

  // Get order items
  getItems: async (id) => {
    return apiRequest(`/orders/${id}/items`)
  },

  // Create new order
  create: async (orderData) => {
    return apiRequest('/orders', {
      method: 'POST',
      body: orderData,
    })
  },

  // Update order
  update: async (id, orderData) => {
    return apiRequest(`/orders/${id}`, {
      method: 'PUT',
      body: orderData,
    })
  },

  // Update order status
  updateStatus: async (id, status) => {
    return apiRequest(`/orders/${id}/status`, {
      method: 'PUT',
      body: { status },
    })
  },

  // Delete order
  delete: async (id) => {
    return apiRequest(`/orders/${id}`, {
      method: 'DELETE',
    })
  }
}

// Categories API methods
export const categories = {
  // Get all categories
  getAll: async () => {
    return apiRequest('/categories')
  },

  // Get category by ID
  getById: async (id) => {
    return apiRequest(`/categories/${id}`)
  },

  // Create new category
  create: async (categoryData) => {
    return apiRequest('/categories', {
      method: 'POST',
      body: categoryData,
    })
  },

  // Update category
  update: async (id, categoryData) => {
    return apiRequest(`/categories/${id}`, {
      method: 'PUT',
      body: categoryData,
    })
  },

  // Delete category
  delete: async (id) => {
    return apiRequest(`/categories/${id}`, {
      method: 'DELETE',
    })
  }
}

// Products API methods
export const products = {
  // Get all products
  getAll: async (params = {}) => {
    const searchParams = new URLSearchParams(params)
    return apiRequest(`/products?${searchParams}`)
  },

  // Get product by ID
  getById: async (id) => {
    return apiRequest(`/products/${id}`)
  },

  // Create new product
  create: async (productData) => {
    return apiRequest('/products', {
      method: 'POST',
      body: productData,
    })
  },

  // Update product
  update: async (id, productData) => {
    return apiRequest(`/products/${id}`, {
      method: 'PUT',
      body: productData,
    })
  },

  // Delete product
  delete: async (id) => {
    return apiRequest(`/products/${id}`, {
      method: 'DELETE',
    })
  }
}

// Customers API methods
export const customers = {
  // Get all customers
  getAll: async (params = {}) => {
    const searchParams = new URLSearchParams(params)
    return apiRequest(`/customers?${searchParams}`)
  },

  // Get customer by ID
  getById: async (id) => {
    return apiRequest(`/customers/${id}`)
  },

  // Create new customer
  create: async (customerData) => {
    return apiRequest('/customers', {
      method: 'POST',
      body: customerData,
    })
  },

  // Update customer
  update: async (id, customerData) => {
    return apiRequest(`/customers/${id}`, {
      method: 'PUT',
      body: customerData,
    })
  },

  // Delete customer
  delete: async (id) => {
    return apiRequest(`/customers/${id}`, {
      method: 'DELETE',
    })
  }
}

// Restaurant API methods
export const restaurant = {
  // Get restaurant configuration
  getConfig: async () => {
    return apiRequest('/restaurant/config')
  },

  // Update restaurant configuration
  updateConfig: async (configData) => {
    return apiRequest('/restaurant/config', {
      method: 'PUT',
      body: configData,
    })
  },

  // Get working hours
  getWorkingHours: async () => {
    return apiRequest('/restaurant/working-hours')
  },

  // Update working hours for a specific day
  updateWorkingHours: async (dayOfWeek, hoursData) => {
    return apiRequest(`/restaurant/working-hours/${dayOfWeek}`, {
      method: 'PUT',
      body: hoursData,
    })
  },

  // Get policies
  getPolicies: async () => {
    return apiRequest('/restaurant/policies')
  },

  // Update a specific policy
  updatePolicy: async (policyName, policyData) => {
    return apiRequest(`/restaurant/policies/${policyName}`, {
      method: 'PUT',
      body: policyData,
    })
  }
}

export default {
  reservations,
  tables,
  dashboard,
  orders,
  categories,
  products,
  customers,
  restaurant,
}
