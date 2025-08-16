import { useEffect, useRef, useState } from 'react'

const GoogleMap = ({ 
  address = "Calle Gran Vía, 123, Madrid", 
  zoom = 15, 
  height = "400px",
  showMarker = true,
  showInfoWindow = true 
}) => {
  const mapRef = useRef(null)
  const [map, setMap] = useState(null)
  const [marker, setMarker] = useState(null)
  const [infoWindow, setInfoWindow] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Load Google Maps script
    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        initializeMap()
        return
      }

      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`
      script.async = true
      script.defer = true
      script.onload = initializeMap
      script.onerror = () => setError('Failed to load Google Maps')
      document.head.appendChild(script)
    }

    const initializeMap = () => {
      try {
        // Geocode the address
        const geocoder = new window.google.maps.Geocoder()
        
        geocoder.geocode({ address }, (results, status) => {
          if (status === 'OK' && results[0]) {
            const location = results[0].geometry.location
            
            // Create map
            const newMap = new window.google.maps.Map(mapRef.current, {
              center: location,
              zoom: zoom,
              mapTypeId: window.google.maps.MapTypeId.ROADMAP,
              mapTypeControl: false,
              streetViewControl: false,
              fullscreenControl: true,
              zoomControl: true,
              styles: [
                {
                  featureType: 'poi.business',
                  elementType: 'labels',
                  stylers: [{ visibility: 'off' }]
                }
              ]
            })

            setMap(newMap)

            // Add marker if requested
            if (showMarker) {
              const newMarker = new window.google.maps.Marker({
                position: location,
                map: newMap,
                title: 'Bella Vista Restaurant',
                icon: {
                  url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="16" cy="16" r="16" fill="#BFFF02"/>
                      <path d="M16 4C10.48 4 6 8.48 6 14c0 8 10 18 10 18s10-10 10-18c0-5.52-4.48-10-10-10zm0 16c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z" fill="#1a1a1a"/>
                    </svg>
                  `),
                  scaledSize: new window.google.maps.Size(32, 32),
                  anchor: new window.google.maps.Point(16, 32)
                }
              })

              setMarker(newMarker)

              // Add info window if requested
              if (showInfoWindow) {
                const newInfoWindow = new window.google.maps.InfoWindow({
                  content: `
                    <div style="padding: 10px; max-width: 200px;">
                      <h3 style="margin: 0 0 8px 0; color: #BFFF02; font-size: 16px;">🍕 Bella Vista Restaurant</h3>
                      <p style="margin: 0; font-size: 14px; color: #666;">${address}</p>
                      <p style="margin: 5px 0 0 0; font-size: 12px; color: #999;">Cocina italiana auténtica</p>
                    </div>
                  `
                })

                setInfoWindow(newInfoWindow)

                // Show info window on marker click
                newMarker.addListener('click', () => {
                  newInfoWindow.open(newMap, newMarker)
                })

                // Show info window by default
                newInfoWindow.open(newMap, newMarker)
              }
            }

            setIsLoading(false)
          } else {
            setError('Could not find the address')
            setIsLoading(false)
          }
        })
      } catch (err) {
        setError('Failed to initialize map')
        setIsLoading(false)
      }
    }

    loadGoogleMaps()

    // Cleanup
    return () => {
      if (infoWindow) infoWindow.close()
    }
  }, [address, zoom, showMarker, showInfoWindow])

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <p className="text-red-600 text-sm">⚠️ {error}</p>
        <p className="text-red-500 text-xs mt-1">Please check your Google Maps API key</p>
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
      
      {/* Map Controls Overlay */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <button
          onClick={() => map && map.setZoom(map.getZoom() + 1)}
          className="bg-white hover:bg-gray-50 text-gray-700 p-2 rounded-lg shadow-md transition-colors"
          title="Zoom In"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
        
        <button
          onClick={() => map && map.setZoom(map.getZoom() - 1)}
          className="bg-white hover:bg-gray-50 text-gray-700 p-2 rounded-lg shadow-md transition-colors"
          title="Zoom Out"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
      </div>

      {/* Address Display */}
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
    </div>
  )
}

export default GoogleMap
