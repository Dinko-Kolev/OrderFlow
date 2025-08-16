import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default markers in Leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

const FreeMap = ({ 
  address = "Calle Gran Vía, 123, Madrid", 
  zoom = 16, 
  height = "400px",
  showMarker = true,
  showInfoWindow = true 
}) => {
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const markerRef = useRef(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [coordinates, setCoordinates] = useState(null)

  useEffect(() => {
    // Geocode address using free Nominatim service
    const geocodeAddress = async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
        )
        const data = await response.json()
        
        if (data && data.length > 0) {
          const { lat, lon } = data[0]
          setCoordinates([parseFloat(lat), parseFloat(lon)])
          setIsLoading(false)
        } else {
          setError('Could not find the address')
          setIsLoading(false)
        }
      } catch (err) {
        setError('Failed to geocode address')
        setIsLoading(false)
      }
    }

    geocodeAddress()
  }, [address])

  useEffect(() => {
    if (!coordinates || !mapRef.current) return

    // Initialize map
    const map = L.map(mapRef.current).setView(coordinates, zoom)
    mapInstance.current = map

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(map)

    // Add custom marker if requested
    if (showMarker) {
      // Create custom marker icon with Bella Vista branding
      const customIcon = L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="
            width: 32px; 
            height: 32px; 
            background: #BFFF02; 
            border: 3px solid #1a1a1a; 
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            font-size: 18px; 
            color: #1a1a1a;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          ">
            🍕
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
      })

      const marker = L.marker(coordinates, { icon: customIcon }).addTo(map)
      markerRef.current = marker

      // Add popup with restaurant info
      if (showInfoWindow) {
        const popupContent = `
          <div style="text-align: center; min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; color: #BFFF02; font-size: 16px; font-weight: bold;">
              🍕 Bella Vista Restaurant
            </h3>
            <p style="margin: 0; font-size: 14px; color: #666;">
              ${address}
            </p>
            <p style="margin: 5px 0 0 0; font-size: 12px; color: #999;">
              Cocina italiana auténtica
            </p>
          </div>
        `
        marker.bindPopup(popupContent).openPopup()
      }
    }

    // Add zoom controls
    L.control.zoom({
      position: 'topright'
    }).addTo(map)

    // Add scale bar
    L.control.scale({
      position: 'bottomleft',
      metric: true,
      imperial: false
    }).addTo(map)

    // Cleanup function
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove()
      }
    }
  }, [coordinates, zoom, showMarker, showInfoWindow])

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center" style={{ height }}>
        <p className="text-red-600 text-sm">⚠️ {error}</p>
        <p className="text-red-500 text-xs mt-1">Please check the address format</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="bg-gray-100 rounded-lg p-4 text-center" style={{ height }}>
        <div className="animate-pulse">
          <div className="bg-gray-300 rounded h-4 w-32 mx-auto mb-2"></div>
          <div className="bg-gray-300 rounded h-4 w-24 mx-auto"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      <div 
        ref={mapRef} 
        className="w-full rounded-lg shadow-lg"
        style={{ height }}
      />
      
      {/* Address Display Overlay */}
      <div className="absolute bottom-4 left-4 bg-white bg-opacity-95 backdrop-blur-sm rounded-lg p-3 shadow-lg max-w-xs">
        <div className="flex items-start gap-2">
          <div className="text-green-500 mt-0.5">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Bella Vista Restaurant</p>
            <p className="text-xs text-gray-600">{address}</p>
          </div>
        </div>
      </div>

      {/* Map Info Overlay */}
      <div className="absolute top-4 left-4 bg-white bg-opacity-90 rounded-lg p-2 text-xs text-gray-600">
        Powered by OpenStreetMap
      </div>
    </div>
  )
}

export default FreeMap
