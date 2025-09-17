#!/bin/bash
# Environment Setup Script for EzEdit Fly.io Deployment
# Usage: ./scripts/deployment/setup-env.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check if flyctl is available
check_flyctl() {
    if ! command -v flyctl &> /dev/null; then
        log_error "flyctl CLI is not installed. Please install it first:"
        log_error "curl -L https://fly.io/install.sh | sh"
        exit 1
    fi

    if ! flyctl auth whoami &> /dev/null; then
        log_error "Not logged in to Fly.io. Please run: flyctl auth login"
        exit 1
    fi

    log_success "flyctl is ready"
}

# Set up Fly.io secrets
setup_secrets() {
    log_info "Setting up Fly.io secrets..."

    # Check if .env.local exists for reference
    if [ ! -f ".env.local" ]; then
        log_warning ".env.local not found. Please ensure you have your environment variables ready."
    fi

    log_info "Setting up database credentials..."

    # Supabase credentials (replace with actual values)
    read -p "Enter NEXT_PUBLIC_SUPABASE_URL: " SUPABASE_URL
    read -p "Enter NEXT_PUBLIC_SUPABASE_ANON_KEY: " SUPABASE_ANON_KEY
    read -s -p "Enter SUPABASE_SERVICE_ROLE_KEY: " SUPABASE_SERVICE_KEY
    echo

    flyctl secrets set NEXT_PUBLIC_SUPABASE_URL="$SUPABASE_URL" || { log_error "Failed to set Supabase URL"; exit 1; }
    flyctl secrets set NEXT_PUBLIC_SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY" || { log_error "Failed to set Supabase anon key"; exit 1; }
    flyctl secrets set SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_KEY" || { log_error "Failed to set Supabase service key"; exit 1; }

    log_info "Setting up payment processing credentials..."

    # Stripe credentials (replace with actual values)
    read -p "Enter NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (press Enter to skip): " STRIPE_PUB_KEY
    if [ ! -z "$STRIPE_PUB_KEY" ]; then
        read -s -p "Enter STRIPE_SECRET_KEY: " STRIPE_SECRET_KEY
        echo
        read -s -p "Enter STRIPE_WEBHOOK_SECRET: " STRIPE_WEBHOOK_SECRET
        echo

        flyctl secrets set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="$STRIPE_PUB_KEY"
        flyctl secrets set STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY"
        flyctl secrets set STRIPE_WEBHOOK_SECRET="$STRIPE_WEBHOOK_SECRET"
        log_success "Stripe credentials configured"
    else
        log_warning "Stripe credentials skipped"
    fi

    log_info "Setting up AI service credentials..."

    # OpenAI credentials
    read -s -p "Enter OPENAI_API_KEY (press Enter to skip): " OPENAI_API_KEY
    echo
    if [ ! -z "$OPENAI_API_KEY" ]; then
        flyctl secrets set OPENAI_API_KEY="$OPENAI_API_KEY"
        log_success "OpenAI credentials configured"
    else
        log_warning "OpenAI credentials skipped"
    fi

    # Anthropic credentials
    read -s -p "Enter ANTHROPIC_API_KEY (press Enter to skip): " ANTHROPIC_API_KEY
    echo
    if [ ! -z "$ANTHROPIC_API_KEY" ]; then
        flyctl secrets set ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY"
        log_success "Anthropic credentials configured"
    else
        log_warning "Anthropic credentials skipped"
    fi

    log_info "Setting up application configuration..."

    # Application configuration
    flyctl secrets set NEXT_PUBLIC_APP_URL="https://ezedit.fly.dev"
    flyctl secrets set NODE_ENV="production"
    flyctl secrets set NEXT_TELEMETRY_DISABLED="1"

    log_success "Environment variables configured successfully"
}

# Verify secrets are set
verify_secrets() {
    log_info "Verifying secrets are set..."

    local secrets_output=$(flyctl secrets list)

    # Required secrets
    local required_secrets=("NEXT_PUBLIC_SUPABASE_URL" "NEXT_PUBLIC_SUPABASE_ANON_KEY" "SUPABASE_SERVICE_ROLE_KEY" "NODE_ENV")

    for secret in "${required_secrets[@]}"; do
        if echo "$secrets_output" | grep -q "$secret"; then
            log_success "✓ $secret is configured"
        else
            log_error "✗ $secret is missing"
            exit 1
        fi
    done

    # Optional secrets
    local optional_secrets=("STRIPE_SECRET_KEY" "OPENAI_API_KEY" "ANTHROPIC_API_KEY")

    for secret in "${optional_secrets[@]}"; do
        if echo "$secrets_output" | grep -q "$secret"; then
            log_success "✓ $secret is configured"
        else
            log_warning "- $secret is not configured (optional)"
        fi
    done

    log_success "Secret verification completed"
}

# Create or update fly.toml if needed
setup_fly_config() {
    log_info "Checking fly.toml configuration..."

    if [ ! -f "fly.toml" ]; then
        log_warning "fly.toml not found. Creating basic configuration..."

        cat > fly.toml << EOF
app = "ezedit"
primary_region = "iad"

[build]
  dockerfile = "Dockerfile"

[env]
  NODE_ENV = "production"
  PORT = "8080"
  NEXT_TELEMETRY_DISABLED = "1"

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 1
  max_machines_running = 10

  [[http_service.checks]]
    grace_period = "30s"
    interval = "15s"
    method = "GET"
    timeout = "10s"
    path = "/api/health"

[[vm]]
  memory = "4gb"
  cpu_kind = "shared"
  cpus = 2

[auto_scaling]
  min_machines_running = 1
  max_machines_running = 10

  [[auto_scaling.metrics]]
    name = "cpu"
    target = 80

  [[auto_scaling.metrics]]
    name = "memory"
    target = 85
EOF

        log_success "fly.toml created"
    else
        log_success "fly.toml already exists"
    fi
}

# Main setup process
main() {
    log_info "Starting EzEdit environment setup for Fly.io"
    echo "=============================================="

    check_flyctl
    setup_fly_config
    setup_secrets
    verify_secrets

    echo ""
    log_success "🎉 Environment setup completed successfully!"
    echo ""
    log_info "Next steps:"
    echo "1. Run: ./scripts/deployment/deploy.sh"
    echo "2. Monitor: flyctl logs -f"
    echo "3. Check status: flyctl status"
    echo ""
    log_info "Your app will be available at: https://ezedit.fly.dev"
}

# Handle script interruption
cleanup() {
    log_warning "Setup interrupted."
    exit 1
}

trap cleanup SIGINT SIGTERM

# Run main function
main "$@"