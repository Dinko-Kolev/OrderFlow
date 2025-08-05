import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Minus, ChefHat } from 'lucide-react'
import { api } from '../lib/api'
import { useCart } from '../contexts/CartContext'

const PizzaCustomizationModal = ({ isOpen, onClose, product }) => {
  const [toppings, setToppings] = useState({ removal: [], ingredient: [], oregano: [], sauce: [] })
  const [selectedToppings, setSelectedToppings] = useState([])
  const [specialInstructions, setSpecialInstructions] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingToppings, setLoadingToppings] = useState(true)
  const { addItem } = useCart()

  // Load available toppings
  useEffect(() => {
    if (isOpen) {
      loadToppings()
    }
  }, [isOpen])

  const loadToppings = async () => {
    setLoadingToppings(true)
    try {
      const result = await api.toppings.getAll()
      if (result.success) {
        setToppings(result.data)
      }
    } catch (error) {
      console.error('Error loading toppings:', error)
    } finally {
      setLoadingToppings(false)
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-ES', { 
      style: 'currency', 
      currency: 'EUR',
      minimumFractionDigits: 2 
    }).format(price)
  }

  const addTopping = (topping) => {
    const existing = selectedToppings.find(t => t.id === topping.id)
    if (existing) {
      setSelectedToppings(prev => 
        prev.map(t => t.id === topping.id ? { ...t, quantity: t.quantity + 1 } : t)
      )
    } else {
      setSelectedToppings(prev => [...prev, { ...topping, quantity: 1 }])
    }
  }

  const removeTopping = (toppingId) => {
    const existing = selectedToppings.find(t => t.id === toppingId)
    if (existing && existing.quantity > 1) {
      setSelectedToppings(prev => 
        prev.map(t => t.id === toppingId ? { ...t, quantity: t.quantity - 1 } : t)
      )
    } else {
      setSelectedToppings(prev => prev.filter(t => t.id !== toppingId))
    }
  }

  const clearTopping = (toppingId) => {
    setSelectedToppings(prev => prev.filter(t => t.id !== toppingId))
  }

  const calculateTotal = () => {
    const basePrice = parseFloat(product?.base_price || 0)
    const toppingsPrice = selectedToppings.reduce((total, topping) => 
      total + (parseFloat(topping.price) * topping.quantity), 0
    )
    return basePrice + toppingsPrice
  }

  const handleAddToCart = async () => {
    setLoading(true)
    try {
      const customizations = selectedToppings.map(topping => ({
        topping_id: topping.id,
        topping_name: topping.name,
        quantity: topping.quantity,
        price: parseFloat(topping.price)
      }))

      const result = await addItem(product, customizations, specialInstructions)
      
      if (result.success) {
        // Reset form
        setSelectedToppings([])
        setSpecialInstructions('')
        onClose()
      }
    } catch (error) {
      console.error('Error adding to cart:', error)
    } finally {
      setLoading(false)
    }
  }

  const renderToppingSection = (title, categoryToppings, description) => {
    if (!categoryToppings || categoryToppings.length === 0) return null

    return (
      <div className="mb-6">
        <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
          <ChefHat className="w-4 h-4 text-primary" />
          {title}
        </h3>
        {description && (
          <p className="text-sm text-gray-500 mb-3">{description}</p>
        )}
        <div className="grid grid-cols-1 gap-2">
          {categoryToppings.map((topping) => {
            const selected = selectedToppings.find(t => t.id === topping.id)
            const quantity = selected?.quantity || 0

            return (
              <div
                key={topping.id}
                className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                  quantity > 0 
                    ? 'border-primary bg-primary/5' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex-1">
                  <span className="font-medium text-gray-900">{topping.name}</span>
                  <span className="ml-2 text-primary font-semibold">
                    {parseFloat(topping.price) > 0 ? `+${formatPrice(topping.price)}` : 'Gratis'}
                  </span>
                </div>
                
                {quantity > 0 ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => removeTopping(topping.id)}
                      className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <Minus className="w-4 h-4 text-gray-500" />
                    </button>
                    <span className="font-semibold text-gray-900 min-w-[1.5rem] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => addTopping(topping)}
                      className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <Plus className="w-4 h-4 text-gray-500" />
                    </button>
                    <button
                      onClick={() => clearTopping(topping.id)}
                      className="ml-2 p-1 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => addTopping(topping)}
                    className="bg-primary text-white px-3 py-1 rounded-lg text-sm hover:bg-primary/90 transition-colors"
                  >
                    Añadir
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  if (!product) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-primary/5 to-red-500/5 rounded-t-2xl">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ChefHat className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Personaliza tu {product.name}</h2>
                    <p className="text-sm text-gray-500">Precio base: {formatPrice(product.base_price)}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {loadingToppings ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-3 text-gray-600">Cargando opciones...</span>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Removal Options */}
                    {renderToppingSection(
                      'Sin ingredientes',
                      toppings.removal,
                      'Retira ingredientes que no te gusten'
                    )}

                    {/* Extra Ingredients */}
                    {renderToppingSection(
                      'Ingredientes adicionales',
                      toppings.ingredient,
                      'Añade sabores extra a tu pizza'
                    )}

                    {/* Oregano Options */}
                    {renderToppingSection(
                      '¿Quieres orégano?',
                      toppings.oregano,
                      'Elige tu preferencia de orégano'
                    )}

                    {/* Sauce Options */}
                    {renderToppingSection(
                      'Salsa para bordes',
                      toppings.sauce,
                      'Añade sabor especial a los bordes'
                    )}

                    {/* Special Instructions */}
                    <div>
                      <h3 className="font-bold text-gray-900 mb-2">¿Algún comentario?</h3>
                      <textarea
                        value={specialInstructions}
                        onChange={(e) => setSpecialInstructions(e.target.value)}
                        placeholder="Instrucciones especiales para tu pedido..."
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                        rows={3}
                        maxLength={136}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {specialInstructions.length}/136 caracteres
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-gray-200 p-6 bg-gray-50 rounded-b-2xl">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-bold text-gray-900">Total:</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatPrice(calculateTotal())}
                  </span>
                </div>

                {/* Selected Toppings Summary */}
                {selectedToppings.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">Personalizaciones seleccionadas:</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedToppings.map((topping) => (
                        <span
                          key={topping.id}
                          className="inline-block text-xs bg-primary/10 text-primary px-2 py-1 rounded-full"
                        >
                          {topping.name} x{topping.quantity}
                          {parseFloat(topping.price) > 0 && ` (+${formatPrice(topping.price * topping.quantity)})`}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                    disabled={loading}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAddToCart}
                    disabled={loading}
                    className="flex-1 bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25 disabled:opacity-50"
                  >
                    {loading ? 'Añadiendo...' : 'Añadir al Carrito'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default PizzaCustomizationModal 