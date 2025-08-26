# 🍕 OrderFlow - Docker Setup Guide

Complete guide for setting up the OrderFlow Pizza Restaurant system using Docker.

## 📋 Prerequisites

- **Docker** (version 20.0 or higher)
- **Docker Compose** (version 2.0 or higher)
- **Git** (to clone the repository)
- At least **4GB RAM** available for Docker
- **10GB** free disk space

## 🚀 Quick Start (Recommended)

### Option 1: Automated Setup Script

```bash
# Make setup script executable and run
chmod +x setup.sh
./setup.sh
```

The setup script will:
- ✅ Check system requirements
- ✅ Clean up any existing containers
- ✅ Build all Docker images
- ✅ Start services in correct order
- ✅ Apply database migrations
- ✅ Seed sample data (71 historical orders)
- ✅ Verify all services are healthy

### Option 2: Manual Setup

```bash
# Clean up any existing setup
docker-compose down --volumes --remove-orphans

# Build and start all services
docker-compose up --build -d

# Wait for services to be ready (30-60 seconds)
docker-compose ps

# Seed sample data (optional)
docker-compose --profile seed-data up data-init
```

## 🛠️ System Architecture

The Docker setup includes:

### Core Services:
- **`db`** - PostgreSQL 15 database
- **`backend`** - Main Node.js API server (port 3001)
- **`frontend`** - Next.js customer application (port 3000)
- **`admin-backend`** - Admin API server (port 3003)
- **`admin-dashboard`** - Next.js admin interface (port 3002)
- **`pgadmin`** - Database management tool (port 8081)

### Utility Services:
- **`data-init`** - One-time data seeding service

## 🔗 Service URLs

| Service | URL | Description |
|---------|-----|-------------|
| Customer Frontend | http://localhost:3000 | Main pizza ordering website |
| Admin Dashboard | http://localhost:3002 | Restaurant management interface |
| Backend API | http://localhost:3001 | Main API endpoints |
| Admin API | http://localhost:3003 | Admin-specific API endpoints |
| pgAdmin | http://localhost:8081 | Database management |

### pgAdmin Access:
- **Email:** admin@pizza.com
- **Password:** admin123

## 📁 Database Schema

The system automatically creates:

### Core Tables:
- `users` - Customer accounts
- `products` - Menu items
- `categories` - Menu categories
- `orders` - Customer orders
- `order_items` - Order line items
- `addresses` - Customer delivery addresses

### Reservation System:
- `restaurant_tables` - Table management
- `table_reservations` - Reservation bookings
- `restaurant_config` - Restaurant settings
- `working_hours` - Operating hours
- `reservation_policies` - Booking rules

### Sample Data Included:
- ✅ **20 Products** (pizzas, drinks, appetizers)
- ✅ **5 Customers** with realistic Italian names
- ✅ **71 Historical Orders** spanning 6 months
- ✅ **176 Order Items** with varied quantities
- ✅ **Complete Restaurant Configuration**

## 🏗️ Docker Configuration Details

### Multi-Stage Dockerfiles
All services use optimized multi-stage builds:
- **Base stage:** System dependencies
- **Development stage:** Full dev dependencies + hot reload
- **Production stage:** Optimized for deployment

### Health Checks
All services include health checks:
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:PORT/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

### Service Dependencies
Services start in correct order:
```
db → backend/admin-backend → frontend/admin-dashboard
```

### Volume Management
- **Database:** Persistent PostgreSQL data
- **Node Modules:** Cached for faster rebuilds
- **Source Code:** Live-mounted for development

## 🛠️ Development Commands

### Basic Operations
```bash
# View all services status
docker-compose ps

# View logs for all services
docker-compose logs -f

# View logs for specific service
docker-compose logs -f backend

# Restart a service
docker-compose restart backend

# Rebuild a service
docker-compose up --build backend

# Stop all services
docker-compose down

# Stop and remove volumes (full reset)
docker-compose down --volumes
```

### Database Operations
```bash
# Connect to database
docker-compose exec db psql -U pizza_user -d pizza_db

# Run SQL file
docker-compose exec -T db psql -U pizza_user -d pizza_db < database/your-file.sql

# Backup database
docker-compose exec db pg_dump -U pizza_user pizza_db > backup.sql

# View database logs
docker-compose logs db
```

### Application Operations
```bash
# Run admin backend scripts
docker-compose exec admin-backend node scripts/add-historical-orders.js

# Install new NPM packages
docker-compose exec backend npm install package-name

# Run tests (if available)
docker-compose exec backend npm test
```

## 🔧 Environment Configuration

### Key Environment Variables:

#### Database:
- `DB_HOST=db`
- `DB_USER=pizza_user`
- `DB_PASS=pizza_pass`
- `DB_NAME=pizza_db`

#### Frontend URLs:
- `NEXT_PUBLIC_API_URL=http://localhost:3001`
- `NEXT_PUBLIC_ADMIN_API_URL=http://localhost:3003/api/admin`

#### Email (Backend):
- `SMTP_HOST=your_smtp_host`
- `SMTP_USER=your_email@example.com`

### Customization:
Create `.env` files in each service directory to override defaults.

## 🐛 Troubleshooting

### Common Issues:

#### Services Won't Start:
```bash
# Check Docker daemon is running
docker ps

# Check for port conflicts
lsof -i :3000
lsof -i :3001
lsof -i :3002
lsof -i :3003

# Full system reset
docker-compose down --volumes --remove-orphans
docker system prune -a
./setup.sh
```

#### Database Connection Issues:
```bash
# Check database health
docker-compose exec db pg_isready -U pizza_user -d pizza_db

# View database logs
docker-compose logs db

# Reset database
docker-compose down
docker volume rm orderflow_pgdata
docker-compose up -d db
```

#### Build Issues:
```bash
# Clear Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache

# Check disk space
docker system df
```

#### Health Check Failures:
```bash
# Check service logs
docker-compose logs [service-name]

# Manual health check
docker-compose exec backend curl -f http://localhost:3001/health

# Restart problematic service
docker-compose restart [service-name]
```

## 🔄 Updates and Maintenance

### Updating the System:
```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose up --build -d

# Apply any new migrations
docker-compose exec admin-backend node scripts/migrate.js
```

### Performance Optimization:
```bash
# Remove unused images
docker image prune

# Remove unused volumes
docker volume prune

# Monitor resource usage
docker stats
```

## 🧪 Testing the Setup

### Verify All Services:
1. **Database:** http://localhost:8081 (pgAdmin login)
2. **Backend API:** http://localhost:3001/health
3. **Admin API:** http://localhost:3003/health
4. **Frontend:** http://localhost:3000
5. **Admin Dashboard:** http://localhost:3002

### Test Key Features:
- ✅ Browse menu items
- ✅ Add items to cart
- ✅ Create reservations
- ✅ View admin dashboard
- ✅ Check order analytics
- ✅ Manage restaurant settings

## 📞 Support

If you encounter issues:
1. Check this troubleshooting guide
2. Review service logs: `docker-compose logs [service]`
3. Ensure system requirements are met
4. Try a full reset with the setup script

## 🎯 Production Deployment

For production use:
1. Update environment variables
2. Use production Docker targets
3. Configure proper SSL/TLS
4. Set up monitoring and backups
5. Review security settings

```bash
# Production build example
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```
