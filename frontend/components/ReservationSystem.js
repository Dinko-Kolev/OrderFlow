import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../lib/api'

export default function ReservationSystem({ isModal = false, onClose = null }) {
  const { isAuthenticated, user } = useAuth()
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    guests: 2,
    name: user?.firstName ? `${user.firstName} ${user.lastName}` : '',
    email: user?.email || '',
    phone: '',
    specialRequests: ''
  })
  const [availableSlots, setAvailableSlots] = useState([])
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1) // 1: DateTime, 2: Details, 3: Confirmation

  // Professional time slots (following industry standards)
  const timeSlots = [
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'
  ]

  // Real availability check from backend
  useEffect(() => {
    if (formData.date) {
      setLoading(true)
      api.reservations.getAvailability(formData.date)
        .then(result => {
          if (result.success) {
            const availableSlots = result.data.filter(slot => slot.available)
            setAvailableSlots(availableSlots.map(slot => slot.time))
          } else {
            console.error('Error fetching availability:', result.error)
            setAvailableSlots([])
          }
        })
        .catch(error => {
          console.error('Error checking availability:', error)
          setAvailableSlots([])
        })
        .finally(() => setLoading(false))
    }
  }, [formData.date])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      // Prepare reservation data for backend
      const reservationData = {
        customerName: formData.name,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        reservationDate: formData.date,
        reservationTime: formData.time + ':00', // Convert to HH:MM:SS format
        numberOfGuests: parseInt(formData.guests),
        specialRequests: formData.specialRequests || null,
        userId: user?.id || null // If user is authenticated
      }

      console.log('Sending reservation data:', reservationData)
      
      // Send to backend API
      const result = await api.reservations.create(reservationData)
      
      if (result.success) {
        console.log('✅ Reservation created successfully:', result.data)
        setStep(3) // Go to confirmation
      } else {
        console.error('❌ Reservation failed:', result.error)
        alert(result.error || 'Error al procesar la reserva. Inténtalo de nuevo.')
      }
    } catch (error) {
      console.error('Reservation error:', error)
      alert('Error de conexión. Verifica tu internet e inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const isDateValid = (date) => {
    const today = new Date()
    const selectedDate = new Date(date)
    const maxDate = new Date()
    maxDate.setDate(today.getDate() + 60) // 60 days advance booking
    
    return selectedDate >= today && selectedDate <= maxDate
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  // Step 1: Date & Time Selection
  const DateTimeStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Selecciona Fecha y Hora</h3>
        <p className="text-gray-600">Elige el momento perfecto para tu visita</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Date Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            📅 Fecha de la Reserva
          </label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            min={new Date().toISOString().split('T')[0]}
            max={new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-lg"
            required
          />
        </div>

        {/* Guests Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            👥 Número de Comensales
          </label>
          <select
            name="guests"
            value={formData.guests}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-lg"
          >
            {[1,2,3,4,5,6,7,8,9,10,11,12].map(num => (
              <option key={num} value={num}>
                {num} {num === 1 ? 'persona' : 'personas'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Time Slots */}
      {formData.date && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            🕒 Hora Disponible
          </label>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {availableSlots.map(slot => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setFormData({...formData, time: slot})}
                  className={`py-3 px-4 rounded-lg text-sm font-medium transition-all ${
                    formData.time === slot
                      ? 'bg-primary text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          )}
          
          {!loading && availableSlots.length === 0 && formData.date && (
            <div className="text-center py-6 bg-gray-50 rounded-lg">
              <span className="text-2xl mb-2 block">😔</span>
              <p className="text-gray-600">No hay horarios disponibles para esta fecha.</p>
              <p className="text-sm text-gray-500">Prueba con otra fecha.</p>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setStep(2)}
          disabled={!formData.date || !formData.time}
          className="px-8 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continuar →
        </button>
      </div>
    </div>
  )

  // Step 2: Contact Details
  const ContactStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Información de Contacto</h3>
        <p className="text-gray-600">Datos para confirmar tu reserva</p>
      </div>

      {/* Reservation Summary */}
      <div className="bg-primary/5 rounded-lg p-4 mb-6">
        <h4 className="font-semibold text-gray-800 mb-2">📋 Resumen de tu Reserva</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <p><strong>Fecha:</strong> {formatDate(formData.date)}</p>
          <p><strong>Hora:</strong> {formData.time}</p>
          <p><strong>Comensales:</strong> {formData.guests} personas</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre Completo *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Tu nombre completo"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="tu@email.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Teléfono *
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Tu número de teléfono"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Solicitudes Especiales (Opcional)
          </label>
          <textarea
            name="specialRequests"
            value={formData.specialRequests}
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Cumpleaños, aniversario, accesibilidad, alergias..."
          />
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">
            <strong>Política de Cancelación:</strong> Puedes cancelar tu reserva hasta 2 horas antes sin coste. 
            Te enviaremos un recordatorio 24 horas antes de tu visita.
          </p>
        </div>

        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => setStep(1)}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            ← Volver
          </button>
          
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-gradient-to-r from-primary to-red-500 text-white rounded-lg font-semibold hover:from-primary/90 hover:to-red-500/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Procesando...' : '🍽️ Confirmar Reserva'}
          </button>
        </div>
      </form>
    </div>
  )

  // Step 3: Confirmation
  const ConfirmationStep = () => (
    <div className="text-center space-y-6">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <span className="text-3xl">✅</span>
      </div>
      
      <div>
        <h3 className="text-3xl font-bold text-green-600 mb-2">¡Reserva Confirmada!</h3>
        <p className="text-gray-600">Te esperamos en Bella Vista Restaurant</p>
      </div>

      <div className="bg-green-50 rounded-lg p-6 text-left max-w-md mx-auto">
        <h4 className="font-semibold text-gray-800 mb-3">📋 Detalles de tu Reserva</h4>
        <div className="space-y-2 text-sm text-gray-600">
          <p><strong>Nombre:</strong> {formData.name}</p>
          <p><strong>Fecha:</strong> {formatDate(formData.date)}</p>
          <p><strong>Hora:</strong> {formData.time}</p>
          <p><strong>Comensales:</strong> {formData.guests} personas</p>
          <p><strong>Email:</strong> {formData.email}</p>
          <p><strong>Teléfono:</strong> {formData.phone}</p>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          📧 Te hemos enviado un email de confirmación con todos los detalles.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => {
              if (onClose) onClose()
              setStep(1)
              setFormData({
                date: '',
                time: '',
                guests: 2,
                name: user?.firstName ? `${user.firstName} ${user.lastName}` : '',
                email: user?.email || '',
                phone: '',
                specialRequests: ''
              })
            }}
            className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors"
          >
            Nueva Reserva
          </button>
          
          <a
            href="/contact"
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            Contactar Restaurante
          </a>
        </div>
      </div>
    </div>
  )

  const modalClasses = isModal 
    ? "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    : ""
  
  const contentClasses = isModal
    ? "bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
    : "bg-white rounded-2xl shadow-xl"

  return (
    <div className={modalClasses}>
      <div className={contentClasses}>
        {isModal && (
          <div className="flex justify-between items-center p-6 border-b">
            <h2 className="text-2xl font-bold text-gray-900">🍽️ Reservar Mesa</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
        )}
        
        <div className="p-6">
          {step === 1 && <DateTimeStep />}
          {step === 2 && <ContactStep />}
          {step === 3 && <ConfirmationStep />}
        </div>
      </div>
    </div>
  )
} 