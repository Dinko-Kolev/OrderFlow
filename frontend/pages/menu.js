import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ShoppingBag, Filter, Star, Clock } from 'lucide-react'
import { api } from '../lib/api'
import { useCart } from '../contexts/CartContext'
import NavBar from '../components/ui/tubelight-navbar'
import CartSidebar from '../components/CartSidebar'
import PizzaCustomizationModal from '../components/PizzaCustomizationModal'

export default function Menu() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [cartOpen, setCartOpen] = useState(false)
  const [customizationModal, setCustomizationModal] = useState({ open: false, product: null })
  
  const { totalItems, addItem } = useCart()

  useEffect(() => {
    loadMenuData()
  }, [])

  const loadMenuData = async () => {
    setLoading(true)
    try {
      const [productsResult, categoriesResult] = await Promise.all([
        api.products.getAll(),
        api.products.getCategories()
      ])

      if (productsResult.success) {
        setProducts(productsResult.data)
      }

      if (categoriesResult.success) {
        setCategories(categoriesResult.data)
      }
    } catch (error) {
      console.error('Error loading menu:', error)
      setError('Error al cargar el menú')
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-ES', { 
      style: 'currency', 
      currency: 'EUR',
      minimumFractionDigits: 2 
    }).format(price)
  }

  const filteredProducts = selectedCategory 
    ? products.filter(product => product.category_name === selectedCategory)
    : products

  const handleAddToCart = (product) => {
    // Only "Pizza a tu gusto" is customizable
    if (product.category_id === 1 && product.name === 'Pizza a tu gusto') {
      setCustomizationModal({ open: true, product })
    } else {
      // All other products (including fixed pizzas) add directly to cart
      addItem(product, [], '')
    }
  }

  const openCartSidebar = () => {
    setCartOpen(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
        <NavBar />
        <div className="flex items-center justify-center pt-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-xl text-gray-600">Cargando menú delicioso...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
        <NavBar />
        <div className="flex items-center justify-center pt-20">
          <div className="text-center">
            <p className="text-xl text-red-600">{error}</p>
            <button 
              onClick={loadMenuData}
              className="mt-4 bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <NavBar />
      
      {/* Floating Cart Button */}
      {totalItems > 0 && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={openCartSidebar}
          className="fixed bottom-6 right-6 z-30 bg-primary text-white p-4 rounded-full shadow-lg shadow-primary/25 hover:bg-primary/90 transition-colors"
        >
          <div className="relative">
            <ShoppingBag className="w-6 h-6" />
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full min-w-[1.25rem] h-5 flex items-center justify-center px-1">
              {totalItems}
            </span>
          </div>
        </motion.button>
      )}
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
          >
            Nuestro Menú
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-600 max-w-2xl mx-auto"
          >
            Descubre nuestros auténticos sabores italianos, preparados con ingredientes frescos y recetas tradicionales
          </motion.p>
        </div>

        {/* Category Filter */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap gap-3 justify-center mb-12"
        >
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 flex items-center gap-2 ${
              selectedCategory === '' 
                ? 'bg-primary text-white shadow-lg shadow-primary/25' 
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <Filter className="w-4 h-4" />
            Todos
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.name)}
              className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
                selectedCategory === category.name 
                  ? 'bg-primary text-white shadow-lg shadow-primary/25' 
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {category.name}
            </button>
          ))}
        </motion.div>

        {/* Products Grid */}
        <motion.div 
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8"
        >
          {filteredProducts.map((product, index) => (
            <motion.div
              key={product.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden group border border-gray-100 hover:border-primary/20 flex flex-col h-full"
            >
              {/* Product Image */}
              <div className="relative h-72 overflow-hidden flex-shrink-0">
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                {/* Gradient Overlay for better text visibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
                
                {/* Category Badge */}
                <div className="absolute top-6 left-6">
                  <span className="bg-white/95 backdrop-blur-sm text-primary px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                    {product.category_name}
                  </span>
                </div>

                {/* Price Badge */}
                <div className="absolute bottom-6 right-6">
                  <div className="bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
                    <span className="text-xl font-bold text-primary">
                      {product.category_id === 1 ? 'desde ' : ''}{formatPrice(product.base_price)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Product Info - Flex grow to push button to bottom */}
              <div className="p-8 flex flex-col flex-grow">
                <div className="flex-grow">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-primary transition-colors duration-300">
                    {product.name}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">{product.description}</p>
                </div>
                
                {/* Action Button - Always at bottom */}
                <div className="mt-6 pt-4">
                  <button
                    onClick={() => handleAddToCart(product)}
                    className="w-full bg-gradient-to-r from-primary to-red-500 text-white px-8 py-4 rounded-2xl font-bold hover:from-primary/90 hover:to-red-500/90 transition-all duration-300 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transform hover:scale-105 flex items-center justify-center gap-3 group/button"
                  >
                    <ShoppingBag className="w-5 h-5 group-hover/button:scale-110 transition-transform duration-300" />
                    <span className="text-lg">
                      {product.category_id === 1 && product.name === 'Pizza a tu gusto' ? 'Personalizar Pizza' : 'Añadir al Carrito'}
                    </span>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {filteredProducts.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-xl text-gray-600">No se encontraron productos en esta categoría.</p>
          </motion.div>
        )}
      </div>

      {/* Cart Sidebar */}
      <CartSidebar isOpen={cartOpen} onClose={() => setCartOpen(false)} />

      {/* Pizza Customization Modal */}
      <PizzaCustomizationModal
        isOpen={customizationModal.open}
        onClose={() => setCustomizationModal({ open: false, product: null })}
        product={customizationModal.product}
      />
    </div>
  )
} 