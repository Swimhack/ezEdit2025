#!/bin/bash
# EzEdit Deployment Script for Fly.io
# Usage: ./scripts/deployment/deploy.sh [environment]

set -e

# Configuration
ENVIRONMENT=${1:-production}
APP_NAME="ezedit"
HEALTH_ENDPOINT="/api/health"
MAX_WAIT_TIME=300  # 5 minutes

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check if flyctl is installed
    if ! command -v flyctl &> /dev/null; then
        log_error "flyctl CLI is not installed. Please install it first:"
        log_error "curl -L https://fly.io/install.sh | sh"
        exit 1
    fi

    # Check if logged in to Fly.io
    if ! flyctl auth whoami &> /dev/null; then
        log_error "Not logged in to Fly.io. Please run: flyctl auth login"
        exit 1
    fi

    # Check if Docker is running
    if ! docker info &> /dev/null; then
        log_error "Docker is not running. Please start Docker first."
        exit 1
    fi

    # Check if app exists
    if ! flyctl apps list | grep -q "$APP_NAME"; then
        log_warning "App '$APP_NAME' does not exist. It will be created during deployment."
    fi

    log_success "Prerequisites check passed"
}

# Build and test locally first
build_and_test() {
    log_info "Building and testing application locally..."

    # Install dependencies
    log_info "Installing dependencies..."
    npm ci

    # Run tests
    log_info "Running tests..."
    npm run test || {
        log_error "Tests failed. Aborting deployment."
        exit 1
    }

    # Build application
    log_info "Building Next.js application..."
    npm run build || {
        log_error "Build failed. Aborting deployment."
        exit 1
    }

    # Test Docker build
    log_info "Testing Docker build..."
    docker build -t ezedit-test . || {
        log_error "Docker build failed. Aborting deployment."
        exit 1
    }

    # Clean up test image
    docker rmi ezedit-test || true

    log_success "Local build and test completed successfully"
}

# Deploy to Fly.io
deploy_to_fly() {
    log_info "Deploying to Fly.io..."

    # Get current version for rollback reference
    CURRENT_VERSION=$(flyctl releases list --limit 1 --json | jq -r '.[0].version' 2>/dev/null || echo "none")
    log_info "Current version: $CURRENT_VERSION"

    # Deploy with increased timeout
    log_info "Starting deployment..."
    flyctl deploy --wait-timeout 600 || {
        log_error "Deployment failed!"

        if [ "$CURRENT_VERSION" != "none" ]; then
            log_warning "Consider rolling back to version $CURRENT_VERSION:"
            log_warning "flyctl releases rollback $CURRENT_VERSION"
        fi

        exit 1
    }

    log_success "Deployment completed successfully"
}

# Wait for application to be healthy
wait_for_health() {
    log_info "Waiting for application to be healthy..."

    local wait_time=0
    local app_url="https://${APP_NAME}.fly.dev"

    while [ $wait_time -lt $MAX_WAIT_TIME ]; do
        if curl -f -s "${app_url}${HEALTH_ENDPOINT}" > /dev/null; then
            log_success "Application is healthy!"
            return 0
        fi

        log_info "Application not ready yet, waiting... ($((wait_time + 10))s/${MAX_WAIT_TIME}s)"
        sleep 10
        wait_time=$((wait_time + 10))
    done

    log_error "Application failed to become healthy within ${MAX_WAIT_TIME}s"
    log_error "Check logs: flyctl logs"
    return 1
}

# Post-deployment verification
verify_deployment() {
    log_info "Verifying deployment..."

    local app_url="https://${APP_NAME}.fly.dev"

    # Test health endpoint
    log_info "Testing health endpoint..."
    local health_response=$(curl -s "${app_url}${HEALTH_ENDPOINT}" || echo "failed")
    if [[ $health_response == *"healthy"* ]]; then
        log_success "Health check passed"
    else
        log_error "Health check failed: $health_response"
        return 1
    fi

    # Test main page
    log_info "Testing main application..."
    if curl -f -s -I "$app_url" > /dev/null; then
        log_success "Main application is accessible"
    else
        log_error "Main application is not accessible"
        return 1
    fi

    # Check SSL certificate
    log_info "Verifying SSL certificate..."
    if curl -f -s -I "$app_url" | grep -q "HTTP/2 200"; then
        log_success "SSL certificate is working"
    else
        log_warning "SSL certificate may have issues"
    fi

    log_success "Deployment verification completed"
}

# Show deployment information
show_deployment_info() {
    log_info "Deployment Information:"
    echo "=========================="
    echo "App Name: $APP_NAME"
    echo "Environment: $ENVIRONMENT"
    echo "URL: https://${APP_NAME}.fly.dev"
    echo "Health Endpoint: https://${APP_NAME}.fly.dev${HEALTH_ENDPOINT}"
    echo ""
    echo "Useful commands:"
    echo "- View logs: flyctl logs -f"
    echo "- Check status: flyctl status"
    echo "- Scale app: flyctl scale count 2"
    echo "- Open dashboard: flyctl dashboard"
    echo ""
}

# Main deployment process
main() {
    log_info "Starting EzEdit deployment to Fly.io ($ENVIRONMENT)"
    echo "=================================================="

    check_prerequisites
    build_and_test
    deploy_to_fly
    wait_for_health
    verify_deployment
    show_deployment_info

    log_success "🚀 EzEdit deployment completed successfully!"
    log_success "Your application is now live at: https://${APP_NAME}.fly.dev"
}

# Handle script interruption
cleanup() {
    log_warning "Deployment interrupted. Cleaning up..."
    # Add any cleanup logic here
    exit 1
}

trap cleanup SIGINT SIGTERM

# Run main function
main "$@"