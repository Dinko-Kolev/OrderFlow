# 🚀 OrderFlow - Production Deployment Guide

Complete guide for deploying the OrderFlow Pizza Restaurant system to production environments.

## 📋 Prerequisites

- **VPS/Cloud Server** (Ubuntu 20.04+ recommended)
- **Docker** and **Docker Compose** installed
- **Domain name** (optional but recommended)
- **SSL Certificate** (Let's Encrypt recommended)
- **Stripe Account** with production keys
- **Email Service** (SendGrid, Mailgun, or similar)

## 🏗️ Architecture Overview

```
Production Environment:
├── frontend/           # Customer interface (Port 3000)
├── backend/            # Main API server (Port 3001)
├── admin-dashboard/    # Admin interface (Port 3002)
├── admin-backend/      # Admin API server (Port 3003)
├── kitchen-display/    # Kitchen interface (Port 3004) - Planned
├── database/           # PostgreSQL (Port 5432)
├── nginx/              # Reverse proxy (Port 80/443)
└── ssl/                # SSL certificates
```

## 🚀 Deployment Options

### Option 1: VPS Deployment (Recommended)

#### 1. Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add user to docker group
sudo usermod -aG docker $USER
```

#### 2. Clone and Configure
```bash
# Clone repository
git clone https://github.com/your-username/OrderFlow.git
cd OrderFlow

# Copy environment files
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
cp admin-backend/.env.example admin-backend/.env
cp admin-dashboard/.env.example admin-dashboard/.env.local

# Configure production environment variables
nano .env
```

#### 3. Production Environment Variables
```bash
# .env (Main Docker Compose)
NODE_ENV=production
DOMAIN=your-restaurant.com
SSL_EMAIL=admin@your-restaurant.com

# backend/.env
NODE_ENV=production
DATABASE_URL=postgresql://user:password@database:5432/orderflow
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
EMAIL_SERVICE_API_KEY=your_email_api_key

# frontend/.env.local
NEXT_PUBLIC_API_URL=https://your-restaurant.com/api
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# admin-backend/.env
NODE_ENV=production
DATABASE_URL=postgresql://user:password@database:5432/orderflow
JWT_SECRET=your-super-secure-jwt-secret

# admin-dashboard/.env.local
NEXT_PUBLIC_API_URL=https://your-restaurant.com/admin-api
```

#### 4. Deploy with Docker
```bash
# Build and start all services
docker-compose up -d --build

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

### Option 2: Cloud Platform Deployment

#### AWS/GCP/Azure
- Use container services (ECS, Cloud Run, Container Instances)
- Configure load balancers and auto-scaling
- Set up managed databases (RDS, Cloud SQL, Azure Database)
- Configure CDN for static assets

#### Heroku
```bash
# Install Heroku CLI
# Create Heroku apps for each service
heroku create orderflow-frontend
heroku create orderflow-backend
heroku create orderflow-admin

# Deploy each service
git subtree push --prefix=frontend heroku main
git subtree push --prefix=backend heroku main
git subtree push --prefix=admin-dashboard heroku main
```

## 🔒 Security Configuration

### 1. SSL/TLS Setup
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Generate SSL certificate
sudo certbot --nginx -d your-restaurant.com -d www.your-restaurant.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 2. Firewall Configuration
```bash
# Configure UFW
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### 3. Database Security
```bash
# Change default passwords
# Enable SSL connections
# Configure backup strategy
# Set up monitoring
```

## 📊 Monitoring & Maintenance

### 1. Health Checks
```bash
# Check service health
curl https://your-restaurant.com/api/health
curl https://your-restaurant.com/admin-api/health

# Monitor logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 2. Backup Strategy
```bash
# Database backup
docker-compose exec database pg_dump -U user orderflow > backup_$(date +%Y%m%d).sql

# Automated backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec -T database pg_dump -U user orderflow > /backups/orderflow_$DATE.sql
find /backups -name "*.sql" -mtime +7 -delete
```

### 3. Performance Monitoring
- Set up monitoring tools (Prometheus, Grafana)
- Configure alerts for high CPU/memory usage
- Monitor database performance
- Track API response times

## 🔄 Updates & Maintenance

### 1. Application Updates
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart services
docker-compose down
docker-compose up -d --build

# Run database migrations
docker-compose exec backend npm run migrate
```

### 2. Database Maintenance
```bash
# Vacuum database
docker-compose exec database psql -U user -d orderflow -c "VACUUM ANALYZE;"

# Check database size
docker-compose exec database psql -U user -d orderflow -c "SELECT pg_size_pretty(pg_database_size('orderflow'));"
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Services Not Starting
```bash
# Check logs
docker-compose logs service-name

# Check resource usage
docker stats

# Restart specific service
docker-compose restart service-name
```

#### 2. Database Connection Issues
```bash
# Check database status
docker-compose exec database pg_isready -U user

# Test connection
docker-compose exec backend npm run test:db
```

#### 3. SSL Certificate Issues
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate
sudo certbot renew --dry-run
```

## 📈 Scaling Considerations

### 1. Horizontal Scaling
- Use load balancers for multiple backend instances
- Implement database read replicas
- Use CDN for static assets
- Consider microservices architecture

### 2. Performance Optimization
- Enable Redis caching
- Optimize database queries
- Implement API rate limiting
- Use connection pooling

## 🎯 Production Checklist

### Pre-Deployment
- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] Database backups configured
- [ ] Monitoring tools set up
- [ ] Security measures implemented
- [ ] Performance testing completed

### Post-Deployment
- [ ] All services running
- [ ] Health checks passing
- [ ] SSL working correctly
- [ ] Email notifications working
- [ ] Payment processing tested
- [ ] Admin dashboard accessible
- [ ] Mobile responsiveness verified

## 📞 Support

For deployment issues:
1. Check the logs: `docker-compose logs -f`
2. Verify environment variables
3. Test individual services
4. Check network connectivity
5. Review security configurations

## 🔗 Additional Resources

- [Docker Setup Guide](./DOCKER_SETUP.md)
- [Environment Setup Guide](./ENVIRONMENT_SETUP.md)
- [Security Guide](./SECURITY.md)
- [Testing Guide](./TEST_SUMMARY.md)

---

**Last Updated**: January 2025
**Version**: 1.0.0 - Production Ready