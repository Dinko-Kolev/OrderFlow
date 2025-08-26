# 🔐 Environment Variables Setup Guide

This guide explains how to configure environment variables for the OrderFlow Pizza Restaurant system with the new secure Docker setup.

## 📁 Environment File Structure

```
OrderFlow/
├── .env                          # Main environment variables for Docker Compose
├── .env.example                  # Template for main environment variables
├── backend/
│   ├── .env                      # Backend-specific variables
│   └── .env.example              # Backend template
├── frontend/
│   ├── .env.local                # Frontend-specific variables
│   └── .env.example              # Frontend template
├── admin-backend/
│   ├── .env                      # Admin backend variables
│   └── .env.example              # Admin backend template
├── admin-dashboard/
│   ├── .env.local                # Admin dashboard variables
│   └── .env.example              # Admin dashboard template
├── .dockerignore                 # Docker build optimization
└── .gitignore                    # Security - protects .env files
```

## 🚀 Quick Setup

### 1. Automated Setup (Recommended)

```bash
# Use the automated setup script
./setup.sh

# This will:
# - Check system requirements
# - Set up environment files
# - Start all services with Docker Compose
# - Apply database migrations
# - Seed sample data
```

### 2. Manual Setup

```bash
# Copy main environment template
cp .env.example .env

# Copy service-specific templates
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
cp admin-backend/.env.example admin-backend/.env
cp admin-dashboard/.env.example admin-dashboard/.env.local

# Start with Docker Compose
docker-compose up --build -d
```

### 2. Configure Your Values

Edit each `.env` file with your actual configuration values:

#### Required Configuration:
- **Database passwords** (replace `your_secure_database_password`)
- **JWT Secret** (generate with `openssl rand -base64 32`)
- **Email credentials** (SMTP configuration)
- **Stripe keys** (get from Stripe Dashboard)
- **reCAPTCHA keys** (get from Google reCAPTCHA)

#### Optional Configuration:
- **Google Maps API key** (for map functionality)
- **Google Analytics ID** (for analytics)

## 🔧 Configuration Details

### Database Configuration
```env
DB_HOST=db                    # Docker service name
DB_PORT=5432                  # PostgreSQL port
DB_USER=pizza_user           # Database username
DB_PASS=your_password        # Database password
DB_NAME=pizza_db             # Database name
```

### Security Configuration
```env
JWT_SECRET=your_jwt_secret   # Generate with: openssl rand -base64 32
```

### Email Configuration
```env
SMTP_HOST=your_smtp_host     # SMTP server hostname
SMTP_PORT=587                # SMTP port (587 for TLS, 465 for SSL)
SMTP_SECURE=false           # true for SSL, false for TLS
SMTP_USER=your_email         # Email username
SMTP_PASS=your_password      # Email password
```

### Stripe Configuration
```env
# Get from https://dashboard.stripe.com/
STRIPE_PUBLISHABLE_KEY=pk_test_...    # Frontend safe
STRIPE_SECRET_KEY=sk_test_...         # Backend only
STRIPE_WEBHOOK_SECRET=whsec_...       # Webhook endpoint
```

### reCAPTCHA Configuration
```env
# Get from https://www.google.com/recaptcha/
RECAPTCHA_SITE_KEY=your_site_key       # Frontend safe
RECAPTCHA_SECRET_KEY=your_secret_key   # Backend only
```

## 🌍 Environment-Specific Setup

### Development Environment
- Use test API keys (Stripe, reCAPTCHA)
- Enable debug modes
- Use local SMTP or services like Mailtrap

### Production Environment
- Use live API keys
- Disable debug modes
- Use production SMTP servers
- Enable security headers

## 🔒 Security Best Practices

### 1. Never Commit Secrets
```bash
# Ensure .env files are in .gitignore
echo ".env*" >> .gitignore
echo "!.env.example" >> .gitignore
```

### 2. Use Strong Passwords
```bash
# Generate secure JWT secret
openssl rand -base64 32

# Generate secure database password
openssl rand -base64 16
```

### 3. Environment Isolation
- Use different API keys per environment
- Separate database credentials
- Different SMTP configurations

### 4. Regular Rotation
- Rotate JWT secrets regularly
- Update API keys periodically
- Change database passwords on schedule

## 🐳 Docker Compose Integration

The main `.env` file is automatically loaded by Docker Compose. Our improved setup includes:

```yaml
# docker-compose.yml uses variables from .env
services:
  backend:
    environment:
      DB_HOST: ${DB_HOST}
      DB_USER: ${DB_USER}
      DB_PASS: ${DB_PASS}
      JWT_SECRET: ${JWT_SECRET}
      STRIPE_SECRET_KEY: ${STRIPE_SECRET_KEY}
      # All environment variables are properly referenced
```

### New Features in Docker Setup:
- ✅ **Multi-stage Dockerfiles** - Optimized for development and production
- ✅ **Health checks** - All services include health monitoring
- ✅ **Automatic migrations** - Database schema applied on startup
- ✅ **Data seeding** - Sample data loaded automatically
- ✅ **Service dependencies** - Services start in correct order

## 📊 Service-Specific Variables

### Backend Service (.env)
- Database connection
- JWT secrets
- Email configuration
- Payment processing
- Rate limiting

### Frontend Service (.env.local)
- API endpoints
- Public keys (Stripe, reCAPTCHA)
- Google services
- Debug settings

### Admin Backend (.env)
- Database connection
- Admin-specific settings
- CORS configuration

### Admin Dashboard (.env.local)
- Admin API endpoint
- Debug settings
- Port configuration

## 🧪 Testing Configuration

### Test Environment Variables
```env
NODE_ENV=test
DB_NAME=pizza_db_test
STRIPE_SECRET_KEY=sk_test_...
RECAPTCHA_SECRET_KEY=test_key
```

### Running Tests
```bash
# Set test environment
export NODE_ENV=test

# Run tests
npm test
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Missing Environment Variables
**Error**: "Environment variable not defined"
**Solution**: Check `.env` files exist and contain required variables

#### 2. Wrong API Keys
**Error**: "Invalid API key"
**Solution**: Verify keys are correct and not mixed up between test/live

#### 3. Database Connection Failed
**Error**: "Connection refused"
**Solution**: Check database credentials and host configuration

#### 4. CORS Errors
**Error**: "CORS policy blocked"
**Solution**: Verify frontend URLs in backend CORS configuration

### Debug Commands

```bash
# Check environment variables are loaded
docker-compose exec backend env | grep DB_

# Test database connection
docker-compose exec backend npm run db:test

# Verify API endpoints
curl http://localhost:3001/health
curl http://localhost:3003/health
```

## 📝 Environment Variables Reference

### Complete Variable List

| Variable | Service | Required | Description |
|----------|---------|----------|-------------|
| `DB_HOST` | Backend/Admin | ✅ | Database host |
| `DB_USER` | Backend/Admin | ✅ | Database username |
| `DB_PASS` | Backend/Admin | ✅ | Database password |
| `JWT_SECRET` | Backend | ✅ | JWT signing secret |
| `SMTP_HOST` | Backend | ✅ | Email server host |
| `SMTP_USER` | Backend | ✅ | Email username |
| `SMTP_PASS` | Backend | ✅ | Email password |
| `STRIPE_SECRET_KEY` | Backend | ✅ | Stripe secret key |
| `STRIPE_PUBLISHABLE_KEY` | Frontend | ✅ | Stripe public key |
| `RECAPTCHA_SITE_KEY` | Frontend | ✅ | reCAPTCHA site key |
| `RECAPTCHA_SECRET_KEY` | Backend | ✅ | reCAPTCHA secret |
| `GOOGLE_MAPS_API_KEY` | Frontend | ❌ | Google Maps API |
| `GOOGLE_ANALYTICS_ID` | Frontend | ❌ | Analytics tracking |

## 🛠️ Setup Automation

For automated setup, use the provided script:

```bash
# Run complete setup including environment configuration
./setup.sh

# The script will:
# 1. Check Docker and Docker Compose requirements
# 2. Clean up existing containers
# 3. Build all Docker images with optimized multi-stage builds
# 4. Start database and wait for readiness
# 5. Apply all database migrations automatically
# 6. Start all services with proper health checks
# 7. Seed comprehensive sample data (68+ orders)
# 8. Verify all services are healthy and ready

# Optional: Seed additional data
docker-compose --profile seed-data up data-init
```

### Advanced Setup Options

```bash
# Just build without starting
docker-compose build

# Start specific services
docker-compose up -d db backend

# View service logs
docker-compose logs -f [service]

# Check service health
docker-compose ps
```

## 📞 Support

If you encounter issues with environment setup:

1. Check this documentation
2. Verify all required variables are set
3. Test with example values first
4. Check service logs for specific errors

```bash
# View service logs
docker-compose logs backend
docker-compose logs frontend
```
