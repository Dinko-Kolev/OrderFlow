import React, { useState, useEffect } from 'react'
import { useToast } from '../contexts/ToastContext'
import { useTheme } from '../contexts/ThemeContext'
import { XCircle, AlertCircle } from 'lucide-react'

const NewReservationModal = ({ isOpen, onClose, onSubmit, tables = [] }) => {
  const { isDarkMode } = useTheme();
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    reservation_date: '',
    reservation_time: '',
    number_of_guests: '',
    table_id: '',
    special_requests: '',
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Safe toast usage (works even if no provider wraps the component in tests)
  let toastApi = { showToast: () => {}, hideToast: () => {} }
  try {
    toastApi = useToast()
  } catch (e) {
    // ignore - fallback no-op toast
  }
  const { showToast } = toastApi

  // Available time slots for lunch and dinner
  const timeSlots = [
    // Lunch slots
    { value: '12:00:00', label: '12:00 PM' },
    { value: '12:30:00', label: '12:30 PM' },
    { value: '13:00:00', label: '1:00 PM' },
    { value: '13:30:00', label: '1:30 PM' },
    { value: '14:00:00', label: '2:00 PM' },
    { value: '14:30:00', label: '2:30 PM' },
    // Dinner slots
    { value: '19:00:00', label: '7:00 PM' },
    { value: '19:30:00', label: '7:30 PM' },
    { value: '20:00:00', label: '8:00 PM' },
    { value: '20:30:00', label: '8:30 PM' },
    { value: '21:00:00', label: '9:00 PM' },
    { value: '21:30:00', label: '9:30 PM' },
    { value: '22:00:00', label: '10:00 PM' },
  ]

  // Filter tables based on guest count
  const getAvailableTables = () => {
    if (!formData.number_of_guests) {
      return tables.filter(table => table.is_active)
    }
    const guestCount = parseInt(formData.number_of_guests, 10)
    if (Number.isNaN(guestCount)) return tables.filter(table => table.is_active)
    return tables.filter(table => table.is_active && table.capacity >= guestCount)
  }

  // Get availability warning for current party size
  const getAvailabilityWarning = () => {
    if (!formData.number_of_guests) return null;
    
    const guestCount = parseInt(formData.number_of_guests, 10);
    if (Number.isNaN(guestCount)) return null;
    
    const availableTables = getAvailableTables();
    
    if (availableTables.length === 0) {
      return {
        type: 'error',
        message: `No tables available for ${guestCount} guests. Please try a different party size or contact staff.`
      };
    } else if (availableTables.length <= 1) {
      return {
        type: 'warning',
        message: `Limited availability for ${guestCount} guests (${availableTables.length} table available)`
      };
    }
    
    return null;
  };

  // Check if form can be submitted
  const canSubmitForm = () => {
    const warning = getAvailabilityWarning();
    return !warning || warning.type !== 'error';
  };

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        reservation_date: '',
        reservation_time: '',
        number_of_guests: '',
        table_id: '',
        special_requests: '',
      })
      setErrors({})
    }
  }, [isOpen])

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePhone = (phone) => {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/
    return phoneRegex.test(phone)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    let processedValue = value

    // Validate and enforce guest count limits
    if (name === 'number_of_guests') {
      if (value === '') {
        processedValue = ''
      } else {
        const numValue = parseInt(value, 10)
        if (Number.isNaN(numValue) || numValue < 1) processedValue = '1'
        else if (numValue > 20) processedValue = '20'
        else processedValue = String(numValue)
      }
    }

    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }))

    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }

    // Real-time validation
    if (name === 'customer_email' && value && !validateEmail(value)) {
      setErrors(prev => ({
        ...prev,
        customer_email: 'Invalid email format'
      }))
    }

    if (name === 'customer_phone' && value && !validatePhone(value)) {
      setErrors(prev => ({
        ...prev,
        customer_phone: 'Invalid phone format'
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.customer_name.trim()) {
      newErrors.customer_name = 'Customer name is required'
    }

    if (!formData.customer_email.trim()) {
      newErrors.customer_email = 'Email is required'
    } else if (!validateEmail(formData.customer_email)) {
      newErrors.customer_email = 'Invalid email format'
    }

    if (!formData.customer_phone.trim()) {
      newErrors.customer_phone = 'Phone is required'
    } else if (!validatePhone(formData.customer_phone)) {
      newErrors.customer_phone = 'Invalid phone format'
    }

    if (!formData.reservation_date) {
      newErrors.reservation_date = 'Date is required'
    }

    if (!formData.reservation_time) {
      newErrors.reservation_time = 'Time is required'
    }

    if (!formData.table_id) {
      newErrors.table_id = 'Table selection is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // Convert data to match test expectations (strings for numbers)
      const submitData = {
        ...formData,
        number_of_guests: formData.number_of_guests.toString(),
        table_id: formData.table_id.toString(),
      }
      await onSubmit(submitData)
      showToast('Reservation created successfully!', 'success')
      setFormData({
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        reservation_date: '',
        reservation_time: '',
        number_of_guests: '',
        table_id: '',
        special_requests: '',
      })
      setErrors({})
      onClose()
    } catch (error) {
      setErrors({ form: 'Error submitting form. Please try again.' })
      showToast('Failed to create reservation', 'error')
    }
    
    setIsSubmitting(false)
  }

  if (!isOpen) return null

  const availableTables = getAvailableTables()
  const availabilityWarning = getAvailabilityWarning();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`${isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-gray-900'} rounded-lg p-6 w-full max-w-md overflow-y-auto shadow-2xl border ${isDarkMode ? 'border-slate-600' : 'border-gray-200'}`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>New Reservation</h2>
          <button 
            onClick={onClose}
            aria-label="Close"
            className={`${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'} hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full p-1 transition-colors`}
            tabIndex={-1}
          >
            ✕
          </button>
        </div>
        
        <div role="dialog" aria-labelledby="modal-title" className="overflow-y-auto">
          {/* Availability Warning */}
          {availabilityWarning && (
            <div className={`mb-4 p-3 rounded-lg border ${
              availabilityWarning.type === 'error' 
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200' 
                : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-200'
            }`}>
              <div className="flex items-center space-x-2">
                {availabilityWarning.type === 'error' ? (
                  <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                )}
                <span className="text-sm font-medium">{availabilityWarning.message}</span>
              </div>
            </div>
          )}

          <form role="form" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {errors.form && (
              <div className="col-span-full text-red-500 dark:text-red-400 text-sm mb-4" role="alert">
                {errors.form}
              </div>
            )}

            <div className="mb-4">
              <label htmlFor="customer_name" className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Customer Name *
              </label>
              <input
                id="customer_name"
                type="text"
                name="customer_name"
                value={formData.customer_name}
                onChange={handleInputChange}
                required
                className={`w-full p-2 border rounded transition-colors ${
                  isDarkMode 
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500'
                }`}
                placeholder="Enter customer name"
              />
              {errors.customer_name && (
                <div className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.customer_name}</div>
              )}
            </div>

            <div className="mb-4">
              <label htmlFor="customer_email" className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Email *
              </label>
              <input
                id="customer_email"
                type="email"
                name="customer_email"
                value={formData.customer_email}
                onChange={handleInputChange}
                required
                className={`w-full p-2 border rounded transition-colors ${
                  isDarkMode 
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500'
                }`}
                placeholder="Enter email address"
              />
              {errors.customer_email && (
                <div className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.customer_email}</div>
              )}
            </div>

            <div className="mb-4">
              <label htmlFor="customer_phone" className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Phone *
              </label>
              <input
                id="customer_phone"
                type="tel"
                name="customer_phone"
                value={formData.customer_phone}
                onChange={handleInputChange}
                required
                className={`w-full p-2 border rounded transition-colors ${
                  isDarkMode 
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500'
                }`}
                placeholder="Enter phone number"
              />
              {errors.customer_phone && (
                <div className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.customer_phone}</div>
              )}
            </div>

            <div className="mb-4">
              <label htmlFor="number_of_guests" className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Number of Guests *
              </label>
              <input
                id="number_of_guests"
                type="number"
                name="number_of_guests"
                min="1"
                max="20"
                value={formData.number_of_guests}
                onChange={handleInputChange}
                required
                className={`w-full p-2 border rounded transition-colors ${
                  isDarkMode 
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500'
                }`}
                placeholder="1-20 guests"
              />
              {errors.number_of_guests && (
                <div className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.number_of_guests}</div>
              )}
            </div>

            <div className="mb-4">
              <label htmlFor="reservation_date" className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Date *
              </label>
              <input
                id="reservation_date"
                type="date"
                name="reservation_date"
                value={formData.reservation_date}
                onChange={handleInputChange}
                required
                className={`w-full p-2 border rounded transition-colors ${
                  isDarkMode 
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500'
                }`}
              />
              {errors.reservation_date && (
                <div className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.reservation_date}</div>
              )}
            </div>

            <div className="mb-4">
              <label htmlFor="reservation_time" className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Time *
              </label>
              <select
                id="reservation_time"
                name="reservation_time"
                value={formData.reservation_time}
                onChange={handleInputChange}
                required
                className={`w-full p-2 border rounded transition-colors ${
                  isDarkMode 
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500'
                }`}
              >
                <option value="">Select time</option>
                {timeSlots.map(slot => (
                  <option
                    key={slot.value}
                    value={slot.value}
                    onClick={() => setFormData(prev => ({ ...prev, reservation_time: slot.value }))}
                  >
                    {slot.label}
                  </option>
                ))}
              </select>
              {errors.reservation_time && (
                <div className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.reservation_time}</div>
              )}
            </div>

            <div className="mb-4">
              <label htmlFor="table_id" className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Table * {availableTables.length > 0 && (
                  <span className={`text-xs font-normal ${
                    availableTables.length <= 1 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'
                  }`}>
                    ({availableTables.length} table{availableTables.length !== 1 ? 's' : ''} available)
                  </span>
                )}
              </label>
              <select
                id="table_id"
                name="table_id"
                value={formData.table_id}
                onChange={handleInputChange}
                required
                className={`w-full p-2 border rounded transition-colors ${
                  isDarkMode 
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500'
                }`}
              >
                <option value="">Select a table</option>
                {availableTables.map(table => (
                  <option
                    key={table.id}
                    value={String(table.id)}
                    onClick={() => setFormData(prev => ({ ...prev, table_id: String(table.id) }))}
                  >
                    Table {table.table_number} ({table.capacity} seats)
                  </option>
                ))}
              </select>
              {errors.table_id && (
                <div className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.table_id}</div>
              )}
            </div>

            <div className="mb-4 col-span-full">
              <label htmlFor="special_requests" className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Special Requests
              </label>
              <textarea
                id="special_requests"
                name="special_requests"
                value={formData.special_requests}
                onChange={handleInputChange}
                rows="3"
                className={`w-full p-2 border rounded transition-colors ${
                  isDarkMode 
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500'
                }`}
                placeholder="Any special requests or notes..."
              />
            </div>

            <div className="flex justify-end space-x-2 col-span-full">
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2 border rounded transition-colors ${
                  isDarkMode 
                    ? 'text-gray-300 border-slate-600 hover:bg-slate-700 hover:text-white' 
                    : 'text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !canSubmitForm()}
                className={`px-4 py-2 text-white rounded transition-colors ${
                  isSubmitting || !canSubmitForm()
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isSubmitting 
                  ? 'Creating...' 
                  : !canSubmitForm() 
                    ? 'No Tables Available' 
                    : 'Create Reservation'
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default NewReservationModal
