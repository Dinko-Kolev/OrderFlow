# OrderFlow - Pizza Ordering & Restaurant Management System

A comprehensive full-stack restaurant management system built with Next.js frontend, Express.js backend, and PostgreSQL database, orchestrated with Docker Compose. Features include pizza ordering, table reservations, real-time table management, and automated email confirmations.

## 🏗️ Architecture

```
project-root/
├── frontend/          # Next.js React application
├── backend/           # NestJS API server
└── docker-compose.yml # Multi-container orchestration
```

### Tech Stack
- **Frontend**: Next.js, React 18
- **Backend**: Express.js (modular services/controllers architecture)
- **Database**: PostgreSQL 15
- **Containerization**: Docker & Docker Compose
- **Development**: Hot reload enabled for both frontend and backend

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Node.js 18+ (for local development)
- Git

### Running with Docker (Recommended)

1. **Navigate to project:**
   ```bash
   cd project-root
   ```

2. **Start all services:**
   ```bash
   docker-compose up --build
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - Database: localhost:5432

### 🆕 **New Features Quick Start**

#### **Table Reservations**
1. Go to `/reservations` page
2. Select date and number of guests
3. Choose available time slot
4. Fill in contact details
5. Receive confirmation email

#### **Email System Setup**
1. Copy `backend/env.example` to `backend/.env`
2. Configure SMTP settings (Gmail recommended)
3. Restart backend server
4. Test with `/api/test-email` endpoint

#### **Enhanced Checkout**
1. Add items to cart
2. Go to checkout page
3. Use saved addresses or create new ones
4. Complete order with delivery/pickup options

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
│   ├── checkout.js          # Enhanced checkout with address management
│   ├── contact.js           # Contact page with location information
│   ├── reservations.js      # Table reservation system
│   ├── profile.js           # User profile and address management
│   └── order/               # Order tracking and management
├── components/               # React components
│   ├── ReservationSystem.js # Advanced reservation system with animations
│   ├── CartSidebar.js       # Shopping cart component
│   ├── MainNav.js           # Navigation component
│   └── ui/                  # Reusable UI components
├── contexts/                 # React contexts
│   ├── AuthContext.js       # Authentication state management
│   └── CartContext.js       # Shopping cart state management
├── lib/                     # Utility libraries
│   ├── api.js               # API client with all endpoints
│   └── config.js            # Configuration constants
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
│   ├── OrderService.js         # Order management service
│   ├── OrderController.js      # Order API endpoints
│   ├── ProductService.js       # Product management service
│   ├── ProductController.js    # Product API endpoints
│   └── TableService.js         # Restaurant table management service
├── utils/                       # Utility functions and middleware
│   └── errors.js               # Error handling and middleware
├── package.json                 # Dependencies and scripts
├── Dockerfile                   # Backend container setup
├── env.example                  # Environment configuration template
└── EMAIL_SETUP.md              # Email service configuration guide
```

## 🔧 Configuration

### Environment Variables
The application uses the following environment variables (configured in docker-compose.yml):

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

# Email Service (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Database Schema
The system includes comprehensive database tables for:
- **Users & Authentication** - User accounts and profiles
- **Orders & Products** - Pizza ordering system
- **Addresses** - User address management
- **Restaurant Tables** - Physical table information and capacity
- **Table Reservations** - Reservation tracking with table assignment
- **Table Availability** - Real-time availability tracking

### Email Configuration
The email service supports multiple SMTP providers:
- **Gmail** (Recommended - Free, 500 emails/day)
- **Outlook/Hotmail** (Free, 300 emails/day)
- **Yahoo** (Free, 500 emails/day)
- **Custom SMTP** servers

See `backend/EMAIL_SETUP.md` for detailed configuration instructions.

### Ports
- **3000**: Frontend (Next.js)
- **3001**: Backend (Express.js)
- **5432**: Database (PostgreSQL)

## 🌟 Features

### 🍕 **Pizza Ordering System**
- **Modern Homepage** with video hero and responsive UI
- **Authentication System** (login/register) with profile management
- **Shopping Cart** with real-time updates and persistence
- **Checkout Flow** supporting delivery/pickup with payment selection
- **Order Management** with unique order numbers and detailed tracking
- **Address Management** with auto-fill and default address support
- **Pizza Customization** with toppings, sizes, and special requests

### 🍽️ **Restaurant Table Reservation System**
- **Smart Table Management** with real-time availability tracking
- **Intelligent Table Assignment** based on party size and capacity
- **Visual Availability Display** showing available/unavailable time slots
- **Professional Reservation Flow** with step-by-step progress indicator
- **Real-time Validation** preventing double-bookings and conflicts
- **Responsive Design** optimized for mobile and desktop

### 📧 **Automated Email System**
- **Professional Confirmation Emails** sent automatically after reservations
- **Beautiful HTML Templates** with Bella Vista restaurant branding
- **Mobile-Responsive Emails** that look great on all devices
- **Complete Reservation Details** including table information and policies
- **Fallback System** with console logging for development
- **Multiple SMTP Support** (Gmail, Outlook, Yahoo, custom servers)

### 🎨 **Enhanced User Experience**
- **Smooth Animations** and micro-interactions throughout the interface
- **Progress Indicators** showing current step in multi-step processes
- **Visual Feedback** for all user interactions
- **Modern UI Components** with gradients, shadows, and professional styling
- **Responsive Design** that works perfectly on all devices
- **Accessibility Features** with proper ARIA labels and keyboard navigation

### 🏗️ **Technical Architecture**
- **Modular Backend** with services, controllers, and entities
- **Real-time Database** with proper relationships and constraints
- **Docker Containerization** for easy development and deployment
- **API-First Design** with comprehensive REST endpoints
- **Error Handling** with proper logging and user feedback
- **Security Features** with JWT authentication and input validation

### 🔮 **Advanced Features**
- **Smart Table Assignment** algorithm for optimal space utilization
- **Conflict Prevention** system preventing double-bookings
- **Capacity Management** with real-time table availability
- **Professional Email Templates** with restaurant branding
- **Multi-step Forms** with validation and progress tracking
- **Real-time Updates** for availability and reservation status

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
docker-compose -f docker-compose.prod.yml up -d
```

## 🎯 **Advanced Features Deep Dive**

### 🍽️ **Smart Table Management System**
The reservation system features intelligent table assignment:
- **Real-time Availability Tracking** - Prevents double-bookings
- **Smart Capacity Matching** - Assigns optimal tables based on party size
- **Conflict Prevention** - Automatic validation and error handling
- **Professional UI** - Visual indicators for available/unavailable slots

### 📧 **Professional Email System**
Automated email confirmations with:
- **Beautiful HTML Templates** - Restaurant-branded emails
- **Complete Reservation Details** - All information customers need
- **Mobile-Responsive Design** - Perfect on all devices
- **Fallback System** - Console logging for development

### 🎨 **Enhanced User Experience**
Modern interface with:
- **Smooth Animations** - Professional micro-interactions
- **Progress Indicators** - Clear step-by-step guidance
- **Visual Feedback** - Immediate response to user actions
- **Responsive Design** - Works perfectly on all devices

### 🔒 **Security & Validation**
Enterprise-grade security features:
- **JWT Authentication** - Secure user sessions
- **Input Validation** - Prevents malicious data
- **Error Handling** - Graceful error management
- **Data Sanitization** - Protects against injection attacks

## 📝 API Endpoints

### Backend API (http://localhost:3001)

#### 🔐 **Authentication & User Management**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile (auth required)
- `PUT /api/auth/profile` - Update user profile (auth required)

#### 🍕 **Order Management**
- `POST /api/orders` - Create new order
- `GET /api/orders/:orderNumber` - Get order by number
- `GET /api/users/:userId/orders` - List orders for user (auth required)
- `PUT /api/orders/:orderNumber/status` - Update order status
- `PUT /api/orders/:orderNumber/cancel` - Cancel order

#### 🍽️ **Table Reservations**
- `POST /api/reservations` - Create new reservation
- `GET /api/reservations/availability/:date` - Get time slot availability
- `GET /api/reservations/tables/:date` - Get detailed table availability
- `GET /api/reservations/user` - Get user reservations (auth required)
- `PUT /api/reservations/:id/cancel` - Cancel reservation (auth required)

#### 🏠 **Address Management**
- `GET /api/users/:userId/addresses` - Get user addresses (auth required)
- `POST /api/users/:userId/addresses` - Create new address (auth required)
- `PUT /api/users/:userId/addresses/:id` - Update address (auth required)
- `DELETE /api/users/:userId/addresses/:id` - Delete address (auth required)

#### 🧪 **Testing & Health**
- `GET /` - Welcome message
- `GET /health` - Health check endpoint
- `GET /api/test-email` - Test email service configuration

## 🆘 Troubleshooting

### Common Issues
1. **Port conflicts**: Ensure ports 3000, 3001, and 5432 are available
2. **Docker issues**: Run `docker-compose down -v` to clean up
3. **Build failures**: Check logs with `docker-compose logs [service-name]`

### Development Tips
- Use `docker-compose logs -f` to watch real-time logs
- Frontend auto-reloads on file changes
- Backend restarts automatically with ts-node

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

### 🚧 **In Development**
- **Order Tracking** - Real-time order status updates
- **Payment Integration** - Secure payment processing
- **Admin Dashboard** - Restaurant management interface

### 🔮 **Future Roadmap**
- **Kitchen Display System** - Real-time order streaming
- **Inventory Management** - Stock tracking and alerts
- **Customer Analytics** - Reservation and order insights
- **Mobile App** - Native iOS/Android applications
- **Multi-location Support** - Chain restaurant management
- **Advanced Reporting** - Business intelligence and analytics

## 📚 **Additional Documentation**

- **`backend/EMAIL_SETUP.md`** - Complete email service configuration guide
- **`backend/env.example`** - Environment variables template
- **`database/init.sql`** - Database schema and sample data

---

**Note**: This is a development setup. For production deployment, additional security measures and environment-specific configurations are required.

**Current Version**: 2.0.0 - Enhanced with table reservations, email system, and modern UI 