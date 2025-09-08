#!/bin/bash

# ProcureAI Production Deployment Script
# This script handles the complete deployment process

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="procure-ai"
NODE_VERSION="18"
BUILD_DIR=".next"
DOCKER_IMAGE="procure-ai"
DOCKER_TAG="latest"

# Functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check Node.js version
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed"
    fi
    
    NODE_VER=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VER" -lt "$NODE_VERSION" ]; then
        error "Node.js version $NODE_VERSION or higher is required. Current: $(node -v)"
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        error "npm is not installed"
    fi
    
    # Check if .env.local exists
    if [ ! -f ".env.local" ]; then
        warning ".env.local not found. Please create it from env.example"
        if [ -f "env.example" ]; then
            log "Copying env.example to .env.local..."
            cp env.example .env.local
            warning "Please edit .env.local with your production values"
        fi
    fi
    
    success "Prerequisites check completed"
}

# Install dependencies
install_dependencies() {
    log "Installing dependencies..."
    
    # Clean install
    rm -rf node_modules package-lock.json
    npm install
    
    success "Dependencies installed"
}

# Run tests
run_tests() {
    log "Running tests..."
    
    # Lint check
    npm run lint
    
    # Type check
    npm run type-check
    
    # Build test
    npm run build
    
    success "All tests passed"
}

# Build application
build_application() {
    log "Building application..."
    
    # Clean previous build
    rm -rf $BUILD_DIR
    
    # Build for production
    npm run build
    
    success "Application built successfully"
}

# Docker build
build_docker() {
    log "Building Docker image..."
    
    # Build Docker image
    docker build -t $DOCKER_IMAGE:$DOCKER_TAG .
    
    success "Docker image built: $DOCKER_IMAGE:$DOCKER_TAG"
}

# Deploy to Vercel
deploy_vercel() {
    log "Deploying to Vercel..."
    
    # Check if Vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
        log "Installing Vercel CLI..."
        npm install -g vercel
    fi
    
    # Deploy
    vercel --prod --yes
    
    success "Deployed to Vercel"
}

# Deploy to Railway
deploy_railway() {
    log "Deploying to Railway..."
    
    # Check if Railway CLI is installed
    if ! command -v railway &> /dev/null; then
        log "Installing Railway CLI..."
        npm install -g @railway/cli
    fi
    
    # Deploy
    railway up
    
    success "Deployed to Railway"
}

# Health check
health_check() {
    log "Running health check..."
    
    # Wait for deployment
    sleep 30
    
    # Get deployment URL (this would need to be configured)
    DEPLOYMENT_URL=${DEPLOYMENT_URL:-"http://localhost:3000"}
    
    # Check health endpoint
    if curl -f "$DEPLOYMENT_URL/api/health" > /dev/null 2>&1; then
        success "Health check passed"
    else
        error "Health check failed"
    fi
}

# Main deployment function
deploy() {
    local platform=${1:-"vercel"}
    
    log "Starting deployment to $platform..."
    
    check_prerequisites
    install_dependencies
    run_tests
    build_application
    
    case $platform in
        "vercel")
            deploy_vercel
            ;;
        "railway")
            deploy_railway
            ;;
        "docker")
            build_docker
            ;;
        *)
            error "Unknown platform: $platform"
            ;;
    esac
    
    health_check
    
    success "Deployment completed successfully!"
}

# Show usage
usage() {
    echo "Usage: $0 [platform]"
    echo "Platforms: vercel, railway, docker"
    echo "Example: $0 vercel"
}

# Main script
main() {
    if [ $# -eq 0 ]; then
        usage
        exit 1
    fi
    
    deploy "$1"
}

# Run main function with all arguments
main "$@"
