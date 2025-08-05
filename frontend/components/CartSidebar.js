import React from 'react'
import { useRouter } from 'next/router'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react'
import { useCart } from '../contexts/CartContext'

const CartSidebar = ({ isOpen, onClose }) => {
  const router = useRouter()
  const { items, totalItems, totalPrice, loading, updateItemQuantity, removeItem, clearCart } = useCart()

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-ES', { 
      style: 'currency', 
      currency: 'EUR',
      minimumFractionDigits: 2 
    }).format(price)
  }

  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity < 1) {
      removeItem(itemId)
    } else {
      updateItemQuantity(itemId, newQuantity)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-primary/5 to-red-500/5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <ShoppingBag className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Carrito</h2>
                  <p className="text-sm text-gray-500">
                    {totalItems} {totalItems === 1 ? 'producto' : 'productos'}
                  </p>
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
            <div className="flex-1 overflow-y-auto">
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-3 text-gray-600">Cargando carrito...</span>
                </div>
              )}

              {!loading && items.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <ShoppingBag className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Tu carrito está vacío</h3>
                  <p className="text-gray-500 mb-6">¡Añade algunos productos deliciosos!</p>
                  <button
                    onClick={onClose}
                    className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Ver Menú
                  </button>
                </div>
              )}

              {!loading && items.length > 0 && (
                <div className="p-4 space-y-4">
                  {items.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 100 }}
                      className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex gap-4">
                        {/* Product Image */}
                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          {item.product_image ? (
                            <img
                              src={item.product_image}
                              alt={item.product_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ShoppingBag className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {item.product_name}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {formatPrice(item.base_price)} base
                          </p>

                          {/* Customizations */}
                          {item.customizations && item.customizations.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-400 mb-1">Personalizaciones:</p>
                              <div className="space-y-1">
                                {item.customizations.map((custom, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-block text-xs bg-primary/10 text-primary px-2 py-1 rounded-full mr-1"
                                  >
                                    {custom.topping_name} (+{formatPrice(custom.price)})
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Special Instructions */}
                          {item.special_instructions && (
                            <p className="text-xs text-gray-500 mt-2 italic">
                              Nota: {item.special_instructions}
                            </p>
                          )}

                          {/* Quantity and Price */}
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                                disabled={loading}
                              >
                                <Minus className="w-4 h-4 text-gray-500" />
                              </button>
                              <span className="font-semibold text-gray-900 min-w-[2rem] text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                                disabled={loading}
                              >
                                <Plus className="w-4 h-4 text-gray-500" />
                              </button>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-primary">
                                {formatPrice(item.total_price * item.quantity)}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-2 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors self-start"
                          disabled={loading}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {!loading && items.length > 0 && (
              <div className="border-t border-gray-200 p-6 bg-white">
                <div className="space-y-4">
                  {/* Total */}
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span className="text-gray-900">Total:</span>
                    <span className="text-primary">{formatPrice(totalPrice)}</span>
                  </div>

                  {/* Actions */}
                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        onClose()
                        router.push('/checkout')
                      }}
                      className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
                    >
                      Proceder al Pago
                    </button>
                    <button
                      onClick={clearCart}
                      className="w-full border border-gray-300 text-gray-700 py-2 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                      disabled={loading}
                    >
                      Vaciar Carrito
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default CartSidebar 