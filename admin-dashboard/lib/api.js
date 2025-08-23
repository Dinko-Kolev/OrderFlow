// Admin Dashboard API Client
const API_BASE_URL = process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://localhost:3001/api/admin'

// Helper function to handle API requests
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body)
  }

  try {
    const response = await fetch(url, config)
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.message || data.error || `HTTP error! status: ${response.status}`)
    }
    
    return data
  } catch (error) {
    console.error(`API request failed: ${endpoint}`, error)
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

export default {
  reservations,
  tables,
}
