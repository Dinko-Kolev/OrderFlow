import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import { Clock, Package, CheckCircle, AlertCircle, Eye } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'
import Link from 'next/link'

export default function ProfilePage() {
  const { user, token, logout, isAuthenticated, loading, refreshProfile, updateUser } = useAuth()
  const router = useRouter()
  const [userOrders, setUserOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [profileUser, setProfileUser] = useState(user)
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', email: '', phone: '' })
  const [addresses, setAddresses] = useState([])
  const [addressesLoading, setAddressesLoading] = useState(false)
  const [addressForm, setAddressForm] = useState({ id: null, street: '', city: '', state: '', zip_code: '', is_default: false })
  const [addressErrors, setAddressErrors] = useState({})
  const [addressModalOpen, setAddressModalOpen] = useState(false)
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false)
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false)
  const defaultAddressId = useMemo(() => {
    const def = addresses.find(a => a.is_default)
    return def ? def.id : null
  }, [addresses])

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, loading, router])

  // Fetch user orders
  useEffect(() => {
    const fetchOrders = async () => {
      if (!user?.id) {
        return
      }

      try {
        setOrdersLoading(true)
        
        // Try to get orders by user ID first
        let response = await api.orders.getUserOrders(user.id)
        
        let ordersArray = []
        if (response?.success && response?.data?.orders) {
          ordersArray = response.data.orders
        } else if (response?.success && Array.isArray(response?.orders)) {
          ordersArray = response.orders
        } else if (Array.isArray(response)) {
          ordersArray = response
        }
        
        // If no orders found by user ID, try by email (for guest orders)
        if (ordersArray.length === 0 && user.email) {
          try {
            const emailResponse = await api.orders.getUserOrders(null, user.email)
            
            if (emailResponse?.success && emailResponse?.data?.orders) {
              ordersArray = emailResponse.data.orders
            } else if (emailResponse?.success && Array.isArray(emailResponse?.orders)) {
              ordersArray = emailResponse.orders
            } else if (Array.isArray(emailResponse)) {
              ordersArray = emailResponse
            }
          } catch (emailError) {
            // Silently handle email lookup errors
          }
        }
        
        setUserOrders(ordersArray)
      } catch (error) {
        console.error('Error fetching orders:', error)
        setUserOrders([])
      } finally {
        setOrdersLoading(false)
      }
    }

    if (isAuthenticated && user?.id) {
      fetchOrders()
    }
  }, [isAuthenticated, user?.id, user?.email])

  // Prefill edit form when user loads
  useEffect(() => {
    if (user) {
      setProfileUser(user)
      setEditForm(prev => ({
        firstName: prev.firstName || user.firstName || '',
        lastName: prev.lastName || user.lastName || '',
        email: user.email || '',
        phone: prev.phone || user.phone || ''
      }))
    }
  }, [user])

  // Addresses API helpers
  const fetchAddresses = async () => {
    if (!user?.id) return
    try {
      setAddressesLoading(true)
      const res = await api.addresses.getForUser(user.id)
      console.log('Addresses API response:', res)
      const payload = res?.data || res
      const list = payload?.addresses || payload?.data || (Array.isArray(payload) ? payload : [])
      setAddresses(Array.isArray(list) ? list : [])
    } catch (e) {
      console.error('Error fetching addresses', e)
      setAddresses([])
    } finally {
      setAddressesLoading(false)
    }
  }

  // Auto-load addresses when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user?.id && token) {
      fetchAddresses()
    }
  }, [isAuthenticated, user?.id, token])

  const saveUserProfile = async () => {
    try {
      const firstName = (editForm.firstName || '').trim() || profileUser?.firstName || user?.firstName || ''
      const lastName = (editForm.lastName || '').trim() || profileUser?.lastName || user?.lastName || ''
      if (!firstName || !lastName) {
        alert('Por favor, complete nombre y apellido')
        return
      }
      const payload = { firstName, lastName, phone: (editForm.phone || '').trim() }
      const res = await api.auth.updateProfile(payload)
      if (res?.success) {
        // Optimistic update for immediate UI change
        updateUser(payload)
        setProfileUser(prev => ({ ...prev, ...payload }))
        // Then fetch fresh profile once (no cache) to ensure consistency
        refreshProfile().then(fresh => {
          if (fresh) setProfileUser(fresh)
        })
        setIsEditOpen(false)
      } else if (res?.error) {
        alert(res.error)
      }
    } catch (e) {
      console.error('Failed to save profile', e)
      alert('No se pudo guardar. Inténtalo de nuevo.')
    }
  }

  const openAddressModal = (addr = null) => {
    if (addr) setAddressForm({ id: addr.id, street: addr.street, city: addr.city, state: addr.state, zip_code: addr.zip_code, is_default: !!addr.is_default })
    else setAddressForm({ id: null, street: '', city: '', state: '', zip_code: '', is_default: false })
    setAddressErrors({})
    setAddressModalOpen(true)
  }

  const validateAddress = () => {
    const errs = {}
    if (!addressForm.street.trim()) errs.street = 'Requerido'
    if (!addressForm.city.trim()) errs.city = 'Requerido'
    if (!addressForm.state.trim()) errs.state = 'Requerido'
    if (!addressForm.zip_code.trim()) errs.zip_code = 'Requerido'
    setAddressErrors(errs)
    return Object.keys(errs).length === 0
  }

  const saveAddress = async () => {
    try {
      if (!validateAddress()) return
      console.log('Saving address payload:', addressForm)
      const res = addressForm.id
        ? await api.addresses.update(user.id, addressForm.id, addressForm)
        : await api.addresses.create(user.id, addressForm)
      console.log('Address save response:', res)
      if (!res?.success) {
        alert(res?.error || 'No se pudo guardar la dirección')
        return
      }
      setAddressModalOpen(false)
      // force a fresh fetch with no cache and re-render list immediately
      await fetchAddresses()
    } catch (e) {
      console.error('Failed to save address', e)
      alert('Error de conexión al guardar la dirección')
    }
  }

  const deleteAddress = async (id) => {
    try {
      await api.addresses.delete(user.id, id)
      await fetchAddresses()
    } catch (e) {
      console.error('Failed to delete address', e)
    }
  }

  const setDefaultAddress = async (addr) => {
    try {
      await api.addresses.update(user.id, addr.id, {
        street: addr.street,
        city: addr.city,
        state: addr.state,
        zip_code: addr.zip_code,
        is_default: true
      })
      await fetchAddresses()
    } catch (e) {
      console.error('Failed to set default address', e)
    }
  }

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const handleDeleteAccount = async () => {
    try {
      console.log('🔄 Starting account deletion process...');
      console.log('📡 Making API call to delete account...');
      console.log('🔑 Auth token available:', !!token);
      console.log('👤 User ID:', user?.id);
      
      setDeleteAccountLoading(true)
      const result = await api.auth.deleteAccount()
      
      console.log('📥 API response received:', result);
      
      if (result.success) {
        // Account deleted successfully - force immediate logout and redirect
        console.log('✅ Account deleted successfully, logging out...');
        
        // Clear all local state immediately
        setDeleteAccountLoading(false)
        setShowDeleteAccountModal(false)
        
        // Force logout and clear all auth data
        logout()
        
        // Force redirect to home page
        window.location.href = '/'
      } else {
        // Only show error if it's a server error, not user cancellation
        console.error('❌ Account deletion failed:', result.error);
        setDeleteAccountLoading(false)
        setShowDeleteAccountModal(false)
      }
    } catch (error) {
      console.error('💥 Exception during account deletion:', error);
      console.error('💥 Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response?.data,
        status: error.response?.status
      });
      setDeleteAccountLoading(false)
      setShowDeleteAccountModal(false)
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-ES', { 
      style: 'currency', 
      currency: 'EUR',
      minimumFractionDigits: 2 
    }).format(price)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusInfo = (status) => {
    const statusMap = {
      pending: { text: 'Pendiente', icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50' },
      confirmed: { text: 'Confirmado', icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50' },
      preparing: { text: 'Preparando', icon: Package, color: 'text-orange-500', bg: 'bg-orange-50' },
      ready: { text: 'Listo', icon: CheckCircle, color: 'text-primary', bg: 'bg-primary/10' },
      delivering: { text: 'En Camino', icon: Package, color: 'text-purple-500', bg: 'bg-purple-50' },
      delivered: { text: 'Entregado', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
      cancelled: { text: 'Cancelado', icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50' }
    }
    return statusMap[status] || statusMap.pending
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center pt-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-xl text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 pt-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-red-500 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">Mi Perfil</h1>
          <p className="text-xl opacity-90">Bienvenido de vuelta, {profileUser?.firstName}!</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* User Information */}
          <div className="md:col-span-2 bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-gray-800">Información Personal</h2>
              <button className="text-primary hover:text-primary/80 font-medium" onClick={() => setIsEditOpen(true)}>
                Editar
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Nombre
                </label>
                <p className="text-lg text-gray-800 font-semibold">
                  {profileUser?.firstName}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Apellido
                </label>
                <p className="text-lg text-gray-800 font-semibold">
                  {profileUser?.lastName}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Email
                </label>
                <p className="text-lg text-gray-800 font-semibold">
                  {profileUser?.email}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Teléfono
                </label>
                <p className="text-lg text-gray-800 font-semibold">
                  {profileUser?.phone}
                </p>
              </div>
            </div>

            {/* Addresses Section - Wide layout (better space) */}
            <div className="mt-8 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">📍 Direcciones</h3>
                <button
                  onClick={() => openAddressModal(null)}
                  disabled={addresses.length >= 4}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${addresses.length >= 4 ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-primary text-white hover:bg-primary/90'}`}
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
                    <div key={addr.id} className="border rounded-xl p-4 flex flex-col">
                      <div>
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-gray-900 truncate mr-2">{addr.street}</p>
                          {defaultAddressId === addr.id && (
                            <span className="inline-flex items-center text-xs px-2 py-0.5 rounded bg-green-100 text-green-700 whitespace-nowrap">Predeterminada</span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-gray-600 break-words">{addr.city}, {addr.state} {addr.zip_code}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 justify-end mt-3">
                        <button className="px-3 py-1 rounded-lg bg-gray-100 text-sm" onClick={() => openAddressModal(addr)}>Editar</button>
                        <button className="px-3 py-1 rounded-lg bg-red-500 text-white text-sm" onClick={() => deleteAddress(addr.id)}>Eliminar</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-500">Máximo 4 direcciones guardadas.</p>
            </div>
          </div>

          {/* Profile Summary & Actions */}
          <div className="space-y-6">
            {/* Profile Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6 text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-primary to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-white font-bold">
                  {profileUser?.firstName?.charAt(0)}{profileUser?.lastName?.charAt(0)}
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-800">
                {profileUser?.firstName} {profileUser?.lastName}
              </h3>
              <p className="text-gray-600 text-sm mt-1">Cliente Premium</p>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {ordersLoading ? '...' : userOrders.length}
                  </div>
                  <div className="text-sm text-gray-600">Pedidos Realizados</div>
                </div>
              </div>
            </div>

            {/* Account Settings - removed for now as requested */}

            {/* Addresses Section (old, sidebar) hidden to avoid duplicate rendering */}
            <div className="hidden">
              {/* intentionally hidden */}
            </div>

            {/* Logout Button */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <button
                onClick={handleLogout}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
              >
                🚪 Cerrar Sesión
              </button>
            </div>

            {/* Delete Account Section */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border-l-4 border-red-500">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Eliminación de cuenta</h3>
                  <p className="text-sm text-gray-600 mt-1">Esto eliminará tu cuenta permanentemente</p>
                </div>
                <button
                  onClick={() => setShowDeleteAccountModal(true)}
                  disabled={deleteAccountLoading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {deleteAccountLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Procesando...
                    </>
                  ) : (
                    'Eliminar cuenta'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Orders Section */}
        <div className="mt-12 bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Historial de Pedidos</h2>
          
          {ordersLoading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando pedidos...</p>
            </div>
          ) : userOrders.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🍕</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">¡Aún no has hecho ningún pedido!</h3>
              <p className="text-gray-600 mb-6">Explora nuestro menú y haz tu primer pedido</p>
              <Link href="/menu" className="inline-block bg-primary hover:bg-primary/90 text-white py-3 px-6 rounded-lg font-semibold transition-colors">
                Ver Menú
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {Array.isArray(userOrders) && userOrders.map((order, index) => {
                const statusInfo = getStatusInfo(order.status)
                const StatusIcon = statusInfo.icon
                
                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-gray-900">
                            Pedido #{order.order_number}
                          </h3>
                          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${statusInfo.bg} ${statusInfo.color}`}>
                            <StatusIcon className="w-4 h-4" />
                            {statusInfo.text}
                          </div>
                        </div>
                        
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>📅 {formatDate(order.created_at)}</p>
                          <p>📦 {order.total_items || 'N/A'} producto{(order.total_items || 1) !== 1 ? 's' : ''}</p>
                          <p>🚚 {order.order_type === 'delivery' ? 'Entrega a domicilio' : 'Recogida en tienda'}</p>
                          {order.minutes_remaining > 0 && (
                            <p className="text-primary font-medium">
                              ⏱️ {Math.round(order.minutes_remaining)} minutos restantes
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">
                            {formatPrice(order.total_amount)}
                          </div>
                          <div className="text-sm text-gray-500">
                            Total pagado
                          </div>
                        </div>
                        
                        <Link
                          href={`/order/${order.order_number}`}
                          className="flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 px-4 py-2 rounded-lg font-semibold hover:bg-primary/20 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          Ver Detalle
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
              
              {userOrders.length >= 5 && (
                <div className="text-center pt-6">
                  <p className="text-gray-500 text-sm mb-4">
                    Mostrando los últimos {userOrders.length} pedidos
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Edit Profile Modal */}
        {isEditOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Editar Información</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Nombre</label>
                  <input required className="w-full px-4 py-3 border rounded-lg" value={editForm.firstName} onChange={e => setEditForm(f => ({...f, firstName: e.target.value}))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Apellido</label>
                  <input required className="w-full px-4 py-3 border rounded-lg" value={editForm.lastName} onChange={e => setEditForm(f => ({...f, lastName: e.target.value}))} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                  <input disabled className="w-full px-4 py-3 border rounded-lg bg-gray-100" value={editForm.email} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Teléfono</label>
                  <input className="w-full px-4 py-3 border rounded-lg" value={editForm.phone} onChange={e => setEditForm(f => ({...f, phone: e.target.value}))} />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button className="px-4 py-2 rounded-lg bg-gray-100" onClick={() => setIsEditOpen(false)}>Cancelar</button>
                <button className="px-6 py-2 rounded-lg bg-primary text-white" onClick={saveUserProfile}>Guardar</button>
              </div>
            </div>
          </div>
        )}

        {/* Addresses Modal (Add/Edit + List) */}
        {addressModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-gray-800">Direcciones</h3>
                <button onClick={() => setAddressModalOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Address form */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Calle y número</label>
                    <input className={`w-full px-4 py-3 border rounded-lg ${addressErrors.street ? 'border-red-300' : 'border-gray-300'}`} value={addressForm.street} onChange={e => setAddressForm(f => ({...f, street: e.target.value}))} />
                    {addressErrors.street && <p className="text-xs text-red-600 mt-1">{addressErrors.street}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Ciudad</label>
                    <input className={`w-full px-4 py-3 border rounded-lg ${addressErrors.city ? 'border-red-300' : 'border-gray-300'}`} value={addressForm.city} onChange={e => setAddressForm(f => ({...f, city: e.target.value}))} />
                    {addressErrors.city && <p className="text-xs text-red-600 mt-1">{addressErrors.city}</p>}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-600 mb-1">Provincia</label>
                      <input className={`w-full px-4 py-3 border rounded-lg ${addressErrors.state ? 'border-red-300' : 'border-gray-300'}`} value={addressForm.state} onChange={e => setAddressForm(f => ({...f, state: e.target.value}))} />
                      {addressErrors.state && <p className="text-xs text-red-600 mt-1">{addressErrors.state}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">CP</label>
                      <input className={`w-full px-4 py-3 border rounded-lg ${addressErrors.zip_code ? 'border-red-300' : 'border-gray-300'}`} value={addressForm.zip_code} onChange={e => setAddressForm(f => ({...f, zip_code: e.target.value}))} />
                      {addressErrors.zip_code && <p className="text-xs text-red-600 mt-1">{addressErrors.zip_code}</p>}
                    </div>
                  </div>
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={addressForm.is_default} onChange={e => setAddressForm(f => ({...f, is_default: e.target.checked}))} />
                    Usar como dirección predeterminada
                  </label>
                  <div className="flex gap-3">
                    <button className="px-4 py-2 rounded-lg bg-gray-100" onClick={() => setAddressModalOpen(false)}>Cancelar</button>
                    <button className="px-6 py-2 rounded-lg bg-primary text-white" onClick={saveAddress}>{addressForm.id ? 'Guardar cambios' : 'Añadir dirección'}</button>
                  </div>
                </div>

                {/* Address list */}
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Guardadas</h4>
                  {addressesLoading ? (
                    <p className="text-gray-500">Cargando...</p>
                  ) : addresses.length === 0 ? (
                    <p className="text-gray-500">No tienes direcciones guardadas.</p>
                  ) : (
                    <div className="space-y-3">
                      {addresses.map(addr => (
                        <div key={addr.id} className="border rounded-lg p-3 flex items-start justify-between">
                          <div>
                            <p className="font-medium text-gray-800">{addr.street}</p>
                            <p className="text-sm text-gray-600">{addr.city}, {addr.state} {addr.zip_code}</p>
                            {addr.is_default && <span className="text-xs text-green-600">Predeterminada</span>}
                          </div>
                          <div className="flex gap-2">
                            <button className="px-3 py-1 rounded-lg bg-gray-100" onClick={() => openAddressModal(addr)}>Editar</button>
                            <button className="px-3 py-1 rounded-lg bg-red-500 text-white" onClick={() => deleteAddress(addr.id)}>Eliminar</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Account Confirmation Modal */}
        {showDeleteAccountModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-gray-900">Eliminar Cuenta</h3>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 py-4">
                <p className="text-sm text-gray-600 mb-4">
                  ¿Estás seguro de que quieres eliminar tu cuenta? Esta acción no se puede deshacer.
                </p>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowDeleteAccountModal(false)}
                    disabled={deleteAccountLoading}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteAccountLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    {deleteAccountLoading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Procesando...
                      </span>
                    ) : (
                      'Eliminar Cuenta'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 