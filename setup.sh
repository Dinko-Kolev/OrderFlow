#!/bin/bash

# OrderFlow Pizza Restaurant - Complete Setup Script
# This script sets up the entire OrderFlow system from scratch

set -e  # Exit on any error

echo "🍕 OrderFlow Pizza Restaurant - Complete Setup"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Docker and Docker Compose are installed
check_requirements() {
    print_info "Checking system requirements..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_status "Docker and Docker Compose are available"
}

# Clean up any existing containers
cleanup_existing() {
    print_info "Cleaning up existing containers..."
    docker-compose down --volumes --remove-orphans 2>/dev/null || true
    print_status "Cleanup completed"
}

# Build and start services
start_services() {
    print_info "Building and starting services..."
    print_warning "This may take several minutes on first run..."
    
    # Build all services
    docker-compose build --no-cache
    
    # Start database first and wait for it to be ready
    print_info "Starting database..."
    docker-compose up -d db
    
    # Wait for database to be ready
    print_info "Waiting for database to be ready..."
    sleep 10
    
    # Check database health
    max_attempts=30
    attempt=1
    while [ $attempt -le $max_attempts ]; do
        if docker-compose exec -T db pg_isready -U pizza_user -d pizza_db >/dev/null 2>&1; then
            print_status "Database is ready!"
            break
        fi
        print_info "Waiting for database... (attempt $attempt/$max_attempts)"
        sleep 2
        attempt=$((attempt + 1))
    done
    
    if [ $attempt -gt $max_attempts ]; then
        print_error "Database failed to start within expected time"
        exit 1
    fi
    
    # Start all other services
    print_info "Starting all services..."
    docker-compose up -d
    
    print_status "All services started"
}

# Seed data
seed_data() {
    print_info "Seeding database with sample data..."
    
    # Wait a bit for services to be fully ready
    sleep 15
    
    # Run data seeding
    docker-compose --profile seed-data up data-init --no-deps
    
    print_status "Sample data seeded successfully"
}

# Check service health
check_health() {
    print_info "Checking service health..."
    
    services=("db" "backend" "admin-backend" "frontend" "admin-dashboard")
    
    for service in "${services[@]}"; do
        print_info "Checking $service..."
        
        max_attempts=20
        attempt=1
        
        while [ $attempt -le $max_attempts ]; do
            if docker-compose ps $service | grep -q "healthy\|Up"; then
                print_status "$service is healthy"
                break
            fi
            
            if [ $attempt -eq $max_attempts ]; then
                print_warning "$service may not be fully ready yet"
                break
            fi
            
            sleep 3
            attempt=$((attempt + 1))
        done
    done
}

# Display final information
show_info() {
    echo ""
    echo "🎉 OrderFlow Setup Complete!"
    echo "============================="
    echo ""
    echo "🌐 Access your applications:"
    echo ""
    echo "• 🍕 Customer Frontend:    http://localhost:3000"
    echo "• 🏢 Admin Dashboard:      http://localhost:3002"
    echo "• 🔧 Backend API:          http://localhost:3001"
    echo "• ⚙️  Admin API:           http://localhost:3003"
    echo "• 🗄️  pgAdmin:             http://localhost:8081"
    echo ""
    echo "📊 pgAdmin Access:"
    echo "• Email: admin@pizza.com (configurable in .env)"
    echo "• Password: admin123 (configurable in .env)"
    echo ""
    echo "🔧 Useful Commands:"
    echo "• View logs:        docker-compose logs -f [service]"
    echo "• Stop all:         docker-compose down"
    echo "• Restart service:  docker-compose restart [service]"
    echo "• View status:      docker-compose ps"
    echo ""
    echo "📁 The system includes:"
    echo "• ✅ Complete database schema with all tables"
    echo "• ✅ Sample products and categories"
    echo "• ✅ Test customers and users"
    echo "• ✅ 6 months of historical orders (71 orders)"
    echo "• ✅ Restaurant configuration and settings"
    echo "• ✅ Reservation system with table management"
    echo ""
    print_status "System is ready for use!"
}

# Main execution
main() {
    check_requirements
    cleanup_existing
    start_services
    seed_data
    check_health
    show_info
}

# Handle script interruption
trap 'print_error "Setup interrupted"; exit 1' INT TERM

# Run main function
main

exit 0
