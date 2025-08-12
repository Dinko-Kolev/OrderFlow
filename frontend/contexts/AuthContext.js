import React, { createContext, useContext, useState, useEffect } from 'react'
import api from '../lib/api'

const AuthContext = createContext()

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(null)

  // Load user from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token')
    const savedUser = localStorage.getItem('user_data')
    
    if (savedToken && savedUser) {
      try {
        setToken(savedToken)
        setUser(JSON.parse(savedUser))
        // Ensure API client sends Authorization header on page reloads
        api.setAuthToken(savedToken)
      } catch (error) {
        console.error('Error parsing saved user data:', error)
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user_data')
      }
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    try {
      const result = await api.auth.login({ email, password })

      if (!result.success) {
        return { success: false, error: result.error }
      }

      const { user, token } = result.data

      // Save to state and localStorage
      setUser(user)
      setToken(token)
      localStorage.setItem('auth_token', token)
      localStorage.setItem('user_data', JSON.stringify(user))
      
      // Set token for future API calls
      api.setAuthToken(token)

      return { success: true, user }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'Error de conexión. Inténtalo de nuevo.' }
    }
  }

  const register = async (userData) => {
    try {
      const result = await api.auth.register(userData)

      if (!result.success) {
        return { success: false, error: result.error }
      }

      const { user, token } = result.data

      // Save to state and localStorage
      setUser(user)
      setToken(token)
      localStorage.setItem('auth_token', token)
      localStorage.setItem('user_data', JSON.stringify(user))
      
      // Set token for future API calls
      api.setAuthToken(token)

      return { success: true, user }
    } catch (error) {
      console.error('Registration error:', error)
      return { success: false, error: 'Error de conexión. Inténtalo de nuevo.' }
    }
  }

  // Fetch fresh profile from backend and update context/localStorage
  const refreshProfile = async () => {
    try {
      const res = await api.auth.getProfile()
      const fresh = res?.data || res
      const normalized = fresh?.id !== undefined ? {
        id: fresh.id,
        firstName: fresh.firstName,
        lastName: fresh.lastName,
        email: fresh.email,
        phone: fresh.phone
      } : (fresh?.user || null)
      if (normalized) {
        setUser(normalized)
        localStorage.setItem('user_data', JSON.stringify(normalized))
        return normalized
      }
    } catch (e) {
      console.error('Failed to refresh profile', e)
    }
    return user
  }

  // Immediately update user in context + localStorage (client-side optimistic)
  const updateUser = (partial) => {
    setUser(prev => {
      const updated = { ...(prev || {}), ...(partial || {}) }
      try {
        localStorage.setItem('user_data', JSON.stringify(updated))
      } catch {}
      return updated
    })
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_data')
  }

  const getAuthHeaders = () => {
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    refreshProfile,
    updateUser,
    getAuthHeaders,
    isAuthenticated: !!user,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 