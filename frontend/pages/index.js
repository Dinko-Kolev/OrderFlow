import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import ReservationSystem from '../components/ReservationSystem';

export default function HomePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      {/* Hero Section */}
      <section className="relative min-h-screen md:min-h-screen flex items-center justify-center overflow-hidden" style={{ minHeight: '100vh' }}>
        {/* Video Background */}
        <div className="absolute inset-0 z-0 bg-black">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="object-cover w-full h-full md:object-cover"
            style={{ 
              width: '100vw', 
              height: '100vh',
              objectPosition: 'center center',
              minHeight: '100vh',
              minWidth: '100vw'
            }}
            onLoadedData={() => console.log('Video loaded successfully')}
            onError={(e) => console.error('Video error:', e)}
          >
            <source src="/videos/pizzacomercial2.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
        
        {/* White Overlay for Better Text Readability */}
        <div className="absolute inset-0 z-0 bg-white opacity-60"></div>

        <div className="relative z-10 text-center px-4 max-w-6xl mx-auto pt-8 md:pt-20">
                                {/* Main Hero Content */}
                      <div className="mb-8">
            <h1 className="text-6xl md:text-8xl font-bold text-gray-900 mb-6 leading-tight drop-shadow-lg">
              <span className="bg-gradient-to-r from-primary to-red-500 bg-clip-text text-transparent drop-shadow-lg">
                Bella Vista
              </span>
              <br />
              <span className="text-gray-900 drop-shadow-lg">Restaurant</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-800 mb-8 max-w-3xl mx-auto leading-relaxed drop-shadow-md">
              Descubre el auténtico sabor italiano con nuestras pizzas artesanales, 
              hechas con ingredientes frescos y recetas tradicionales.
            </p>
          </div>

                                {/* Hero Buttons */}
                      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                        <Link href="/menu" className="group relative">
                          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-red-500 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
                          <button className="relative bg-white px-8 py-4 rounded-full text-lg font-bold text-primary hover:text-white hover:bg-primary transition-all duration-300 transform hover:scale-105 shadow-xl">
                            🍕 Ver Menú Completo
                          </button>
                        </Link>

                        <button 
                          onClick={() => setShowReservationModal(true)}
                          className="px-8 py-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-full text-lg font-bold hover:from-purple-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-xl"
                        >
                          🍽️ Reservar Mesa
                        </button>
                        
                        {isAuthenticated && (
                          <Link href="/profile" className="hidden md:inline-block px-8 py-4 bg-green-500 text-white rounded-full text-lg font-bold hover:bg-green-600 transition-all duration-300 transform hover:scale-105 shadow-xl">
                            👤 Mi Perfil
                          </Link>
                        )}
                      </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 md:gap-8 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="text-2xl md:text-4xl font-bold text-primary mb-2 drop-shadow-lg">20+</div>
              <div className="text-sm md:text-base text-gray-800 font-semibold drop-shadow-md">Pizzas Únicas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-4xl font-bold text-primary mb-2 drop-shadow-lg">15min</div>
              <div className="text-sm md:text-base text-gray-800 font-semibold drop-shadow-md">Tiempo Promedio</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-4xl font-bold text-primary mb-2 drop-shadow-lg">4.9★</div>
              <div className="text-sm md:text-base text-gray-800 font-semibold drop-shadow-md">Valoración</div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-primary rounded-full flex justify-center">
            <div className="w-1 h-3 bg-primary rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              ¿Por qué elegir <span className="text-primary">Bella Vista</span>?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Combinamos tradición italiana con tecnología moderna para ofrecerte la mejor experiencia
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group text-center p-8 rounded-2xl bg-gradient-to-br from-orange-50 to-red-50 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-4xl">🌿</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Ingredientes Frescos</h3>
              <p className="text-gray-600 leading-relaxed">
                Seleccionamos los mejores ingredientes italianos para garantizar un sabor auténtico en cada bocado.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group text-center p-8 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-4xl">⚡</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Entrega Rápida</h3>
              <p className="text-gray-600 leading-relaxed">
                Sistema de entrega optimizado para que recibas tu pizza caliente en tiempo récord.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group text-center p-8 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-4xl">📱</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Pedido Online</h3>
              <p className="text-gray-600 leading-relaxed">
                Plataforma moderna y fácil de usar para realizar tu pedido desde cualquier dispositivo.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-red-500">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Lo que dicen nuestros clientes
            </h2>
            <p className="text-xl text-white/90 max-w-3xl mx-auto">
              Miles de clientes satisfechos avalan nuestra calidad
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-white">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-4">
                  <span className="text-lg">👨</span>
                </div>
                <div>
                  <div className="font-bold">Carlos M.</div>
                  <div className="text-white/80 text-sm">Cliente habitual</div>
                </div>
              </div>
              <p className="text-white/90 italic">
                "La mejor pizza italiana de la ciudad. Ingredientes frescos y sabor auténtico. ¡Altamente recomendado!"
              </p>
              <div className="flex text-yellow-300 mt-4">
                ★★★★★
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-white">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-4">
                  <span className="text-lg">👩</span>
                </div>
                <div>
                  <div className="font-bold">Ana L.</div>
                  <div className="text-white/80 text-sm">Food blogger</div>
                </div>
              </div>
              <p className="text-white/90 italic">
                "Entrega súper rápida y la pizza llegó perfecta. El servicio al cliente es excepcional."
              </p>
              <div className="flex text-yellow-300 mt-4">
                ★★★★★
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-white">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-4">
                  <span className="text-lg">👨</span>
                </div>
                <div>
                  <div className="font-bold">Miguel R.</div>
                  <div className="text-white/80 text-sm">Chef profesional</div>
                </div>
              </div>
              <p className="text-white/90 italic">
                "Como chef, puedo afirmar que la calidad de sus ingredientes y técnica es impecable."
              </p>
              <div className="flex text-yellow-300 mt-4">
                ★★★★★
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            ¿Listo para disfrutar?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Explora nuestro menú completo y descubre tu nueva pizza favorita
          </p>
          <Link href="/menu" className="group relative inline-block">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-red-500 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
            <button className="relative bg-white px-10 py-5 rounded-full text-xl font-bold text-primary hover:text-white hover:bg-primary transition-all duration-300 transform hover:scale-105">
              🍕 Explorar Menú
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold text-primary mb-4">Bella Vista</h3>
              <p className="text-gray-400">
                Auténtica cocina italiana en el corazón de la ciudad.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Contacto</h4>
              <p className="text-gray-400">📞 (555) 123-PIZZA</p>
              <p className="text-gray-400">📧 hello@bellavista.com</p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Horarios</h4>
              <p className="text-gray-400">Lun-Dom: 11:00 - 23:00</p>
              <p className="text-gray-400">Entrega hasta las 22:30</p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Síguenos</h4>
              <div className="flex flex-col sm:flex-row justify-start items-center gap-6">
                <div className="flex gap-4">
                  <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="group w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-all duration-300 hover:scale-110 shadow-lg" aria-label="Síguenos en Facebook">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"></path></svg>
                  </a>
                  <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="group w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-500 rounded-full flex items-center justify-center text-white hover:from-purple-700 hover:to-pink-600 transition-all duration-300 hover:scale-110 shadow-lg" aria-label="Síguenos en Instagram">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"></path></svg>
                  </a>
                  <a href="https://google.com" target="_blank" rel="noopener noreferrer" className="group w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-all duration-300 hover:scale-110 shadow-lg" aria-label="Encuéntranos en Google">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"></path><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"></path><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"></path><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"></path></svg>
                  </a>
                  <a href="https://wa.me" target="_blank" rel="noopener noreferrer" className="group w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white hover:bg-green-600 transition-all duration-300 hover:scale-110 shadow-lg" aria-label="Contáctanos por WhatsApp">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.488"></path></svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Bella Vista Restaurant. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>

      {/* Reservation Modal */}
      {showReservationModal && (
        <ReservationSystem 
          isModal={true} 
          onClose={() => setShowReservationModal(false)} 
        />
      )}
    </div>
  );
}