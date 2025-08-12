import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import { ArrowLeft, ShoppingBag, User, MapPin, CreditCard, Clock, Check, AlertCircle } from 'lucide-react'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'

export default function CheckoutPage() {
  const router = useRouter()
  const { items, totalItems, totalPrice, clearCart } = useCart()
  const { user } = useAuth()
  
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [step, setStep] = useState(1) // 1: Info, 2: Payment, 3: Confirmation
  
  // Form data
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    deliveryType: 'delivery',
    deliveryAddress: '',
    paymentMethod: 'card',
    specialInstructions: ''
  })

  // Default address state (from user's saved addresses)
  const [autoFilledAddress, setAutoFilledAddress] = useState(false)

  // Populate form with user data when user is available
  useEffect(() => {
    if (user) {
      console.log('User data available:', user)
      setFormData(prev => ({
        ...prev,
        customerName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        customerEmail: user.email || '',
        customerPhone: user.phone || ''
      }))
    }
  }, [user])

  // Prefill default address when delivery is selected
  useEffect(() => {
    const fetchDefaultAddress = async () => {
      if (!user?.id || formData.deliveryType !== 'delivery') return
      try {
        const res = await api.addresses.getForUser(user.id)
        const list = res?.data?.addresses || res?.addresses || res?.data || []
        if (Array.isArray(list) && list.length > 0) {
          const def = list.find(a => a.is_default) || list[0]
          if (def && !formData.deliveryAddress) {
            const formatted = `${def.street}, ${def.zip_code} ${def.city}, ${def.state}`
            setFormData(prev => ({ ...prev, deliveryAddress: formatted }))
            setAutoFilledAddress(true)
          }
        }
      } catch (e) {
        console.error('Failed to load default address', e)
      }
    }
    fetchDefaultAddress()
    // run when user id or deliveryType changes
  }, [user?.id, formData.deliveryType])

  // Redirect if cart is empty
  useEffect(() => {
    if (totalItems === 0) {
      router.push('/menu')
    }
  }, [totalItems, router])

  // Calculate fees and total
  const deliveryFee = formData.deliveryType === 'delivery' ? 2.50 : 0
  const finalTotal = totalPrice + deliveryFee

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-ES', { 
      style: 'currency', 
      currency: 'EUR',
      minimumFractionDigits: 2 
    }).format(price)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.customerName.trim()) {
      newErrors.customerName = 'El nombre es obligatorio'
    }

    if (!formData.customerEmail.trim()) {
      newErrors.customerEmail = 'El email es obligatorio'
    } else if (!/\S+@\S+\.\S+/.test(formData.customerEmail)) {
      newErrors.customerEmail = 'Email inválido'
    }

    if (!formData.customerPhone.trim()) {
      newErrors.customerPhone = 'El teléfono es obligatorio'
    }

    if (formData.deliveryType === 'delivery' && !formData.deliveryAddress.trim()) {
      newErrors.deliveryAddress = 'La dirección de entrega es obligatoria'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      // Debug: Log cart items structure before mapping
      console.log('=== CART ITEMS DEBUG ===')
      console.log('Raw cart items:', items)
      console.log('First item structure:', items[0] ? Object.keys(items[0]) : 'No items')
      if (items[0]) {
        console.log('First item details:', {
          product_id: items[0].product_id,
          base_price: items[0].base_price,
          unit_price: items[0].unit_price,
          total_price: items[0].total_price,
          price: items[0].price,
          quantity: items[0].quantity
        })
      }
      console.log('=== END DEBUG ===')

      // Prepare order data
      const orderData = {
        userId: user?.id || null,
        guestEmail: !user ? formData.customerEmail : null,
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        customerEmail: formData.customerEmail,
        deliveryType: formData.deliveryType,
        deliveryAddress: formData.deliveryAddress,
        paymentMethod: formData.paymentMethod,
        specialInstructions: formData.specialInstructions,
        items: items.map(item => ({
          productId: item.product_id,
          quantity: item.quantity,
          unitPrice: item.base_price || item.price || item.unit_price || 0,
          totalPrice: item.total_price || (item.price || item.unit_price || 0) * item.quantity || 0,
          customizations: item.customizations || [],
          specialInstructions: item.special_instructions || ''
        }))
      }

      // Debug: Log the order data being sent
      console.log('Order data being sent:', orderData)
      console.log('Cart items:', items)
      console.log('User data:', user)

      const response = await api.orders.create(orderData)
      
      // Debug: Log the response to see its structure
      console.log('API Response:', response)

      if (response.success) {
        // Clear cart
        await clearCart()
        
        // Redirect to order confirmation
        // Check if response.order exists and has orderNumber, otherwise use response.orderNumber directly
        const orderNumber = response.order?.orderNumber || response.orderNumber
        if (orderNumber) {
          router.push(`/order/${orderNumber}`)
        } else {
          console.error('No order number received from API')
          setErrors({ submit: 'Error: No se recibió número de pedido del servidor.' })
        }
      }

    } catch (error) {
      console.error('Error creating order:', error)
      setErrors({ submit: 'Error al procesar el pedido. Inténtalo de nuevo.' })
    } finally {
      setLoading(false)
    }
  }

  if (totalItems === 0) {
    return null // Will redirect
  }



  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-white/50 transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Finalizar Pedido</h1>
            <p className="text-gray-600">{totalItems} productos en tu carrito</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Order Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              

              
              {/* Customer Information */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900">Información Personal</h2>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      name="customerName"
                      value={formData.customerName}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                        errors.customerName ? 'border-red-500' : 'border-gray-300'
                      } ${user ? 'bg-green-50' : ''}`}
                      placeholder="Tu nombre completo"
                    />
                    {errors.customerName && (
                      <p className="text-red-500 text-sm mt-1">{errors.customerName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono *
                    </label>
                    <input
                      type="tel"
                      name="customerPhone"
                      value={formData.customerPhone}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                        errors.customerPhone ? 'border-red-500' : 'border-gray-300'
                      } ${user ? 'bg-green-50' : ''}`}
                      placeholder="600 123 456"
                    />
                    {errors.customerPhone && (
                      <p className="text-red-500 text-sm mt-1">{errors.customerPhone}</p>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="customerEmail"
                    value={formData.customerEmail}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                      errors.customerEmail ? 'border-red-500' : 'border-gray-300'
                    } ${user ? 'bg-green-50' : ''}`}
                    placeholder="tu@email.com"
                  />
                  {errors.customerEmail && (
                    <p className="text-red-500 text-sm mt-1">{errors.customerEmail}</p>
                  )}
                </div>
              </div>

              {/* Delivery Options */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Opciones de Entrega</h2>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div
                    onClick={() => setFormData(prev => ({ ...prev, deliveryType: 'delivery' }))}
                    className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      formData.deliveryType === 'delivery'
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">Delivery</h3>
                        <p className="text-sm text-gray-600">Entrega a domicilio</p>
                        <p className="text-sm font-medium text-primary">30-45 min • {formatPrice(2.50)}</p>
                      </div>
                      {formData.deliveryType === 'delivery' && (
                        <Check className="w-5 h-5 text-primary" />
                      )}
                    </div>
                  </div>

                  <div
                    onClick={() => setFormData(prev => ({ ...prev, deliveryType: 'pickup' }))}
                    className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      formData.deliveryType === 'pickup'
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">Recoger</h3>
                        <p className="text-sm text-gray-600">Recoge en restaurante</p>
                        <p className="text-sm font-medium text-primary">15-25 min • Gratis</p>
                      </div>
                      {formData.deliveryType === 'pickup' && (
                        <Check className="w-5 h-5 text-primary" />
                      )}
                    </div>
                  </div>
                </div>

                {formData.deliveryType === 'delivery' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dirección de Entrega *
                    </label>
                    <textarea
                      name="deliveryAddress"
                      value={formData.deliveryAddress}
                      onChange={handleInputChange}
                      rows={3}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-colors resize-none ${
                        errors.deliveryAddress ? 'border-red-500' : 'border-gray-300'
                      } ${autoFilledAddress ? 'bg-green-50' : ''}`}
                      placeholder="Calle, número, piso, puerta, código postal, ciudad..."
                    />
                    {errors.deliveryAddress && (
                      <p className="text-red-500 text-sm mt-1">{errors.deliveryAddress}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Método de Pago</h2>
                </div>

                <div className="space-y-3">
                  <div
                    onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'card' }))}
                    className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      formData.paymentMethod === 'card'
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-5 h-5 text-gray-600" />
                        <div>
                          <h3 className="font-semibold text-gray-900">Tarjeta de Crédito/Débito</h3>
                          <p className="text-sm text-gray-600">Pago seguro online</p>
                        </div>
                      </div>
                      {formData.paymentMethod === 'card' && (
                        <Check className="w-5 h-5 text-primary" />
                      )}
                    </div>
                  </div>

                  <div
                    onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'cash' }))}
                    className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      formData.paymentMethod === 'cash'
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">€</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Efectivo</h3>
                          <p className="text-sm text-gray-600">Pagar al recibir</p>
                        </div>
                      </div>
                      {formData.paymentMethod === 'cash' && (
                        <Check className="w-5 h-5 text-primary" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Special Instructions */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Instrucciones Especiales</h2>
                <textarea
                  name="specialInstructions"
                  value={formData.specialInstructions}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-colors resize-none"
                  placeholder="¿Alguna instrucción especial para tu pedido? (Opcional)"
                />
              </div>

              {/* Submit Button */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                {errors.submit && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <p className="text-red-700">{errors.submit}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-primary to-red-500 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-primary/90 hover:to-red-500/90 transition-all duration-300 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Procesando Pedido...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-3">
                      <ShoppingBag className="w-5 h-5" />
                      Confirmar Pedido • {formatPrice(finalTotal)}
                    </div>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Resumen del Pedido</h2>

              {/* Items */}
              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3">
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
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-gray-900">{item.product_name}</h3>
                      <p className="text-xs text-gray-600">Cantidad: {item.quantity}</p>
                      {item.customizations && item.customizations.length > 0 && (
                        <p className="text-xs text-gray-500">Con personalizaciones</p>
                      )}
                      <p className="text-sm font-bold text-primary mt-1">{formatPrice(item.total_price)}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pricing */}
              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatPrice(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Gastos de envío</span>
                  <span className="font-medium">{formatPrice(deliveryFee)}</span>
                </div>
                <div className="border-t border-gray-200 pt-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">{formatPrice(finalTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Estimated Time */}
              <div className="mt-6 p-4 bg-primary/5 rounded-xl">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-semibold text-primary">Tiempo estimado</p>
                    <p className="text-sm text-gray-600">
                      {formData.deliveryType === 'delivery' ? '30-45 minutos' : '15-25 minutos'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 