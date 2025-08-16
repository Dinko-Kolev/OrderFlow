import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, ShoppingBag, User, MapPin, CreditCard, Clock, Check, AlertCircle, Plus, ChevronDown } from 'lucide-react'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'
import CAPTCHA from '../components/CAPTCHA'

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
  const [addressForm, setAddressForm] = useState({
    street: '',
    city: '',
    state: '',
    zip_code: '',
    is_default: false
  })
  const [addressErrors, setAddressErrors] = useState({})
  const [showAddressDropdown, setShowAddressDropdown] = useState(false)
  const [addressSuccessMessage, setAddressSuccessMessage] = useState('')

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
  }, [addresses, formData.deliveryType])

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

  // Handle address selection from dropdown
  const handleAddressSelect = (address) => {
    const formatted = `${address.street}, ${address.zip_code} ${address.city}, ${address.state}`
    setFormData(prev => ({
      ...prev,
      deliveryAddress: formatted,
      selectedAddressId: address.id
    }))
    setShowAddressDropdown(false)
    setAutoFilledAddress(true)
  }

  // Handle manual address input
  const handleManualAddressInput = (e) => {
    setFormData(prev => ({
      ...prev,
      deliveryAddress: e.target.value,
      selectedAddressId: null
    }))
    setAutoFilledAddress(false)
    
    // Clear any success message when user starts typing manually
    if (addressSuccessMessage) {
      setAddressSuccessMessage('')
    }
  }

  // Address form validation
  const validateAddressForm = () => {
    const errs = {}
    if (!addressForm.street.trim()) errs.street = 'Requerido'
    if (!addressForm.city.trim()) errs.city = 'Requerido'
    if (!addressForm.state.trim()) errs.state = 'Requerido'
    if (!addressForm.zip_code.trim()) errs.zip_code = 'Requerido'
    setAddressErrors(errs)
    return Object.keys(errs).length === 0
  }

  // CAPTCHA verification for guest orders
  const handleCaptchaVerify = (token) => {
    try {
      // Validate token
      if (!token || typeof token !== 'string') {
        console.error('❌ Invalid CAPTCHA token received:', token);
        setErrors(prev => ({ ...prev, captcha: 'Error en la verificación CAPTCHA. Inténtalo de nuevo.' }));
        setCaptchaLoading(false);
        return;
      }

      // Log successful verification
      console.log('✅ CAPTCHA verified with token:', token.substring(0, 20) + '...');
      
      // Update state
      setCaptchaToken(token);
      setCaptchaVerified(true);
      setCaptchaLoading(false);
      
      // Clear any previous CAPTCHA errors
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.captcha;
        return newErrors;
      });
      
    } catch (error) {
      console.error('❌ CAPTCHA verification error:', error);
      setErrors(prev => ({ ...prev, captcha: 'Error en la verificación CAPTCHA. Inténtalo de nuevo.' }));
      setCaptchaLoading(false);
    }
  }

  // CAPTCHA timeout handler
  const handleCaptchaTimeout = () => {
    console.log('⏰ CAPTCHA verification timeout');
    setCaptchaLoading(false);
    setErrors(prev => ({ ...prev, captcha: 'Tiempo de espera agotado. Inténtalo de nuevo.' }));
  }

  // Save new address
  const saveAddress = async () => {
    try {
      if (!validateAddressForm()) return
      
      const res = await api.addresses.create(user.id, addressForm)
      if (res?.success) {
        // Refresh addresses and select the new one
        await fetchAddresses()
        setShowAddressModal(false)
        
        // Find the newly created address and select it
        const newAddress = res.data || res
        if (newAddress) {
          handleAddressSelect(newAddress)
          setAddressSuccessMessage('¡Dirección creada y seleccionada exitosamente!')
          setTimeout(() => setAddressSuccessMessage(''), 5000) // Hide after 5 seconds
        }
      } else {
        alert(res?.error || 'No se pudo guardar la dirección')
      }
    } catch (e) {
      console.error('Failed to save address', e)
      alert('Error de conexión al guardar la dirección')
    }
  }

  // Reset address form
  const resetAddressForm = () => {
    setAddressForm({
      street: '',
      city: '',
      state: '',
      zip_code: '',
      is_default: false
    })
    setAddressErrors({})
  }

  // Open address creation modal
  const openAddressModal = () => {
    resetAddressForm()
    setShowAddressModal(true)
  }

  // Enhanced form validation with security checks
  const validateForm = () => {
    const newErrors = {}

    // Enhanced name validation
    if (!formData.customerName.trim()) {
      newErrors.customerName = 'El nombre es obligatorio'
    } else if (formData.customerName.trim().length < 2) {
      newErrors.customerName = 'El nombre debe tener al menos 2 caracteres'
    } else if (formData.customerName.trim().length > 100) {
      newErrors.customerName = 'El nombre no puede exceder 100 caracteres'
    } else if (/\d/.test(formData.customerName.trim())) {
      newErrors.customerName = 'El nombre no puede contener números'
    } else if (!/^[a-zA-ZÀ-ÿ\s'-]+$/.test(formData.customerName.trim())) {
      newErrors.customerName = 'El nombre solo puede contener letras, espacios, guiones y apóstrofes'
    }

    // Enhanced email validation
    if (!formData.customerEmail.trim()) {
      newErrors.customerEmail = 'El email es obligatorio'
    } else if (!/\S+@\S+\.\S+/.test(formData.customerEmail)) {
      newErrors.customerEmail = 'Email inválido'
    } else if (formData.customerEmail.trim().length > 254) {
      newErrors.customerEmail = 'El email no puede exceder 254 caracteres'
    } else if (formData.customerEmail.includes('..') || formData.customerEmail.includes('--')) {
      newErrors.customerEmail = 'Formato de email inválido'
    }

    // Enhanced phone validation
    if (!formData.customerPhone.trim()) {
      newErrors.customerPhone = 'El teléfono es obligatorio'
    } else if (!/^[+]?[\d\s\-()]{8,20}$/.test(formData.customerPhone)) {
      newErrors.customerPhone = 'Formato de teléfono inválido (8-20 dígitos)'
    } else if (formData.customerPhone.replace(/[\d\s\-()]/g, '').length > 0) {
      newErrors.customerPhone = 'El teléfono solo puede contener números, espacios, guiones y paréntesis'
    }

    // Enhanced address validation for delivery
    if (formData.deliveryType === 'delivery') {
      if (!formData.deliveryAddress.trim()) {
        newErrors.deliveryAddress = 'La dirección de entrega es obligatoria'
      } else if (formData.deliveryAddress.trim().length < 10) {
        newErrors.deliveryAddress = 'La dirección debe tener al menos 10 caracteres'
      } else if (formData.deliveryAddress.trim().length > 500) {
        newErrors.deliveryAddress = 'La dirección no puede exceder 500 caracteres'
      }
    }

    // CAPTCHA verification required for guest orders
    if (!user && !captchaVerified) {
      newErrors.captcha = 'Verificación CAPTCHA requerida para pedidos sin registro'
    }

    // Anti-spam: Check for suspicious patterns
    const suspiciousPatterns = [
      /test/i,
      /example/i,
      /fake/i,
      /spam/i,
      /bot/i,
      /admin/i,
      /root/i,
      /guest/i,
      /user/i
    ]
    
    if (suspiciousPatterns.some(pattern => pattern.test(formData.customerName))) {
      newErrors.customerName = 'Nombre no válido'
    }
    
    if (suspiciousPatterns.some(pattern => pattern.test(formData.customerEmail))) {
      newErrors.customerEmail = 'Email no válido'
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
        captchaToken: captchaToken, // Add captchaToken to order data
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
        
        // Reset CAPTCHA state for guest users
        if (!user) {
          setCaptchaToken(null)
          setCaptchaVerified(false)
        }
        
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
                    onClick={() => {
                      setFormData(prev => ({ ...prev, deliveryType: 'delivery' }))
                      // Reset address selection when switching to delivery
                      if (formData.deliveryType !== 'delivery') {
                        setFormData(prev => ({ ...prev, deliveryAddress: '', selectedAddressId: null }))
                        setAutoFilledAddress(false)
                        setAddressSuccessMessage('')
                      }
                    }}
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
                    onClick={() => {
                      setFormData(prev => ({ ...prev, deliveryType: 'pickup' }))
                      // Clear address when switching to pickup
                      if (formData.deliveryType === 'delivery') {
                        setFormData(prev => ({ ...prev, deliveryAddress: '', selectedAddressId: null }))
                        setAutoFilledAddress(false)
                        setAddressSuccessMessage('')
                      }
                    }}
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
                    <p className="text-xs text-gray-500 mb-3">
                      Selecciona una dirección guardada o crea una nueva para agilizar tu pedido
                    </p>
                    <div className="relative">
                      <input
                        type="text"
                        name="deliveryAddress"
                        value={formData.deliveryAddress}
                        onChange={handleManualAddressInput}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                          errors.deliveryAddress ? 'border-red-500' : 'border-gray-300'
                        } ${formData.selectedAddressId ? 'bg-green-50 border-green-300' : ''}`}
                        placeholder="Calle, número, piso, puerta, código postal, ciudad..."
                      />
                      {formData.selectedAddressId && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                          <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-green-600" />
                          </div>
                        </div>
                      )}
                    </div>
                    {errors.deliveryAddress && (
                      <p className="text-red-500 text-sm mt-1">{errors.deliveryAddress}</p>
                    )}

                    {/* Success Message */}
                    {addressSuccessMessage && (
                      <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 text-green-800">
                          <Check className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium">{addressSuccessMessage}</span>
                        </div>
                      </div>
                    )}

                    {/* Clear Address Button when using saved address */}
                    {formData.selectedAddressId && (
                      <div className="mt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({ 
                              ...prev, 
                              deliveryAddress: '',
                              selectedAddressId: null 
                            }))
                            setAutoFilledAddress(false)
                          }}
                          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                        >
                          <span>Limpiar dirección guardada</span>
                        </button>
                      </div>
                    )}

                    {/* Address Selection Section */}
                    {addressesLoading ? (
                      <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-center text-gray-500">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                          Cargando direcciones...
                        </div>
                      </div>
                    ) : addresses.length > 0 ? (
                      <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg shadow-sm">
                        <button
                          type="button"
                          onClick={() => setShowAddressDropdown(!showAddressDropdown)}
                          className="w-full px-4 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-100 flex items-center justify-between"
                        >
                          <span>
                            {formData.selectedAddressId ? 'Dirección guardada' : `Seleccionar dirección guardada (${addresses.length})`}
                          </span>
                          <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${showAddressDropdown ? 'rotate-180' : ''}`} />
                        </button>
                        {showAddressDropdown && (
                          <div className="py-2">
                            {addresses.map((address) => (
                              <button
                                key={address.id}
                                type="button"
                                onClick={() => handleAddressSelect(address)}
                                className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-between"
                              >
                                <div className="text-left">
                                  <span className="font-medium">{address.street}</span>
                                  <span className="text-gray-500 ml-2">{`${address.zip_code} ${address.city}, ${address.state}`}</span>
                                  {address.is_default && (
                                    <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                                      Predeterminada
                                    </span>
                                  )}
                                </div>
                                {formData.selectedAddressId === address.id && (
                                  <Check className="w-4 h-4 text-primary" />
                                )}
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={openAddressModal}
                              className="w-full px-4 py-2 text-sm text-primary hover:bg-primary/10"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Nueva dirección
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({ ...prev, selectedAddressId: null }))
                                setShowAddressDropdown(false)
                              }}
                              className="w-full px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 border-t border-gray-200"
                            >
                              Usar dirección manual
                            </button>
                            <div className="border-t border-gray-200 pt-2 mt-2">
                              <Link href="/profile" className="w-full px-4 py-2 text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-2">
                                <User className="w-4 h-4" />
                                Gestionar direcciones
                              </Link>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Quick Address Creation when no addresses exist */
                      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Plus className="w-3 h-3 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-blue-900 mb-2">
                              ¿No tienes direcciones guardadas?
                            </h4>
                            <p className="text-sm text-blue-700 mb-3">
                              Crea una dirección rápidamente para agilizar tu pedido
                            </p>
                            <button
                              type="button"
                              onClick={openAddressModal}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                              Crear dirección
                            </button>
                          </div>
                        </div>
                      </div>
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
                {/* CAPTCHA Verification for Guest Users */}
                {!user && (
                  <div className="mb-6 p-4 border-2 border-dashed border-gray-300 rounded-xl">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 text-sm">🔒</span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Verificación de Seguridad</h3>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-4">
                      Para proteger contra pedidos automatizados, necesitamos verificar que eres humano.
                    </p>
                    
                    {!captchaVerified ? (
                      <div className="space-y-3">
                        <CAPTCHA ref={captchaRef} onVerify={handleCaptchaVerify} onTimeout={handleCaptchaTimeout} action="order">
                          <button
                            type="button"
                            onClick={() => {
                              setCaptchaLoading(true);
                              setErrors(prev => {
                                const newErrors = { ...prev };
                                delete newErrors.captcha;
                                return newErrors;
                              });
                              
                              if (captchaRef.current?.execute) {
                                captchaRef.current.execute();
                              } else {
                                setCaptchaLoading(false);
                                setErrors(prev => ({ ...prev, captcha: 'Error: CAPTCHA no disponible. Recarga la página.' }));
                              }
                            }}
                            disabled={captchaLoading}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
                          >
                            {captchaLoading ? (
                              <div className="flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Verificando...
                              </div>
                            ) : (
                              '🔒 Verificar CAPTCHA'
                            )}
                          </button>
                        </CAPTCHA>
                        {errors.captcha && (
                          <p className="text-red-500 text-sm">{errors.captcha}</p>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-green-600">
                        <Check className="w-5 h-5" />
                        <span className="font-medium">✅ Verificación completada</span>
                      </div>
                    )}
                  </div>
                )}

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

            {/* Address Creation Modal */}
            {showAddressModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-md">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Nueva Dirección</h2>
                  <form onSubmit={(e) => { e.preventDefault(); saveAddress(); }} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Calle y número *
                      </label>
                      <input
                        type="text"
                        name="street"
                        value={addressForm.street}
                        onChange={(e) => setAddressForm(prev => ({ ...prev, street: e.target.value }))}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                          addressErrors.street ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Calle y número"
                      />
                      {addressErrors.street && <p className="text-red-500 text-xs mt-1">{addressErrors.street}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Código Postal *
                      </label>
                      <input
                        type="text"
                        name="zip_code"
                        value={addressForm.zip_code}
                        onChange={(e) => setAddressForm(prev => ({ ...prev, zip_code: e.target.value }))}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                          addressErrors.zip_code ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Código Postal"
                      />
                      {addressErrors.zip_code && <p className="text-red-500 text-xs mt-1">{addressErrors.zip_code}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ciudad *
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={addressForm.city}
                        onChange={(e) => setAddressForm(prev => ({ ...prev, city: e.target.value }))}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                          addressErrors.city ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Ciudad"
                      />
                      {addressErrors.city && <p className="text-red-500 text-xs mt-1">{addressErrors.city}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Provincia *
                      </label>
                      <input
                        type="text"
                        name="state"
                        value={addressForm.state}
                        onChange={(e) => setAddressForm(prev => ({ ...prev, state: e.target.value }))}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                          addressErrors.state ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Provincia"
                      />
                      {addressErrors.state && <p className="text-red-500 text-xs mt-1">{addressErrors.state}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="is_default"
                        checked={addressForm.is_default}
                        onChange={(e) => setAddressForm(prev => ({ ...prev, is_default: e.target.checked }))}
                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                      />
                      <label htmlFor="is_default" className="text-sm text-gray-700">
                        Dirección por defecto
                      </label>
                    </div>
                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setShowAddressModal(false)}
                        className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90"
                      >
                        Guardar Dirección
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
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