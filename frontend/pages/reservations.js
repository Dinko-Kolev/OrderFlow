import ReservationSystem from '../components/ReservationSystem'
import Head from 'next/head'

export default function ReservationsPage() {
  return (
    <>
      <Head>
        <title>Reservas - Bella Vista Restaurant</title>
        <meta name="description" content="Reserva tu mesa en Bella Vista Restaurant. Sistema de reservas online con disponibilidad en tiempo real." />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 pt-20">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-red-500 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-4">🍽️ Reserva tu Mesa</h1>
            <p className="text-xl opacity-90">Disfruta de una experiencia gastronómica única</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* Benefits Section */}
          <div className="mb-12">
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="text-center p-6 bg-white rounded-xl shadow-lg">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">⚡</span>
                </div>
                <h3 className="font-bold text-gray-800 mb-2">Confirmación Inmediata</h3>
                <p className="text-gray-600 text-sm">Reserva confirmada al instante con disponibilidad en tiempo real</p>
              </div>

              <div className="text-center p-6 bg-white rounded-xl shadow-lg">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📱</span>
                </div>
                <h3 className="font-bold text-gray-800 mb-2">Recordatorios SMS</h3>
                <p className="text-gray-600 text-sm">Te enviamos recordatorios 24h antes de tu visita</p>
              </div>

              <div className="text-center p-6 bg-white rounded-xl shadow-lg">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🎂</span>
                </div>
                <h3 className="font-bold text-gray-800 mb-2">Ocasiones Especiales</h3>
                <p className="text-gray-600 text-sm">Celebraciones personalizadas para tus momentos únicos</p>
              </div>
            </div>
          </div>

          {/* Reservation System */}
          <ReservationSystem />

          {/* Additional Info */}
          <div className="mt-12 grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">📋 Información Importante</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Reservas hasta 60 días por adelantado</li>
                <li>• Mesa reservada por 2 horas</li>
                <li>• Grupos de más de 8 personas: llamar directamente</li>
                <li>• Cancelación gratuita hasta 2 horas antes</li>
                <li>• Menú degustación requiere pre-pedido</li>
              </ul>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">🕒 Horarios de Reserva</h3>
              <div className="space-y-2 text-gray-600">
                <p><strong>Almuerzo:</strong> 12:00 - 15:00</p>
                <p><strong>Cena:</strong> 19:00 - 22:00</p>
                <p><strong>Cocina cierra:</strong> 22:30</p>
                <p><strong>Domingo:</strong> Solo cenas</p>
              </div>
              
              <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Nota:</strong> Fines de semana muy concurridos. 
                  Recomendamos reservar con antelación.
                </p>
              </div>
            </div>
          </div>

          {/* Contact for Special Events */}
          <div className="mt-12 bg-gradient-to-r from-primary/5 to-red-500/5 rounded-xl p-8 text-center">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">🎉 Eventos Especiales</h3>
            <p className="text-gray-600 mb-6">
              ¿Planeas una celebración especial? Nuestro equipo te ayudará a crear una experiencia inolvidable.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="/contact" 
                className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                📞 Contactar para Eventos
              </a>
              <a 
                href="tel:(555)123-PIZZA" 
                className="px-6 py-3 bg-white border-2 border-primary text-primary rounded-lg font-semibold hover:bg-primary/5 transition-colors"
              >
                Llamar Directamente
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  )
} 