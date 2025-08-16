import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../lib/api'

// Animation variants for framer-motion style animations
const stepAnimations = {
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -20, scale: 0.95 }
}

export default function ReservationSystem({ isModal = false, onClose = null }) {
  const { isAuthenticated, user } = useAuth()
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    guests: 2,
    name: user?.firstName ? `${user.firstName} ${user.lastName}` : '',
    email: user?.email || '',
    phone: user?.phone || '',
    specialRequests: ''
  })
  const [availableSlots, setAvailableSlots] = useState([])
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1) // 1: DateTime, 2: Details, 3: Confirmation
  const [animationKey, setAnimationKey] = useState(0) // For triggering animations

  // Progress indicator configuration
  const steps = [
    { id: 1, title: 'Fecha y Hora', icon: '📅', description: 'Selecciona tu momento preferido' },
    { id: 2, title: 'Detalles', icon: '✍️', description: 'Información de contacto' },
    { id: 3, title: 'Confirmación', icon: '✅', description: 'Reserva confirmada' }
  ]

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
            // Store full availability data for better UX
            setAvailableSlots(result.data)
            
            // If previously selected time is no longer available, reset it
            if (formData.time && !result.data.find(slot => slot.time === formData.time)?.available) {
              setFormData(prev => ({ ...prev, time: '' }))
            }
          } else {
            console.error('Error fetching availability:', result.error)
            setAvailableSlots([])
            // Reset time if availability check fails
            setFormData(prev => ({ ...prev, time: '' }))
          }
        })
        .catch(error => {
          console.error('Error checking availability:', error)
          setAvailableSlots([])
          // Reset time if availability check fails
          setFormData(prev => ({ ...prev, time: '' }))
        })
        .finally(() => setLoading(false))
    }
  }, [formData.date])

  // Prefill contact data from authenticated user when available, without overriding user edits
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: prev.name && prev.name.trim().length > 0 ? prev.name : `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        email: prev.email && prev.email.trim().length > 0 ? prev.email : (user.email || ''),
        phone: prev.phone && prev.phone.trim().length > 0 ? prev.phone : (user.phone || '')
      }))
    }
  }, [user])

  // Helper function to check if a time slot is available
  const isTimeSlotAvailable = (time) => {
    if (!time || availableSlots.length === 0) return false
    const slot = availableSlots.find(avail => avail.time === time)
    return slot?.available || false
  }

  // Enhanced step navigation with animations
  const navigateToStep = (newStep) => {
    setAnimationKey(prev => prev + 1) // Trigger animation
    setTimeout(() => setStep(newStep), 150) // Small delay for smooth transition
  }

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
          <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <span className="text-lg">📅</span>
            <span>Fecha de la Reserva</span>
          </label>
          <div className="relative">
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              min={new Date().toISOString().split('T')[0]}
              max={new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
              className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 text-lg bg-white hover:border-gray-300"
              required
            />
            {formData.date && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            )}
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Reservas disponibles hasta 60 días en adelante
          </div>
        </div>

        {/* Guests Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <span className="text-lg">👥</span>
            <span>Número de Comensales</span>
          </label>
          <div className="relative">
            <select
              name="guests"
              value={formData.guests}
              onChange={handleChange}
              className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 text-lg bg-white hover:border-gray-300 appearance-none cursor-pointer"
            >
              {[1,2,3,4,5,6,7,8,9,10,11,12].map(num => (
                <option key={num} value={num}>
                  {num} {num === 1 ? 'persona' : 'personas'}
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Selecciona el número de personas para tu reserva
          </div>
        </div>
      </div>

      {/* Time Slots */}
      {formData.date && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            🕒 Hora Disponible
          </label>
          
          {loading ? (
            <div className="space-y-4">
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
              
              {/* Loading skeleton for time slots */}
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {timeSlots.map((_, index) => (
                  <div 
                    key={index}
                    className="py-4 px-6 rounded-xl bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="h-6 bg-gray-300 rounded mb-2"></div>
                    <div className="h-3 bg-gray-300 rounded w-3/4 mx-auto"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Show all time slots with availability status */}
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {timeSlots.map((slot, index) => {
                  const availability = availableSlots.find(avail => avail.time === slot)
                  const isAvailable = availability?.available || false
                  const isSelected = formData.time === slot
                  
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => {
                        if (isAvailable) {
                          setFormData({...formData, time: slot})
                        }
                      }}
                      disabled={!isAvailable}
                      className={`relative py-4 px-6 rounded-xl text-sm font-semibold transition-all duration-500 transform hover:scale-110 ${
                        isSelected
                          ? 'bg-gradient-to-br from-primary to-primary/80 text-white shadow-xl shadow-primary/25 border-2 border-primary animate-pulse-glow'
                          : isAvailable
                            ? 'bg-gradient-to-br from-green-50 to-green-100 text-green-700 hover:from-green-100 hover:to-green-200 border-2 border-green-300 hover:border-green-400 shadow-md hover:shadow-lg hover:rotate-1'
                            : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-400 cursor-not-allowed border-2 border-gray-300 opacity-60'
                      }`}
                      style={{
                        animationDelay: `${index * 100}ms`,
                        animation: isAvailable ? 'fadeInUp 0.6s ease-out forwards' : 'none'
                      }}
                      title={isAvailable 
                        ? `Disponible: ${availability?.availableTables || 0} mesas, ${availability?.totalCapacity || 0} asientos`
                        : 'No hay mesas disponibles en este horario'
                      }
                    >
                      {/* Time display with enhanced typography */}
                      <div className="text-center">
                        <div className="text-lg font-bold mb-1">{slot}</div>
                        {isAvailable && (
                          <div className="text-xs opacity-75">
                            {availability?.availableTables || 0} mesas
                          </div>
                        )}
                      </div>
                      
                      {/* Enhanced availability indicator icon */}
                      {isAvailable && (
                        <div className="absolute top-2 right-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg"></div>
                        </div>
                      )}
                      
                      {/* Enhanced selection indicator */}
                      {isSelected && (
                        <div className="absolute -top-2 -right-2 animate-bounce-in">
                          <div className="w-7 h-7 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-xl">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      )}
                      
                      {/* Hover effect overlay */}
                      {isAvailable && (
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                      )}
                    </button>
                  )
                })}
              </div>
              
              {/* Enhanced Availability Legend */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="text-center mb-3">
                  <span className="text-xs font-medium text-gray-600">📊 Leyenda de Disponibilidad</span>
                </div>
                <div className="flex items-center justify-center gap-6 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 rounded-lg shadow-sm"></div>
                    <span className="font-medium text-green-700">Disponible</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-gray-300 rounded-lg shadow-sm opacity-60"></div>
                    <span className="font-medium text-gray-600">No disponible</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gradient-to-br from-primary to-primary/80 rounded-lg shadow-sm"></div>
                    <span className="font-medium text-primary">Seleccionado</span>
                  </div>
                </div>
              </div>
              
              {/* Helpful message for unavailable slots */}
              {availableSlots.some(slot => !slot.available) && (
                <div className="text-center text-xs text-gray-500 bg-gray-50 rounded-lg p-2">
                  💡 Los horarios en gris no tienen mesas disponibles. Selecciona solo horarios en verde.
                </div>
              )}
              
              {/* Real-time availability info */}
              {formData.time && availableSlots.length > 0 && (
                <div className={`border rounded-lg p-3 ${
                  isTimeSlotAvailable(formData.time) 
                    ? 'bg-blue-50 border-blue-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className={`text-sm ${
                    isTimeSlotAvailable(formData.time) ? 'text-blue-800' : 'text-red-800'
                  }`}>
                    <p className="font-medium">
                      {isTimeSlotAvailable(formData.time) ? '📊' : '⚠️'} 
                      Disponibilidad para {formData.time}:
                    </p>
                    {(() => {
                      const selectedSlot = availableSlots.find(avail => avail.time === formData.time)
                      if (selectedSlot) {
                        if (selectedSlot.available) {
                          return (
                            <div className="mt-1 space-y-1">
                              <p>• <strong>{selectedSlot.availableTables}</strong> mesas disponibles</p>
                              <p>• <strong>{selectedSlot.totalCapacity}</strong> asientos totales</p>
                              <p>• Capacidad para grupos de hasta <strong>{selectedSlot.totalCapacity}</strong> personas</p>
                            </div>
                          )
                        } else {
                          return (
                            <div className="mt-1">
                              <p className="font-medium text-red-700">
                                ❌ Este horario no está disponible
                              </p>
                              <p className="text-red-600">
                                Por favor, selecciona otro horario disponible (en verde)
                              </p>
                            </div>
                          )
                        }
                      }
                      return null
                    })()}
                  </div>
                </div>
              )}
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
          onClick={() => navigateToStep(2)}
          disabled={!formData.date || !formData.time || !isTimeSlotAvailable(formData.time)}
          className="group relative px-8 py-4 bg-gradient-to-r from-primary to-primary/80 text-white rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:from-primary/90 hover:to-primary/70 hover:shadow-xl hover:shadow-primary/25 transform hover:scale-105 disabled:hover:scale-100 disabled:hover:shadow-none animate-pulse-glow"
        >
          {/* Floating particles effect */}
          <div className="absolute inset-0 overflow-hidden rounded-xl">
            <div className="absolute -top-1 -left-1 w-2 h-2 bg-white/30 rounded-full animate-ping"></div>
            <div className="absolute -top-2 -right-2 w-1 h-1 bg-white/40 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
            <div className="absolute -bottom-1 -left-2 w-1.5 h-1.5 bg-white/25 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
          </div>
          
          <span className="flex items-center gap-2 relative z-10">
            Continuar
            <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </span>
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
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <span className="text-lg">👤</span>
              <span>Nombre Completo *</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 bg-white hover:border-gray-300"
              placeholder="Tu nombre completo"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <span className="text-lg">📧</span>
              <span>Email *</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 bg-white hover:border-gray-300"
              placeholder="tu@email.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <span className="text-lg">📱</span>
            <span>Teléfono *</span>
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
            className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 bg-white hover:border-gray-300"
            placeholder="Tu número de teléfono"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <span className="text-lg">💬</span>
            <span>Solicitudes Especiales (Opcional)</span>
          </label>
          <textarea
            name="specialRequests"
            value={formData.specialRequests}
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 bg-white hover:border-gray-300 resize-none"
            placeholder="Cumpleaños, aniversario, accesibilidad, alergias, preferencias especiales..."
          />
          <div className="mt-2 text-xs text-gray-500">
            Cuéntanos si tienes alguna solicitud especial para tu visita
          </div>
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
            onClick={() => navigateToStep(1)}
            className="group px-6 py-4 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200 border-2 border-gray-200 hover:border-gray-300 flex items-center gap-2"
          >
            <svg className="w-5 h-5 transition-transform duration-200 group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver
          </button>
          
          <button
            type="submit"
            disabled={loading}
            className="group px-8 py-4 bg-gradient-to-r from-primary to-red-500 text-white rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:from-primary/90 hover:to-red-500/90 hover:shadow-xl hover:shadow-primary/25 transform hover:scale-105 disabled:hover:scale-100 disabled:hover:shadow-none flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Procesando...
              </>
            ) : (
              <>
                🍽️ Confirmar Reserva
                <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )

  // Step 3: Confirmation
  const ConfirmationStep = () => (
    <div className="text-center space-y-6 animate-fade-in-up">
      <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto animate-bounce-in shadow-lg">
        <span className="text-4xl animate-pulse">✅</span>
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
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-blue-800">
                📧 Email de confirmación enviado
              </p>
              <p className="text-xs text-blue-600">
                Revisa tu bandeja de entrada para ver todos los detalles de tu reserva
              </p>
            </div>
          </div>
        </div>
        
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
                phone: user?.phone || '',
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
    <>
      {/* Custom CSS Animations */}
      <style jsx>{`
        @keyframes slideInFromBottom {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes pulseGlow {
          0%, 100% {
            box-shadow: 0 0 5px rgba(59, 130, 246, 0.5);
          }
          50% {
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.8);
          }
        }
        
        @keyframes bounceIn {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-slide-in {
          animation: slideInFromBottom 0.5s ease-out forwards;
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
        }
        
        .animate-pulse-glow {
          animation: pulseGlow 2s ease-in-out infinite;
        }
        
        .animate-bounce-in {
          animation: bounceIn 0.8s ease-out forwards;
        }
        
        .step-enter {
          animation: slideInFromBottom 0.5s ease-out forwards;
        }
        
        .step-exit {
          animation: slideInFromBottom 0.3s ease-in reverse;
        }
      `}</style>
      
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
          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between relative">
              {steps.map((stepItem, index) => (
                <div key={stepItem.id} className="flex flex-col items-center flex-1 relative">
                  {/* Step Circle */}
                  <div className={`relative w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-500 z-10 ${
                    step >= stepItem.id
                      ? 'bg-gradient-to-br from-primary to-primary/80 text-white shadow-lg scale-110'
                      : 'bg-gray-200 text-gray-400 scale-100'
                  }`}>
                    {step > stepItem.id ? (
                      <svg className="w-6 h-6 animate-bounce-in" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <span className={`transition-all duration-300 ${step === stepItem.id ? 'scale-110' : ''}`}>
                        {stepItem.icon}
                      </span>
                    )}
                  </div>
                  
                  {/* Step Title */}
                  <div className="mt-3 text-center">
                    <div className={`text-sm font-semibold ${
                      step >= stepItem.id ? 'text-primary' : 'text-gray-500'
                    }`}>
                      {stepItem.title}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {stepItem.description}
                    </div>
                  </div>
                  
                  {/* Connection Line */}
                  {index < steps.length - 1 && (
                    <div className={`absolute top-6 left-1/2 w-full h-0.5 transition-all duration-300 ${
                      step > stepItem.id ? 'bg-primary' : 'bg-gray-200'
                    }`} style={{ width: '100%', left: '50%' }}></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Animated Step Content */}
          <div 
            key={animationKey}
            className="step-enter"
          >
            {step === 1 && DateTimeStep()}
            {step === 2 && ContactStep()}
            {step === 3 && ConfirmationStep()}
          </div>
        </div>
      </div>
    </div>
    </>
  )
} 