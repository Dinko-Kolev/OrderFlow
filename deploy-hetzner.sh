#!/bin/bash

# OrderFlow Hetzner Cloud Deployment Script
# This script automates the deployment process for Hetzner cloud servers

set -e  # Exit on any error

echo "🚀 OrderFlow Hetzner Cloud Deployment"
echo "====================================="

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

# Check if running as root
check_root() {
    if [ "$EUID" -eq 0 ]; then
        print_error "Please don't run this script as root. Use a regular user with sudo privileges."
        exit 1
    fi
}

# Install Docker
install_docker() {
    print_info "Installing Docker..."
    
    if command -v docker &> /dev/null; then
        print_status "Docker is already installed"
        return
    fi
    
    # Install Docker
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    
    # Add user to docker group
    sudo usermod -aG docker $USER
    
    print_status "Docker installed successfully"
    print_warning "You may need to logout and login again for Docker group changes to take effect"
}

# Install Docker Compose
install_docker_compose() {
    print_info "Installing Docker Compose..."
    
    if command -v docker-compose &> /dev/null; then
        print_status "Docker Compose is already installed"
        return
    fi
    
    # Install Docker Compose
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    
    print_status "Docker Compose installed successfully"
}

# Install Git
install_git() {
    print_info "Installing Git..."
    
    if command -v git &> /dev/null; then
        print_status "Git is already installed"
        return
    fi
    
    sudo apt update
    sudo apt install git -y
    
    print_status "Git installed successfully"
}

# Configure firewall
configure_firewall() {
    print_info "Configuring firewall..."
    
    # Allow necessary ports
    sudo ufw allow 22/tcp    # SSH
    sudo ufw allow 80/tcp    # HTTP
    sudo ufw allow 443/tcp   # HTTPS
    sudo ufw allow 3000/tcp  # Frontend
    sudo ufw allow 3001/tcp  # Backend API
    sudo ufw allow 3002/tcp  # Admin Dashboard
    sudo ufw allow 3003/tcp  # Admin API
    sudo ufw allow 8081/tcp  # pgAdmin
    
    # Enable firewall if not already enabled
    if ! sudo ufw status | grep -q "Status: active"; then
        echo "y" | sudo ufw enable
    fi
    
    print_status "Firewall configured successfully"
}

# Setup environment file
setup_environment() {
    print_info "Setting up environment configuration..."
    
    if [ ! -f .env.example ]; then
        print_error ".env.example file not found. Make sure you're in the OrderFlow directory."
        exit 1
    fi
    
    if [ ! -f .env ]; then
        cp .env.example .env
        print_status "Environment file created from template"
        print_warning "Please edit .env file with your production settings before continuing"
        print_info "Run: nano .env"
        read -p "Press Enter after you've configured the .env file..."
    else
        print_status "Environment file already exists"
    fi
}

# Deploy application
deploy_application() {
    print_info "Deploying OrderFlow application..."
    
    # Make setup script executable
    chmod +x setup.sh
    
    # Run the setup script
    ./setup.sh
}

# Display final information
show_final_info() {
    echo ""
    echo "🎉 OrderFlow Deployment Complete!"
    echo "================================"
    echo ""
    echo "🌐 Your application is now running at:"
    echo ""
    echo "• 🍕 Customer Frontend:    http://$(hostname -I | awk '{print $1}'):3000"
    echo "• 🏢 Admin Dashboard:      http://$(hostname -I | awk '{print $1}'):3002"
    echo "• 🔧 Backend API:          http://$(hostname -I | awk '{print $1}'):3001"
    echo "• ⚙️  Admin API:           http://$(hostname -I | awk '{print $1}'):3003"
    echo "• 🗄️  pgAdmin:             http://$(hostname -I | awk '{print $1}'):8081"
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
    echo "🔒 Security Recommendations:"
    echo "• Change default passwords in .env file"
    echo "• Restrict pgAdmin access in production"
    echo "• Set up SSL certificate with Let's Encrypt"
    echo "• Configure domain name for better security"
    echo ""
    print_status "OrderFlow is ready for production use!"
}

# Main execution
main() {
    check_root
    install_docker
    install_docker_compose
    install_git
    configure_firewall
    setup_environment
    deploy_application
    show_final_info
}

# Handle script interruption
trap 'print_error "Deployment interrupted"; exit 1' INT TERM

# Run main function
main

exit 0
