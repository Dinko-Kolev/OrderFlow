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
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-20 w-32 h-32 bg-primary rounded-full"></div>
          <div className="absolute top-40 right-32 w-24 h-24 bg-red-400 rounded-full"></div>
          <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-orange-300 rounded-full"></div>
          <div className="absolute bottom-20 right-20 w-28 h-28 bg-primary rounded-full"></div>
        </div>

        <div className="relative z-10 text-center px-4 max-w-6xl mx-auto pt-20">
                                {/* Main Hero Content */}
                      <div className="mb-8">
                        <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold mb-4">
                          {isAuthenticated ? `👋 ¡Bienvenido de vuelta, ${user?.firstName}!` : '🍕 Auténtica Pizza Italiana'}
                        </span>
            <h1 className="text-6xl md:text-8xl font-bold text-gray-900 mb-6 leading-tight">
              <span className="bg-gradient-to-r from-primary to-red-500 bg-clip-text text-transparent">
                Bella Vista
              </span>
              <br />
              <span className="text-gray-800">Restaurant</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
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
                        
                        {isAuthenticated ? (
                          <Link href="/profile" className="px-8 py-4 bg-green-500 text-white rounded-full text-lg font-bold hover:bg-green-600 transition-all duration-300 transform hover:scale-105 shadow-xl">
                            👤 Mi Perfil
                          </Link>
                        ) : (
                          <div className="flex flex-col sm:flex-row gap-3">
                            <Link href="/register" className="px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full text-lg font-bold hover:from-green-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105 shadow-xl">
                              🚀 Registro Gratis
                            </Link>
                            <Link href="/login" className="px-6 py-4 bg-transparent border-2 border-gray-700 text-gray-700 rounded-full text-lg font-bold hover:bg-gray-700 hover:text-white transition-all duration-300 transform hover:scale-105">
                              Iniciar Sesión
                            </Link>
                          </div>
                        )}
                      </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">20+</div>
              <div className="text-gray-600">Pizzas Únicas</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">15min</div>
              <div className="text-gray-600">Tiempo Promedio</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">4.9★</div>
              <div className="text-gray-600">Valoración</div>
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
                <span className="text-2xl">🍕</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Ingredientes Frescos</h3>
              <p className="text-gray-600 leading-relaxed">
                Seleccionamos los mejores ingredientes italianos para garantizar un sabor auténtico en cada bocado.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group text-center p-8 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-2xl">🚚</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Entrega Rápida</h3>
              <p className="text-gray-600 leading-relaxed">
                Sistema de entrega optimizado para que recibas tu pizza caliente en tiempo récord.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group text-center p-8 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-2xl">💻</span>
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
              <div className="flex space-x-4">
                <span className="text-2xl cursor-pointer hover:text-primary transition-colors">📘</span>
                <span className="text-2xl cursor-pointer hover:text-primary transition-colors">📷</span>
                <span className="text-2xl cursor-pointer hover:text-primary transition-colors">🐦</span>
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