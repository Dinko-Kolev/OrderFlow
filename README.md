# OrderFlow - Pizza Ordering & Restaurant Management System

A comprehensive full-stack restaurant management system built with Next.js frontend, Express.js backend, and PostgreSQL database, orchestrated with Docker Compose. Features include pizza ordering, table reservations, real-time table management, automated email confirmations, **Stripe payment processing**, **comprehensive security system**, and **advanced bot protection**.

## 🏗️ Architecture

```
OrderFlow/
├── frontend/           # Customer-facing Next.js React application
├── backend/            # Main Express.js API server with modular services
├── admin-dashboard/    # Admin interface Next.js application
├── admin-backend/      # Admin-specific Express.js API server
├── kitchen-display/    # Kitchen display Next.js application (planned)
├── database/           # PostgreSQL database with schema and functions
├── docker-compose.yml  # Multi-container orchestration
├── setup.sh           # Automated setup script
└── .env               # Environment variables for Docker Compose
```

### Tech Stack
- **Frontend**: Next.js, React 18, Tailwind CSS
- **Backend**: Express.js (modular services/controllers architecture)
- **Database**: PostgreSQL 15
- **Payment**: Stripe Payment Gateway
- **Security**: Google reCAPTCHA v3, Rate Limiting, Input Validation
- **Containerization**: Docker & Docker Compose
- **Development**: Hot reload enabled for both frontend and backend

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Node.js 18+ (for local development)
- Git
- **Stripe Account** (for payment processing)

### Running with Docker (Recommended)

#### **🚀 One-Command Setup**
```bash
# Automated setup script handles everything
./setup.sh
```

This will:
- ✅ Check Docker requirements
- ✅ Build optimized Docker images
- ✅ Start all services with health checks
- ✅ Apply database migrations automatically
- ✅ Seed sample data (68+ orders)
- ✅ Verify system is ready

#### **🔧 Manual Setup (Alternative)**
```bash
# 1. Copy environment templates
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# 2. Edit .env files with your settings
# 3. Start all services
docker-compose up --build -d
```

#### **🌐 Access Points:**
- **Customer Frontend**: http://localhost:3000
- **Admin Dashboard**: http://localhost:3002  
- **Backend API**: http://localhost:3001
- **Admin API**: http://localhost:3003
- **pgAdmin**: http://localhost:8081

### 🆕 **Latest Features & Improvements**

#### **Docker Infrastructure Improvements**
1. **Multi-stage Dockerfiles** - Optimized builds for development and production
2. **Health Checks** - All services monitored with automatic health verification
3. **Environment Security** - Proper .env file management and .gitignore protection
4. **Automated Setup** - Complete system deployment with single command
5. **Service Dependencies** - Services start in correct order with proper waiting

#### **Environment & Security**
1. **Secure Environment Management** - All sensitive data protected from version control
2. **Comprehensive .env Structure** - Service-specific environment files
3. **Template System** - .env.example files for easy team setup
4. **Docker Optimization** - .dockerignore files for faster builds

#### **Database & Data Management**
1. **Automatic Migrations** - Database schema applied on startup
2. **Sample Data Seeding** - 68+ historical orders for testing
3. **Health Monitoring** - Database connection verification
4. **Backup Protection** - Database files excluded from version control

### Local Development

1. **Backend:**
   ```bash
   cd backend
   npm install
   npm run start:dev
   ```

2. **Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## 📁 Project Structure

### Frontend (`/frontend`)
```
frontend/
├── pages/                    # Next.js pages (routing)
│   ├── index.js             # Home page with pizza ordering form
│   ├── _app.js              # Next.js app wrapper
│   ├── checkout.js          # Enhanced checkout with Stripe payments
│   ├── contact.js           # Contact page with location information
│   ├── reservations.js      # Table reservation system
│   ├── profile.js           # User profile and address management
│   ├── login.js             # User authentication
│   ├── register.js          # User registration
│   └── order/               # Order tracking and management
├── components/               # React components
│   ├── ReservationSystem.js # Advanced reservation system with CAPTCHA
│   ├── CartSidebar.js       # Shopping cart component
│   ├── MainNav.js           # Navigation component
│   ├── PaymentForm.js       # Stripe payment form
│   ├── AddressModal.js      # Reusable address management modal
│   ├── CAPTCHA.js           # Google reCAPTCHA integration
│   ├── PizzaCustomizationModal.js # Pizza customization interface
│   └── ui/                  # Reusable UI components
├── contexts/                 # React contexts
│   ├── AuthContext.js       # Authentication state management
│   └── CartContext.js       # Shopping cart state management
├── lib/                     # Utility libraries
│   ├── api.js               # API client with all endpoints
│   └── config.js            # Configuration constants
├── styles/                  # Global styles and Tailwind CSS
├── package.json             # Dependencies and scripts
├── next.config.js           # Next.js configuration
└── Dockerfile               # Frontend container setup
```

### Backend (`/backend`)
```
backend/
├── server.js                    # Express app bootstrap with all endpoints
├── entities/                    # Database entities and models
│   ├── BaseEntity.js           # Base entity with common fields
│   ├── Order.js                # Order entity with relationships
│   ├── OrderItem.js            # Order item entity
│   └── Product.js              # Product entity
├── modules/                     # Business logic services and controllers
│   ├── OrderService.js         # Order management with Stripe integration
│   ├── OrderController.js      # Order API endpoints with security
│   ├── ProductService.js       # Product management service
│   ├── ProductController.js    # Product API endpoints
│   ├── TableService.js         # Restaurant table management service
│   ├── StripeService.js        # Stripe payment processing
│   ├── EmailService.js         # Automated email confirmations
│   ├── CAPTCHAService.js       # Google reCAPTCHA and bot detection
│   ├── RateLimitService.js     # Rate limiting and abuse prevention
│   ├── ValidationService.js    # Input validation and sanitization
│   └── TableService.js         # Table reservation management
├── utils/                       # Utility functions and middleware
│   └── errors.js               # Error handling and middleware
├── package.json                 # Dependencies and scripts
├── Dockerfile                   # Backend container setup
├── env.example                  # Environment configuration template
├── EMAIL_SETUP.md              # Email service configuration guide
└── STRIPE_SETUP.md             # Stripe payment setup guide
```

## 🔧 Configuration

### Environment Variables
The application uses the following environment variables (configured in docker-compose.yml and backend/.env):

```env
# Database
POSTGRES_USER=pizza_user
POSTGRES_PASSWORD=pizza_pass
POSTGRES_DB=pizza_db

# Backend
DB_HOST=db
DB_PORT=5432
DB_USER=pizza_user
DB_PASS=pizza_pass
DB_NAME=pizza_db

# Stripe Payment Gateway
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Google reCAPTCHA v3
RECAPTCHA_SECRET_KEY=6L...
RECAPTCHA_SITE_KEY=6L...

# Security Settings
NODE_ENV=development
```

### Database Schema
The system includes comprehensive database tables for:
- **Users & Authentication** - User accounts and profiles
- **Orders & Products** - Pizza ordering system with Stripe integration
- **Addresses** - User address management
- **Restaurant Tables** - Physical table information and capacity
- **Table Reservations** - Reservation tracking with table assignment
- **Table Availability** - Real-time availability tracking
- **Payments** - Stripe payment records and status tracking

### Stripe Payment Configuration
The payment system includes:
- **Test Mode** - Use test keys for development
- **Live Mode** - Production keys for real payments
- **Webhook Handling** - Automatic order status updates
- **Payment Intents** - Secure payment processing
- **Customer Management** - Reusable payment methods

### Email Configuration
The email service supports multiple SMTP providers:
- **Gmail** (Recommended - Free, 500 emails/day)
- **Outlook/Hotmail** (Free, 300 emails/day)
- **Yahoo** (Free, 500 emails/day)
- **Custom SMTP** servers

See `backend/EMAIL_SETUP.md` for detailed configuration instructions.

### Ports & Services
- **3000**: Customer Frontend (Next.js)
- **3001**: Main Backend API (Express.js)
- **3002**: Admin Dashboard (Next.js)
- **3003**: Admin Backend API (Express.js)
- **5432**: Database (PostgreSQL)
- **8081**: pgAdmin (Database Management)

## 🌟 Features

### 🍕 **Pizza Ordering System**
- **Modern Homepage** with video hero and responsive UI
- **Authentication System** (login/register) with profile management
- **Shopping Cart** with real-time updates and persistence
- **Enhanced Checkout Flow** with Stripe payment processing
- **Order Management** with unique order numbers and detailed tracking
- **Address Management** with auto-fill and default address support
- **Pizza Customization** with toppings, sizes, and special requests
- **Guest Orders** - Complete orders without registration

### 💳 **Stripe Payment Integration**
- **Secure Payment Processing** with Stripe Payment Intents
- **Multiple Payment Methods** - Credit cards, digital wallets
- **Test Mode Support** - Development and testing environment
- **Webhook Integration** - Automatic order status updates
- **Customer Management** - Save payment methods for future use
- **PCI Compliance** - Enterprise-grade security standards

### 🍽️ **Restaurant Table Reservation System**
- **Smart Table Management** with real-time availability tracking
- **Intelligent Table Assignment** based on party size and capacity
- **Visual Availability Display** showing available/unavailable time slots
- **Professional Reservation Flow** with step-by-step progress indicator
- **Real-time Validation** preventing double-bookings and conflicts
- **Responsive Design** optimized for mobile and desktop
- **CAPTCHA Protection** - Bot prevention for guest reservations

### 🛡️ **Comprehensive Security System**
- **Google reCAPTCHA v3** - Invisible bot protection
- **Rate Limiting** - IP and user-based abuse prevention
- **Input Validation** - Comprehensive data sanitization
- **Bot Detection** - Advanced threat detection algorithms
- **CAPTCHA Integration** - Required for guest orders and reservations
- **Security Monitoring** - Real-time threat detection and blocking

### 📧 **Automated Email System**
- **Professional Confirmation Emails** sent automatically after orders and reservations
- **Beautiful HTML Templates** with Bella Vista restaurant branding
- **Mobile-Responsive Emails** that look great on all devices
- **Complete Order Details** including payment confirmation and tracking
- **Fallback System** with console logging for development
- **Multiple SMTP Support** (Gmail, Outlook, Yahoo, custom servers)

### 🎨 **Enhanced User Experience**
- **Smooth Animations** and micro-interactions throughout the interface
- **Progress Indicators** showing current step in multi-step processes
- **Visual Feedback** for all user interactions
- **Modern UI Components** with gradients, shadows, and professional styling
- **Responsive Design** that works perfectly on all devices
- **Accessibility Features** with proper ARIA labels and keyboard navigation
- **Address Management** - Professional modal interface for managing addresses

### 🏗️ **Technical Architecture**
- **Modular Backend** with services, controllers, and entities
- **Real-time Database** with proper relationships and constraints
- **Docker Containerization** for easy development and deployment
- **API-First Design** with comprehensive REST endpoints
- **Error Handling** with proper logging and user feedback
- **Security Features** with JWT authentication and comprehensive validation
- **Payment Processing** with Stripe integration and webhook handling

### 🔮 **Advanced Features**
- **Smart Table Assignment** algorithm for optimal space utilization
- **Conflict Prevention** system preventing double-bookings
- **Capacity Management** with real-time table availability
- **Professional Email Templates** with restaurant branding
- **Multi-step Forms** with validation and progress tracking
- **Real-time Updates** for availability and reservation status
- **Guest User Support** - Complete functionality without registration

## 🚀 Deployment

### Production Build
```bash
# Frontend
cd frontend
npm run build
npm start

# Backend
cd backend
npm run build
npm start
```

### Docker Production
```bash
# Use production environment
export NODE_ENV=production
docker-compose up -d

# Or with production-specific compose file
docker-compose -f docker-compose.prod.yml up -d
```

### Stripe Production Setup
1. **Switch to Live Keys** in production environment
2. **Configure Webhooks** for production domain
3. **Set up Monitoring** and alerting
4. **Enable Fraud Detection** and advanced security features

## 🎯 **Advanced Features Deep Dive**

### 💳 **Stripe Payment System**
The payment integration features:
- **Payment Intents** - Secure, asynchronous payment processing
- **Webhook Handling** - Real-time order status updates
- **Customer Management** - Reusable payment methods
- **Test Environment** - Complete testing with Stripe CLI
- **Production Ready** - Easy transition to live payments

### 🛡️ **Security Architecture**
Enterprise-grade security with:
- **Multi-layer Protection** - CAPTCHA, rate limiting, validation
- **Bot Detection** - Advanced algorithms and behavior analysis
- **Input Sanitization** - Comprehensive data cleaning and validation
- **Rate Limiting** - Intelligent abuse prevention with progressive delays
- **CAPTCHA Integration** - Google reCAPTCHA v3 with score-based validation

### 🍽️ **Smart Table Management System**
The reservation system features intelligent table assignment:
- **Real-time Availability Tracking** - Prevents double-bookings
- **Smart Capacity Matching** - Assigns optimal tables based on party size
- **Conflict Prevention** - Automatic validation and error handling
- **Professional UI** - Visual indicators for available/unavailable slots
- **CAPTCHA Protection** - Bot prevention for guest users

### 📧 **Professional Email System**
Automated email confirmations with:
- **Beautiful HTML Templates** - Restaurant-branded emails
- **Complete Order Details** - All information customers need
- **Mobile-Responsive Design** - Perfect on all devices
- **Fallback System** - Console logging for development
- **Payment Confirmations** - Stripe payment receipts

### 🎨 **Enhanced User Experience**
Modern interface with:
- **Smooth Animations** - Professional micro-interactions
- **Progress Indicators** - Clear step-by-step guidance
- **Visual Feedback** - Immediate response to user actions
- **Responsive Design** - Works perfectly on all devices
- **Address Management** - Professional modal interface

## 📝 API Endpoints

### Backend API (http://localhost:3001)

#### 🔐 **Authentication & User Management**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile (auth required)
- `PUT /api/auth/profile` - Update user profile (auth required)
- `DELETE /api/auth/account` - Delete user account (auth required)

#### 🍕 **Order Management**
- `POST /api/orders` - Create new order with Stripe payment
- `GET /api/orders/:orderNumber` - Get order by number
- `GET /api/users/:userId/orders` - List orders for user (auth required)
- `GET /api/orders?email=...` - Get orders by email (guest order lookup)
- `PUT /api/orders/:orderNumber/status` - Update order status
- `PUT /api/orders/:orderNumber/cancel` - Cancel order

#### 💳 **Stripe Payment Processing**
- `POST /api/webhooks/stripe` - Stripe webhook endpoint
- **Payment Intents** - Automatic creation and confirmation
- **Customer Management** - Stripe customer creation and management
- **Webhook Handling** - Real-time payment status updates

#### 🍽️ **Table Reservations**
- `POST /api/reservations` - Create new reservation with CAPTCHA
- `GET /api/reservations/availability/:date` - Get time slot availability
- `GET /api/reservations/tables/:date` - Get detailed table availability
- `GET /api/reservations/user` - Get user reservations (auth required)
- `PUT /api/reservations/:id/cancel` - Cancel reservation (auth required)

#### 🏠 **Address Management**
- `GET /api/users/:userId/addresses` - Get user addresses (auth required)
- `POST /api/users/:userId/addresses` - Create new address (auth required)
- `PUT /api/users/:userId/addresses/:id` - Update address (auth required)
- `DELETE /api/users/:userId/addresses/:id` - Delete address (auth required)

#### 🛡️ **Security & Validation**
- **CAPTCHA Verification** - Required for guest orders and reservations
- **Rate Limiting** - Automatic abuse prevention
- **Input Validation** - Comprehensive data sanitization
- **Bot Detection** - Advanced threat detection

#### 🧪 **Testing & Health**
- `GET /` - Welcome message
- `GET /health` - Health check endpoint
- `GET /api/test-email` - Test email service configuration

## 🆘 Troubleshooting

### Common Issues
1. **Port conflicts**: Ensure ports 3000, 3001, and 5432 are available
2. **Docker issues**: Run `docker-compose down -v` to clean up
3. **Build failures**: Check logs with `docker-compose logs [service-name]`
4. **Stripe issues**: Verify API keys and webhook configuration
5. **CAPTCHA errors**: Check reCAPTCHA site and secret keys

### Development Tips
- **Use automated setup**: `./setup.sh` for complete environment setup
- **Monitor services**: `docker-compose ps` to check service health
- **View logs**: `docker-compose logs -f [service]` for real-time debugging
- **Hot reload enabled**: Frontend and backend auto-restart on changes
- **Health checks**: All services include automatic health monitoring
- **Environment templates**: Use .env.example files for team setup

### Stripe Testing
```bash
# Install Stripe CLI
stripe listen --forward-to localhost:3001/api/webhooks/stripe

# Test card numbers
4242 4242 4242 4242 - Successful payment
4000 0000 0000 0002 - Declined payment
4000 0000 0000 9995 - Insufficient funds
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with `docker-compose up --build`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🗺️ **System Status & Roadmap**

### ✅ **Completed Features**
- **Pizza Ordering System** - Full ordering flow with cart and checkout
- **User Authentication** - Registration, login, and profile management
- **Address Management** - Save, edit, and manage delivery addresses
- **Table Reservation System** - Professional booking with smart table assignment
- **Email Confirmations** - Automated professional email system
- **Enhanced UI/UX** - Modern design with animations and progress indicators
- **Real-time Validation** - Conflict prevention and availability tracking
- **Stripe Payment Integration** - Complete payment processing system
- **Comprehensive Security** - CAPTCHA, rate limiting, and bot detection
- **Guest User Support** - Complete functionality without registration
- **Advanced Checkout** - Professional address management and payment flow
- **Docker Infrastructure** - Complete containerization with health checks
- **Environment Security** - Secure .env management and automated setup
- **Data Seeding** - Comprehensive sample data for testing
- **Admin Dashboard** - Complete restaurant management interface
- **Comprehensive Testing** - 339 tests across all components
- **Video Background System** - YouTube integration with fallback support

### 🚧 **In Development**
- **Performance Optimization** - Database queries and API response improvements

### 🔮 **Future Roadmap**
- **Kitchen Display System** - Real-time order streaming with dedicated interface
- **Inventory Management** - Stock tracking and alerts
- **Customer Analytics** - Reservation and order insights
- **Mobile App** - Native iOS/Android applications
- **Multi-location Support** - Chain restaurant management
- **Advanced Reporting** - Business intelligence and analytics

## 📚 **Additional Documentation**

- **`DOCKER_SETUP.md`** - Complete Docker setup and troubleshooting guide
- **`ENVIRONMENT_SETUP.md`** - Environment variables configuration guide
- **`backend/EMAIL_SETUP.md`** - Complete email service configuration guide
- **`backend/STRIPE_SETUP.md`** - Stripe payment setup and configuration
- **`.env.example`** - Environment variables template
- **`database/init.sql`** - Database schema and sample data
- **`PROJECT_ROADMAP.md`** - Comprehensive project roadmap and security features
- **`SECURITY.md`** - Security implementation details
- **`RESERVATION_SYSTEM_DOCUMENTATION.md`** - Complete reservation system guide
- **`RESTAURANT_CONFIGURATION_GUIDE.md`** - Restaurant settings configuration

---

**Note**: This is a development setup. For production deployment, additional security measures and environment-specific configurations are required.

**Current Version**: 3.1.0 - Enhanced with Docker optimization, environment security, and automated setup 