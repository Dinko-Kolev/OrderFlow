import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle, 
  Package, 
  Truck, 
  MapPin, 
  Phone, 
  Mail, 
  Download,
  AlertCircle,
  RefreshCw
} from 'lucide-react'
import { api } from '../../lib/api'

export default function OrderTrackingPage() {
  const router = useRouter()
  const { orderNumber } = router.query
  
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-ES', { 
      style: 'currency', 
      currency: 'EUR',
      minimumFractionDigits: 2 
    }).format(price)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const fetchOrder = async () => {
    if (!orderNumber) return

    try {
      setRefreshing(true)
      const response = await api.orders.getByNumber(orderNumber)
      const data = response?.data || response
      // Normalize numeric and field names coming from DB
      const normalized = {
        ...data,
        created_at: data?.created_at || data?.order_date,
        subtotal: data?.subtotal !== undefined ? parseFloat(data.subtotal) : (data?.total_amount != null && data?.delivery_fee != null ? (parseFloat(data.total_amount) - parseFloat(data.delivery_fee)) : 0),
        total_amount: data?.total_amount !== undefined ? parseFloat(data.total_amount) : 0,
        delivery_fee: data?.delivery_fee !== undefined ? parseFloat(data.delivery_fee) : 0,
        delivery_address_text: data?.delivery_address_text || data?.delivery_address,
        items: Array.isArray(data?.items)
          ? data.items.map(it => ({
              ...it,
              unit_price: it?.unit_price !== undefined ? parseFloat(it.unit_price) : it?.unitPrice,
              total_price: it?.total_price !== undefined ? parseFloat(it.total_price) : it?.totalPrice,
              customizations: Array.isArray(it?.customizations) ? it.customizations : []
            }))
          : []
      }
      setOrder(normalized)
      setError(null)
    } catch (err) {
      console.error('Error fetching order:', err)
      setError('No se pudo cargar la información del pedido')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchOrder()
  }, [orderNumber])

  // Auto-refresh every 30 seconds for active orders
  useEffect(() => {
    if (!order || ['delivered', 'cancelled'].includes(order.status)) return

    const interval = setInterval(fetchOrder, 30000)
    return () => clearInterval(interval)
  }, [order?.status])

  const getStatusInfo = (status) => {
    const statusMap = {
      pending: {
        title: 'Pedido Recibido',
        description: 'Hemos recibido tu pedido y lo estamos procesando',
        icon: Package,
        color: 'text-blue-500',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200'
      },
      confirmed: {
        title: 'Pedido Confirmado',
        description: 'Tu pedido ha sido confirmado y está en la cola de preparación',
        icon: CheckCircle,
        color: 'text-green-500',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      },
      preparing: {
        title: 'Preparando',
        description: 'Nuestros chefs están preparando tu deliciosa comida',
        icon: Package,
        color: 'text-orange-500',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200'
      },
      ready: {
        title: order?.delivery_type === 'pickup' ? 'Listo para Recoger' : 'Listo para Entregar',
        description: order?.delivery_type === 'pickup' 
          ? 'Tu pedido está listo. Puedes venir a recogerlo' 
          : 'Tu pedido está listo y pronto saldrá para entrega',
        icon: CheckCircle,
        color: 'text-primary',
        bgColor: 'bg-primary/10',
        borderColor: 'border-primary/20'
      },
      delivering: {
        title: 'En Camino',
        description: 'Tu pedido está en camino hacia tu dirección',
        icon: Truck,
        color: 'text-purple-500',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200'
      },
      delivered: {
        title: 'Entregado',
        description: '¡Tu pedido ha sido entregado! Esperamos que lo disfrutes',
        icon: CheckCircle,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      },
      cancelled: {
        title: 'Cancelado',
        description: 'Este pedido ha sido cancelado',
        icon: AlertCircle,
        color: 'text-red-500',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
      }
    }
    return statusMap[status] || statusMap.pending
  }

  const getTimeRemaining = (estimatedTime, status) => {
    if (!estimatedTime || ['delivered', 'cancelled'].includes(status)) return null
    
    const now = new Date()
    const estimated = new Date(estimatedTime)
    const diffMinutes = Math.round((estimated - now) / (1000 * 60))
    
    if (diffMinutes <= 0) return 'Muy pronto'
    if (diffMinutes === 1) return '1 minuto'
    return `${diffMinutes} minutos`
  }

  const handleCancelOrder = async () => {
    if (!order || !['pending', 'confirmed'].includes(order.status)) return
    
    const confirmed = window.confirm('¿Estás seguro de que quieres cancelar este pedido?')
    if (!confirmed) return

    try {
      await api.orders.cancel(orderNumber, 'Cancelado por el cliente')
      await fetchOrder() // Refresh order status
    } catch (err) {
      console.error('Error cancelling order:', err)
      alert('No se pudo cancelar el pedido. Contacta con el restaurante.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando información del pedido...</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 pt-20 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Pedido no encontrado</h1>
          <p className="text-gray-600 mb-6">
            {error || 'No pudimos encontrar un pedido con ese número.'}
          </p>
          <button
            onClick={() => router.push('/menu')}
            className="bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
          >
            Volver al Menú
          </button>
        </div>
      </div>
    )
  }

  const statusInfo = getStatusInfo(order.status)
  const StatusIcon = statusInfo.icon
  const timeRemaining = getTimeRemaining(order.estimated_delivery_time, order.status)

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 pt-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push('/profile')}
            className="p-2 rounded-full hover:bg-white/50 transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">Pedido #{order.order_number}</h1>
            <p className="text-gray-600">Realizado el {formatDate(order.created_at)}</p>
          </div>
          <button
            onClick={fetchOrder}
            disabled={refreshing}
            className="p-2 rounded-full hover:bg-white/50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Status and Timeline */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Current Status */}
            <div className={`${statusInfo.bgColor} border ${statusInfo.borderColor} rounded-2xl p-6`}>
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-12 h-12 ${statusInfo.bgColor} rounded-full flex items-center justify-center`}>
                  <StatusIcon className={`w-6 h-6 ${statusInfo.color}`} />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900">{statusInfo.title}</h2>
                  <p className="text-gray-600">{statusInfo.description}</p>
                </div>
              </div>

              {timeRemaining && !['delivered', 'cancelled'].includes(order.status) && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">
                    Tiempo estimado: <strong>{timeRemaining}</strong>
                  </span>
                </div>
              )}
            </div>

            {/* Order Timeline */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Historial del Pedido</h3>
              
              <div className="space-y-4">
                {order.statusHistory?.map((event, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{getStatusInfo(event.status).title}</p>
                      <p className="text-sm text-gray-600">{formatDate(event.created_at)}</p>
                      {event.notes && (
                        <p className="text-sm text-gray-500 mt-1">{event.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Productos Pedidos</h3>
              
              <div className="space-y-4">
                {order.items?.map((item) => (
                  <div key={item.id} className="flex gap-4 p-4 bg-gray-50 rounded-xl">
                    <img
                      src={item.image_url}
                      alt={item.product_name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{item.product_name}</h4>
                      <p className="text-sm text-gray-600">Cantidad: {item.quantity}</p>
                      {item.customizations && JSON.parse(item.customizations).length > 0 && (
                        <p className="text-xs text-gray-500 mt-1">Con personalizaciones</p>
                      )}
                      {item.special_instructions && (
                        <p className="text-xs text-gray-500 mt-1">Nota: {item.special_instructions}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">{formatPrice(item.total_price)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cancel Order Button */}
            {['pending', 'confirmed'].includes(order.status) && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">¿Necesitas cancelar?</h3>
                <p className="text-gray-600 mb-4">
                  Puedes cancelar tu pedido si aún no ha comenzado la preparación.
                </p>
                <button
                  onClick={handleCancelOrder}
                  className="bg-red-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-600 transition-colors"
                >
                  Cancelar Pedido
                </button>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24 space-y-6">
              
              {/* Summary */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Resumen</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">{formatPrice(order.subtotal || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Gastos de envío</span>
                    <span className="font-medium">{formatPrice(order.delivery_fee || 0)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-primary">{formatPrice(order.total_amount || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Info */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  {order.delivery_type === 'pickup' ? 'Recogida' : 'Entrega'}
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {order.delivery_type === 'pickup' ? 'Bella Vista Restaurant' : 'Dirección de entrega'}
                      </p>
                      <p className="text-gray-600">
                         {order.delivery_type === 'pickup' 
                          ? 'Calle Gran Vía, 123, Madrid'
                          : (order.delivery_address_text || '')
                         }
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">{order.customer_phone}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">{order.customer_email}</span>
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Pago</h3>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-primary text-xs font-bold">€</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {order.payment_method === 'card' ? 'Tarjeta' : 'Efectivo'}
                    </p>
                    <p className="text-gray-600">
                      Estado: {order.payment_status === 'paid' ? 'Pagado' : 'Pendiente'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Restaurant */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">¿Necesitas ayuda?</h3>
                <div className="space-y-3">
                  <button className="w-full bg-primary/10 text-primary border border-primary/20 py-3 px-4 rounded-xl font-semibold hover:bg-primary/20 transition-colors">
                    Contactar Restaurante
                  </button>
                  <button className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
                    <Download className="w-4 h-4" />
                    Descargar Factura
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 