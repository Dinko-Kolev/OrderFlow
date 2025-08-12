import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { api } from '../lib/api'
import { useAuth } from './AuthContext'

// Cart Context
const CartContext = createContext()

// Action types
const CART_ACTIONS = {
  SET_CART: 'SET_CART',
  ADD_ITEM: 'ADD_ITEM', 
  UPDATE_ITEM: 'UPDATE_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  CLEAR_CART: 'CLEAR_CART',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR'
}

// Initial state
const initialState = {
  items: [],
  totalItems: 0,
  totalPrice: 0,
  loading: false,
  error: null,
  cartId: null,
  sessionId: null
}

// Cart reducer
function cartReducer(state, action) {
  switch (action.type) {
    case CART_ACTIONS.SET_CART:
      return {
        ...state,
        ...action.payload,
        loading: false,
        error: null
      }
    
    case CART_ACTIONS.ADD_ITEM:
      const newItems = [...state.items, action.payload]
      return {
        ...state,
        items: newItems,
        totalItems: calculateTotalItems(newItems),
        totalPrice: calculateTotalPrice(newItems),
        loading: false
      }
    
    case CART_ACTIONS.UPDATE_ITEM:
      const updatedItems = state.items.map(item =>
        item.id === action.payload.id ? { ...item, ...action.payload } : item
      )
      return {
        ...state,
        items: updatedItems,
        totalItems: calculateTotalItems(updatedItems),
        totalPrice: calculateTotalPrice(updatedItems),
        loading: false
      }
    
    case CART_ACTIONS.REMOVE_ITEM:
      const filteredItems = state.items.filter(item => item.id !== action.payload)
      return {
        ...state,
        items: filteredItems,
        totalItems: calculateTotalItems(filteredItems),
        totalPrice: calculateTotalPrice(filteredItems),
        loading: false
      }
    
    case CART_ACTIONS.CLEAR_CART:
      return {
        ...state,
        items: [],
        totalItems: 0,
        totalPrice: 0,
        loading: false
      }
    
    case CART_ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload }
    
    case CART_ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, loading: false }
    
    default:
      return state
  }
}

// Helper functions
function calculateTotalItems(items) {
  return items.reduce((total, item) => total + item.quantity, 0)
}

function calculateTotalPrice(items) {
  return items.reduce((total, item) => total + (item.total_price * item.quantity), 0)
}

function generateSessionId() {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

// Cart Provider
export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState)
  const { user } = useAuth()

  // Generate session ID for guest users
  useEffect(() => {
    if (!state.sessionId) {
      const sessionId = generateSessionId()
      dispatch({ type: CART_ACTIONS.SET_CART, payload: { sessionId } })
      localStorage.setItem('cart_session_id', sessionId)
    }
  }, [state.sessionId])

  // Load cart on mount
  useEffect(() => {
    loadCart()
  }, [user])

  // Sync cart to localStorage whenever it changes
  useEffect(() => {
    if (state.items.length > 0 || state.cartId) {
      localStorage.setItem('cart', JSON.stringify({
        items: state.items,
        totalItems: state.totalItems,
        totalPrice: state.totalPrice,
        cartId: state.cartId,
        sessionId: state.sessionId
      }))
    }
  }, [state.items, state.totalItems, state.totalPrice, state.cartId, state.sessionId])

  // Load cart from localStorage or server
  const loadCart = async () => {
    dispatch({ type: CART_ACTIONS.SET_LOADING, payload: true })
    
    try {
      // First try to load from localStorage
      const localCart = localStorage.getItem('cart')
      if (localCart) {
        const cartData = JSON.parse(localCart)
        dispatch({ type: CART_ACTIONS.SET_CART, payload: cartData })
      }

      // If user is logged in, sync with server
      if (user) {
        const result = await api.cart.get()
        if (result.success && result.data) {
          console.log('Cart loaded from server:', result.data)
          // Transform server data to match local structure
          const transformedCart = {
            ...result.data,
            items: result.data.items?.map(item => ({
              ...item,
              base_price: item.base_price || item.price || item.unit_price || 0,
              total_price: item.total_price || (item.price || item.unit_price || 0) * item.quantity
            })) || []
          }
          console.log('Transformed cart:', transformedCart)
          dispatch({ type: CART_ACTIONS.SET_CART, payload: transformedCart })
        }
      }
    } catch (error) {
      console.error('Error loading cart:', error)
      dispatch({ type: CART_ACTIONS.SET_ERROR, payload: 'Error loading cart' })
    }
  }

  // Add item to cart
  const addItem = async (product, customizations = [], specialInstructions = '') => {
    dispatch({ type: CART_ACTIONS.SET_LOADING, payload: true })
    
    try {
      // Calculate total price including customizations
      const customizationPrice = customizations.reduce((total, custom) => 
        total + (custom.price * custom.quantity), 0
      )
      
      const item = {
        product_id: product.id,
        product_name: product.name,
        product_image: product.image_url,
        quantity: 1,
        base_price: parseFloat(product.base_price),
        total_price: parseFloat(product.base_price) + customizationPrice,
        special_instructions: specialInstructions,
        customizations: customizations
      }

      // Add to local state immediately for responsive UI
      const tempId = Date.now() // Temporary ID for local state
      dispatch({ type: CART_ACTIONS.ADD_ITEM, payload: { ...item, id: tempId } })

      // Sync to server if user is logged in
      if (user) {
        const result = await api.cart.addItem({
          ...item,
          session_id: state.sessionId
        })
        
        if (result.success) {
          // Update with real ID from server
          dispatch({ type: CART_ACTIONS.UPDATE_ITEM, payload: { 
            id: tempId, 
            id: result.data.id 
          } })
        }
      }

      return { success: true }
    } catch (error) {
      console.error('Error adding item to cart:', error)
      dispatch({ type: CART_ACTIONS.SET_ERROR, payload: 'Error adding item to cart' })
      return { success: false, error: error.message }
    }
  }

  // Update item quantity
  const updateItemQuantity = async (itemId, quantity) => {
    if (quantity <= 0) {
      return removeItem(itemId)
    }

    dispatch({ type: CART_ACTIONS.SET_LOADING, payload: true })
    
    try {
      // Update local state
      dispatch({ type: CART_ACTIONS.UPDATE_ITEM, payload: { id: itemId, quantity } })

      // Sync to server if user is logged in
      if (user) {
        await api.cart.updateItem(itemId, { quantity })
      }

      return { success: true }
    } catch (error) {
      console.error('Error updating cart item:', error)
      dispatch({ type: CART_ACTIONS.SET_ERROR, payload: 'Error updating cart item' })
      return { success: false, error: error.message }
    }
  }

  // Remove item from cart
  const removeItem = async (itemId) => {
    dispatch({ type: CART_ACTIONS.SET_LOADING, payload: true })
    
    try {
      // Update local state
      dispatch({ type: CART_ACTIONS.REMOVE_ITEM, payload: itemId })

      // Sync to server if user is logged in
      if (user) {
        await api.cart.removeItem(itemId)
      }

      return { success: true }
    } catch (error) {
      console.error('Error removing cart item:', error)
      dispatch({ type: CART_ACTIONS.SET_ERROR, payload: 'Error removing cart item' })
      return { success: false, error: error.message }
    }
  }

  // Clear entire cart
  const clearCart = async () => {
    dispatch({ type: CART_ACTIONS.SET_LOADING, payload: true })
    
    try {
      // Clear local state
      dispatch({ type: CART_ACTIONS.CLEAR_CART })

      // Clear localStorage
      localStorage.removeItem('cart')

      // Sync to server if user is logged in
      if (user) {
        await api.cart.clear()
      }

      return { success: true }
    } catch (error) {
      console.error('Error clearing cart:', error)
      dispatch({ type: CART_ACTIONS.SET_ERROR, payload: 'Error clearing cart' })
      return { success: false, error: error.message }
    }
  }

  const value = {
    // State
    items: state.items,
    totalItems: state.totalItems,
    totalPrice: state.totalPrice,
    loading: state.loading,
    error: state.error,
    
    // Actions
    addItem,
    updateItemQuantity,
    removeItem,
    clearCart,
    loadCart
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

// Hook to use cart context
export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
} 