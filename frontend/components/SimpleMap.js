import { useState } from 'react'

const SimpleMap = ({ 
  address = "Calle Gran Vía, 123, Madrid", 
  height = "400px"
}) => {
  const [isExpanded, setIsExpanded] = useState(false)

  // Encode address for Google Maps URL (this will open in new tab)
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
  
  // OpenStreetMap URL (also opens in new tab)
  const openStreetMapUrl = `https://www.openstreetmap.org/search?query=${encodeURIComponent(address)}`

  return (
    <div className="relative">
      {/* Map Container */}
      <div 
        className="w-full rounded-lg shadow-lg bg-gradient-to-br from-blue-50 to-green-50 border-2 border-dashed border-blue-300"
        style={{ height }}
      >
        {/* Map Content */}
        <div className="h-full flex flex-col items-center justify-center p-6 text-center">
          {/* Map Icon */}
          <div className="mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-3xl">🗺️</span>
            </div>
          </div>
          
          {/* Address Display */}
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            Bella Vista Restaurant
          </h3>
          <p className="text-gray-600 mb-4 max-w-xs">
            {address}
          </p>
          
          {/* Map Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
            {/* Google Maps Button */}
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              Google Maps
            </a>
            
            {/* OpenStreetMap Button */}
            <a
              href={openStreetMapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              OpenStreetMap
            </a>
          </div>
          
          {/* Additional Info */}
          <div className="mt-6 text-sm text-gray-500">
            <p>Click either button to open detailed map</p>
            <p className="mt-1">📍 Interactive map coming soon!</p>
          </div>
        </div>
      </div>
      
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

      {/* Expand/Collapse Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute top-4 right-4 bg-white hover:bg-gray-50 text-gray-700 p-2 rounded-lg shadow-md transition-colors"
        title={isExpanded ? "Collapse" : "Expand"}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isExpanded ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          )}
        </svg>
      </button>

      {/* Expanded Information */}
      {isExpanded && (
        <div className="absolute top-16 right-4 bg-white rounded-lg shadow-lg p-4 max-w-xs z-10">
          <h4 className="font-semibold text-gray-800 mb-2">📍 Location Details</h4>
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>Address:</strong> {address}</p>
            <p><strong>Metro:</strong> Gran Vía (Líneas 1, 5)</p>
            <p><strong>Walking:</strong> 2 minutes from metro</p>
            <p><strong>Parking:</strong> Available nearby</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default SimpleMap
