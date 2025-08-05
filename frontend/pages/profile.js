import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import { Clock, Package, CheckCircle, AlertCircle, Eye } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'
import Link from 'next/link'

export default function ProfilePage() {
  const { user, logout, isAuthenticated, loading } = useAuth()
  const router = useRouter()
  const [userOrders, setUserOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(true)

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, loading, router])

  // Fetch user orders
  useEffect(() => {
    const fetchOrders = async () => {
      if (!user?.id) return

      try {
        setOrdersLoading(true)
        const response = await api.orders.getUserOrders(user.id)
        
        // Ensure we always have an array
        const ordersArray = Array.isArray(response) ? response : []
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
  }, [isAuthenticated, user?.id])

  const handleLogout = () => {
    logout()
    router.push('/')
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
          <p className="text-xl opacity-90">Bienvenido de vuelta, {user?.firstName}!</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* User Information */}
          <div className="md:col-span-2 bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-gray-800">Información Personal</h2>
              <button className="text-primary hover:text-primary/80 font-medium">
                Editar
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Nombre
                </label>
                <p className="text-lg text-gray-800 font-semibold">
                  {user?.firstName}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Apellido
                </label>
                <p className="text-lg text-gray-800 font-semibold">
                  {user?.lastName}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Email
                </label>
                <p className="text-lg text-gray-800 font-semibold">
                  {user?.email}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Teléfono
                </label>
                <p className="text-lg text-gray-800 font-semibold">
                  {user?.phone}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Acciones Rápidas</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <Link href="/menu" className="bg-primary hover:bg-primary/90 text-white py-3 px-6 rounded-lg font-semibold text-center transition-colors">
                  🍕 Hacer Pedido
                </Link>
                <Link href="/order" className="bg-green-500 hover:bg-green-600 text-white py-3 px-6 rounded-lg font-semibold text-center transition-colors">
                  📋 Ver Mis Pedidos
                </Link>
              </div>
            </div>
          </div>

          {/* Profile Summary & Actions */}
          <div className="space-y-6">
            {/* Profile Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6 text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-primary to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-white font-bold">
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-800">
                {user?.firstName} {user?.lastName}
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

            {/* Account Settings */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Configuración</h3>
              <div className="space-y-3">
                <button className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                  🔔 Notificaciones
                </button>
                <button className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                  📍 Direcciones
                </button>
                <button className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                  💳 Métodos de Pago
                </button>
                <button className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                  🔒 Privacidad
                </button>
              </div>
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
              {Array.isArray(userOrders) && userOrders.map((order) => {
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
                          <p>📦 {order.total_items} producto{order.total_items !== 1 ? 's' : ''}</p>
                          <p>🚚 {order.delivery_type === 'delivery' ? 'Entrega a domicilio' : 'Recogida en tienda'}</p>
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
                          className="flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 px-4 py-2 rounded-xl font-semibold hover:bg-primary/20 transition-colors"
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
      </div>
    </div>
  )
} 