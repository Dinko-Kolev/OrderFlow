import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, ShoppingBag, User, MapPin, CreditCard, Clock, Check, AlertCircle, Plus, ChevronDown } from 'lucide-react'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'
import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import PaymentForm from '../components/PaymentForm'
import CAPTCHA from '../components/CAPTCHA'
import AddressModal from '../components/AddressModal'

export default function CheckoutPage() {
  const router = useRouter()
  const { items, totalItems, totalPrice, clearCart } = useCart()
  const { user } = useAuth()
  
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [step, setStep] = useState(1) // 1: Info, 2: Payment, 3: Confirmation
  
  // Stripe configuration
  const [stripePromise] = useState(() => loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY))
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [paymentError, setPaymentError] = useState(null)
  
  // Form data
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    deliveryType: 'delivery',
    deliveryAddress: '',
    selectedAddressId: null,
    paymentMethod: 'card',
    specialInstructions: ''
  })

  // CAPTCHA state for guest orders
  const [captchaToken, setCaptchaToken] = useState(null)
  const [captchaVerified, setCaptchaVerified] = useState(false)
  const [captchaLoading, setCaptchaLoading] = useState(false)
  const captchaRef = useRef(null)

  // Address management state
  const [addresses, setAddresses] = useState([])
  const [addressesLoading, setAddressesLoading] = useState(false)
  const [showAddressModal, setShowAddressModal] = useState(false)

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

  // Fetch user addresses
  const fetchAddresses = async () => {
    if (!user?.id) return
    try {
      setAddressesLoading(true)
      const res = await api.addresses.getForUser(user.id)
      const list = res?.data?.addresses || res?.addresses || res?.data || []
      setAddresses(Array.isArray(list) ? list : [])
    } catch (e) {
      console.error('Failed to load addresses', e)
      setAddresses([])
    } finally {
      setAddressesLoading(false)
    }
  }

  // Load addresses when user is available
  useEffect(() => {
    if (user?.id && formData.deliveryType === 'delivery') {
      fetchAddresses()
    }
  }, [user?.id, formData.deliveryType])

  // Prefill default address when delivery is selected
  useEffect(() => {
    if (formData.deliveryType === 'delivery' && addresses.length > 0) {
      const defaultAddr = addresses.find(a => a.is_default) || addresses[0]
      if (defaultAddr && !formData.deliveryAddress) {
        const formatted = `${defaultAddr.street}, ${defaultAddr.zip_code} ${defaultAddr.city}, ${defaultAddr.state}`
        setFormData(prev => ({ 
          ...prev, 
          deliveryAddress: formatted,
          selectedAddressId: defaultAddr.id
        }))
        setAutoFilledAddress(true)
      }
    }
  }, [formData.deliveryType, addresses])

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

    // CAPTCHA validation for guest orders
    if (!user && !captchaToken) {
      newErrors.captcha = 'Completa la verificación CAPTCHA para continuar'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Payment handlers
  const handlePaymentSuccess = (paymentResult) => {
    console.log('✅ Payment successful:', paymentResult);
    setPaymentSuccess(true);
    setPaymentError(null);
    setStep(3); // Move to confirmation step
  };

  const handlePaymentError = (error) => {
    console.error('❌ Payment failed:', error);
    setPaymentError(error.message || 'Payment failed');
    setPaymentSuccess(false);
  };

  const handlePaymentProcessing = (isProcessing) => {
    setLoading(isProcessing);
  };

  // Address management functions
  const handleAddressSelect = (address) => {
    const formatted = `${address.street}, ${address.zip_code} ${address.city}, ${address.state}`
    setFormData(prev => ({ 
      ...prev, 
      deliveryAddress: formatted,
      selectedAddressId: address.id
    }))
  }

  const deleteAddress = async (id) => {
    try {
      await api.addresses.delete(user.id, id)
      fetchAddresses()
    } catch (e) {
      console.error('Failed to delete address', e)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    // Move to payment step instead of submitting directly
    setStep(2);
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
                  <h2 className="text-xl font-bold text-gray-900">Información Personal</h2>
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
                      }`}
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
                      }`}
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
                    }`}
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
                  <div className="space-y-4">
                    {/* Manual Address Input */}
                    <div className="pt-2">
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
                        }`}
                        placeholder="Calle, número, piso, puerta, código postal, ciudad..."
                      />
                      {errors.deliveryAddress && (
                        <p className="text-red-500 text-sm mt-1">{errors.deliveryAddress}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

                             {/* Address Selection - Full Width Like Profile Page */}
               {formData.deliveryType === 'delivery' && user && (
                 <div className="bg-white rounded-2xl shadow-lg p-6">
                   <div className="mt-8 space-y-4">
                     <div className="flex items-center justify-between">
                       <h3 className="text-xl font-bold text-gray-800">📍 Direcciones</h3>
                       <button 
                         type="button"
                         onClick={() => setShowAddressModal(true)}
                         disabled={addresses.length >= 4}
                         className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${
                           addresses.length >= 4 
                             ? 'bg-gray-300 text-gray-600 cursor-not-allowed' 
                             : 'bg-primary text-white hover:bg-primary/90'
                         }`}
                       >
                         Añadir
                       </button>
                     </div>
                     
                     {addressesLoading ? (
                       <p className="text-gray-500">Cargando...</p>
                     ) : addresses.length === 0 ? (
                       <p className="text-gray-600">No tienes direcciones guardadas.</p>
                     ) : (
                       <div className="grid md:grid-cols-2 gap-4">
                         {addresses.slice(0, 4).map(addr => (
                           <div 
                             key={addr.id} 
                             className={`border rounded-xl p-4 flex flex-col cursor-pointer transition-all ${
                               formData.selectedAddressId === addr.id 
                                 ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                                 : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                             }`}
                             onClick={() => handleAddressSelect(addr)}
                           >
                             <div>
                               <div className="flex items-center justify-between">
                                 <p className="font-semibold text-gray-900 truncate mr-2">{addr.street}</p>
                                 {addr.is_default && (
                                   <span className="inline-flex items-center text-xs px-2 py-0.5 rounded bg-green-100 text-green-700 whitespace-nowrap">
                                     Predeterminada
                                   </span>
                                 )}
                               </div>
                               <p className="mt-1 text-sm text-gray-600 break-words">{addr.city}, {addr.state} {addr.zip_code}</p>
                             </div>
                             <div className="flex flex-wrap gap-2 justify-end mt-3">
                               <button 
                                 type="button"
                                 className="px-3 py-1 rounded-lg bg-gray-100 text-sm hover:bg-gray-200"
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   setShowAddressModal(true);
                                   // TODO: Pass address to modal for editing
                                 }}
                               >
                                 Editar
                               </button>
                               <button 
                                 type="button"
                                 className="px-3 py-1 rounded-lg bg-red-500 text-white text-sm hover:bg-red-600"
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   if (confirm('¿Estás seguro de que quieres eliminar esta dirección?')) {
                                     deleteAddress(addr.id);
                                   }
                                 }}
                               >
                                 Eliminar
                               </button>
                             </div>
                           </div>
                         ))}
                       </div>
                     )}
                     
                     <p className="text-xs text-gray-500">Máximo 4 direcciones guardadas.</p>
                   </div>
                 </div>
               )}

              {/* CAPTCHA for Guest Orders */}
              {!user && (
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-4 h-4 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Verificación de Seguridad</h2>
                  </div>
                  <p className="text-gray-600 mb-4">
                    Completa la verificación CAPTCHA para continuar
                  </p>
                  <CAPTCHA
                    onVerify={setCaptchaToken}
                    onTimeout={() => setCaptchaToken(null)}
                  />
                </div>
              )}

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

                {errors.captcha && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <p className="text-red-700">{errors.captcha}</p>
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

          {/* Payment Step */}
          {step === 2 && (
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Pago Seguro</h2>
                </div>

                {paymentError && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <p className="text-red-700">{paymentError}</p>
                  </div>
                )}

                {formData.paymentMethod === 'card' ? (
                  <Elements stripe={stripePromise}>
                    <PaymentForm
                      amount={finalTotal}
                      onSuccess={handlePaymentSuccess}
                      onError={handlePaymentError}
                      onProcessing={handlePaymentProcessing}
                      customerData={{
                        customerName: formData.customerName,
                        customerEmail: formData.customerEmail,
                        customerPhone: formData.customerPhone,
                        deliveryType: formData.deliveryType,
                        deliveryAddress: formData.deliveryAddress,
                        specialInstructions: formData.specialInstructions,
                        items: items.map(item => ({
                          productId: item.product_id,
                          quantity: item.quantity,
                          unitPrice: item.base_price || item.total_price,
                          totalPrice: item.total_price,
                          customizations: item.customizations || [],
                          specialInstructions: item.special_instructions || ''
                        }))
                      }}
                    />
                  </Elements>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Check className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Pago en Efectivo</h3>
                    <p className="text-gray-600 mb-6">Pagarás al recibir tu pedido</p>
                    <button
                      onClick={() => setStep(3)}
                      className="bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
                    >
                      Continuar
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Resumen del Pedido</h2>

              {/* Items */}
              <div className="space-y-4 mb-6">
                {items.map((item) => {
                  console.log('Cart item in checkout:', item); // Debug log
                  return (
                  <div key={item.id} className="flex gap-3">
                    <img
                      src={item.product_image || item.image_url || item.image || '/placeholder-pizza.jpg'}
                      alt={item.product_name || item.name}
                      className="w-16 h-16 object-cover rounded-lg"
                      onError={(e) => {
                        e.target.src = '/placeholder-pizza.jpg'
                      }}
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-sm">{item.product_name || item.name}</h3>
                      <p className="text-xs text-gray-600">Cantidad: {item.quantity}</p>
                      {item.customizations && item.customizations.length > 0 && (
                        <p className="text-xs text-gray-500">Con personalizaciones</p>
                      )}
                      <p className="text-sm font-bold text-primary mt-1">{formatPrice(item.total_price || item.price)}</p>
                    </div>
                  </div>
                  );
                })}
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

        {/* Confirmation Step */}
        {step === 3 && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Pedido Confirmado!</h2>
                <p className="text-gray-600 mb-6">
                  {paymentSuccess 
                    ? 'Tu pago ha sido procesado exitosamente.'
                    : 'Tu pedido ha sido recibido y será procesado.'
                  }
                </p>
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      clearCart();
                      router.push('/menu');
                    }}
                    className="w-full bg-primary text-white py-3 px-6 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
                  >
                    Volver al Menú
                  </button>
                  <button
                    onClick={() => {
                      clearCart();
                      router.push('/');
                    }}
                    className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                  >
                    Ir al Inicio
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Address Modal */}
        <AddressModal
          isOpen={showAddressModal}
          onClose={() => setShowAddressModal(false)}
          userId={user?.id}
          addresses={addresses}
          onAddressesChange={fetchAddresses}
          onAddressSelect={handleAddressSelect}
          showSelectionMode={true}
        />
      </div>
    </div>
  )
} 