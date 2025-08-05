export default function OrderPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 pt-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-red-500 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">Realizar Pedido</h1>
          <p className="text-xl opacity-90">Completa tu pedido de forma rápida y sencilla</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="text-6xl mb-6">🛒</div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Página de Pedidos</h2>
          <p className="text-gray-600 mb-8">
            Esta página está en desarrollo. Por ahora, puedes realizar pedidos desde el menú.
          </p>
          <div className="flex gap-4 justify-center">
            <a 
              href="/menu" 
              className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Ver Menú
            </a>
            <a 
              href="/contact" 
              className="bg-gray-500 hover:bg-gray-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Contactar
            </a>
          </div>
        </div>
      </div>
    </div>
  )
} 