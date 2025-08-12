/**
 * Application Module
 * Main dependency injection and configuration container
 */
const OrderService = require('./modules/OrderService')
const ProductService = require('./modules/ProductService')
const OrderController = require('./modules/OrderController')
const ProductController = require('./modules/ProductController')

/**
 * Application Module Class
 * Manages dependency injection and service initialization
 */
class AppModule {
  constructor(dbPool) {
    this.dbPool = dbPool
    this.services = {}
    this.controllers = {}
    
    this.initializeServices()
    this.initializeControllers()
  }

  /**
   * Initialize all services
   */
  initializeServices() {
    // Core services
    this.services.orderService = new OrderService(this.dbPool)
    this.services.productService = new ProductService(this.dbPool)
    
    console.log('✅ Services initialized:', Object.keys(this.services))
  }

  /**
   * Initialize all controllers
   */
  initializeControllers() {
    // Core controllers
    this.controllers.orderController = new OrderController(this.services.orderService)
    this.controllers.productController = new ProductController(this.services.productService)
    
    console.log('✅ Controllers initialized:', Object.keys(this.controllers))
  }

  /**
   * Get a service by name
   */
  getService(serviceName) {
    if (!this.services[serviceName]) {
      throw new Error(`Service '${serviceName}' not found`)
    }
    return this.services[serviceName]
  }

  /**
   * Get a controller by name
   */
  getController(controllerName) {
    if (!this.controllers[controllerName]) {
      throw new Error(`Controller '${controllerName}' not found`)
    }
    return this.controllers[controllerName]
  }

  /**
   * Get all services
   */
  getServices() {
    return this.services
  }

  /**
   * Get all controllers
   */
  getControllers() {
    return this.controllers
  }

  /**
   * Health check for all services
   */
  async healthCheck() {
    try {
      // Test database connection
      await this.dbPool.query('SELECT 1')
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: Object.keys(this.services),
        controllers: Object.keys(this.controllers),
        database: 'connected'
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
        database: 'disconnected'
      }
    }
  }
}

module.exports = AppModule
