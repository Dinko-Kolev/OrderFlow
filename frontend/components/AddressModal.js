import { useState, useEffect } from 'react'
import { api } from '../lib/api'

/**
 * AddressModal - Reusable component for managing addresses
 * Used in both profile and checkout pages
 */
const AddressModal = ({ 
  isOpen, 
  onClose, 
  userId, 
  addresses, 
  onAddressesChange,
  onAddressSelect = null, // Optional: for checkout page to select address
  showSelectionMode = false // Optional: for checkout page to show selection mode
}) => {
  const [addressForm, setAddressForm] = useState({
    id: null,
    street: '',
    city: '',
    state: '',
    zip_code: '',
    is_default: false
  })
  const [addressErrors, setAddressErrors] = useState({})
  const [addressesLoading, setAddressesLoading] = useState(false)

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setAddressForm({ id: null, street: '', city: '', state: '', zip_code: '', is_default: false })
      setAddressErrors({})
    }
  }, [isOpen])

  const openAddressModal = (addr = null) => {
    if (addr) {
      setAddressForm({ 
        id: addr.id, 
        street: addr.street, 
        city: addr.city, 
        state: addr.state, 
        zip_code: addr.zip_code, 
        is_default: !!addr.is_default 
      })
    } else {
      setAddressForm({ id: null, street: '', city: '', state: '', zip_code: '', is_default: false })
    }
    setAddressErrors({})
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
        ? await api.addresses.update(userId, addressForm.id, addressForm)
        : await api.addresses.create(userId, addressForm)
      console.log('Address save response:', res)
      if (!res?.success) {
        alert(res?.error || 'No se pudo guardar la dirección')
        return
      }
      onClose()
      // Refresh addresses list
      if (onAddressesChange) {
        onAddressesChange()
      }
    } catch (e) {
      console.error('Failed to save address', e)
      alert('Error de conexión al guardar la dirección')
    }
  }

  const deleteAddress = async (id) => {
    try {
      await api.addresses.delete(userId, id)
      if (onAddressesChange) {
        onAddressesChange()
      }
    } catch (e) {
      console.error('Failed to delete address', e)
    }
  }

  const setDefaultAddress = async (addr) => {
    try {
      await api.addresses.update(userId, addr.id, {
        street: addr.street,
        city: addr.city,
        state: addr.state,
        zip_code: addr.zip_code,
        is_default: true
      })
      if (onAddressesChange) {
        onAddressesChange()
      }
    } catch (e) {
      console.error('Failed to set default address', e)
    }
  }

  const handleAddressSelect = (addr) => {
    if (onAddressSelect) {
      onAddressSelect(addr)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-2xl font-bold text-gray-800">📍 Direcciones</h3>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="grid lg:grid-cols-2 gap-0 h-full">
          {/* Left Section: Address Form */}
          <div className="p-6 border-r border-gray-200">
            <h4 className="text-lg font-semibold text-gray-800 mb-6">Añadir Nueva Dirección</h4>
            
            <div className="space-y-4">
              {/* Street */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Calle y número *
                </label>
                <input 
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                    addressErrors.street ? 'border-red-300' : 'border-gray-300'
                  }`} 
                  value={addressForm.street} 
                  onChange={e => setAddressForm(f => ({...f, street: e.target.value}))} 
                  placeholder="Ej: Calle Mayor, 123"
                />
                {addressErrors.street && (
                  <p className="text-xs text-red-600 mt-1">{addressErrors.street}</p>
                )}
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ciudad *
                </label>
                <input 
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                    addressErrors.city ? 'border-red-300' : 'border-gray-300'
                  }`} 
                  value={addressForm.city} 
                  onChange={e => setAddressForm(f => ({...f, city: e.target.value}))} 
                  placeholder="Ej: Madrid"
                />
                {addressErrors.city && (
                  <p className="text-xs text-red-600 mt-1">{addressErrors.city}</p>
                )}
              </div>

              {/* Province and Postal Code */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Provincia *
                  </label>
                  <input 
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                      addressErrors.state ? 'border-red-300' : 'border-gray-300'
                    }`} 
                    value={addressForm.state} 
                    onChange={e => setAddressForm(f => ({...f, state: e.target.value}))} 
                    placeholder="Ej: Madrid"
                  />
                  {addressErrors.state && (
                    <p className="text-xs text-red-600 mt-1">{addressErrors.state}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código Postal *
                  </label>
                  <input 
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                      addressErrors.zip_code ? 'border-red-300' : 'border-gray-300'
                    }`} 
                    value={addressForm.zip_code} 
                    onChange={e => setAddressForm(f => ({...f, zip_code: e.target.value}))} 
                    placeholder="Ej: 28001"
                  />
                  {addressErrors.zip_code && (
                    <p className="text-xs text-red-600 mt-1">{addressErrors.zip_code}</p>
                  )}
                </div>
              </div>

              {/* Default Address Checkbox */}
              <div className="pt-2">
                <label className="inline-flex items-center gap-3 text-sm cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={addressForm.is_default} 
                    onChange={e => setAddressForm(f => ({...f, is_default: e.target.checked}))} 
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <span className="text-gray-700">Usar como dirección predeterminada</span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button 
                  className="flex-1 px-6 py-3 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors font-medium" 
                  onClick={onClose}
                >
                  Cancelar
                </button>
                <button 
                  className="flex-1 px-6 py-3 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors font-medium" 
                  onClick={saveAddress}
                >
                  {addressForm.id ? 'Guardar Cambios' : 'Añadir Dirección'}
                </button>
              </div>
            </div>
          </div>

          {/* Right Section: Saved Addresses */}
          <div className="p-6 bg-gray-50">
            <h4 className="text-lg font-semibold text-gray-800 mb-6">Direcciones Guardadas</h4>
            
            {addressesLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-gray-500 mt-2">Cargando...</p>
              </div>
            ) : addresses.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className="text-gray-500">No tienes direcciones guardadas</p>
                <p className="text-sm text-gray-400 mt-1">Añade tu primera dirección</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {addresses.map(addr => (
                  <div key={addr.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 truncate">{addr.street}</p>
                        <p className="text-sm text-gray-600 mt-1">{addr.city}, {addr.state} {addr.zip_code}</p>
                        {addr.is_default && (
                          <span className="inline-flex items-center text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 mt-2">
                            Predeterminada
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        {showSelectionMode && onAddressSelect && (
                          <button 
                            className="px-3 py-1.5 rounded-lg bg-primary text-white text-sm hover:bg-primary/90 transition-colors font-medium"
                            onClick={() => handleAddressSelect(addr)}
                          >
                            Seleccionar
                          </button>
                        )}
                        <button 
                          className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-sm hover:bg-gray-200 transition-colors" 
                          onClick={() => openAddressModal(addr)}
                        >
                          Editar
                        </button>
                        <button 
                          className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-sm hover:bg-red-600 transition-colors" 
                          onClick={() => deleteAddress(addr.id)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">Máximo 4 direcciones guardadas</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AddressModal
