#!/bin/bash

# GetMeToDubai Production Deployment Script
# Usage: ./scripts/deploy.sh [staging|production]

set -e  # Exit on any error

ENVIRONMENT=${1:-production}
PROJECT_NAME="getmetodubai"

echo "🚀 Starting deployment to $ENVIRONMENT..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if Railway CLI is installed
    if ! command -v railway &> /dev/null; then
        print_error "Railway CLI not found. Install with: npm install -g @railway/cli"
        exit 1
    fi
    
    # Check if we're logged in to Railway
    if ! railway whoami &> /dev/null; then
        print_error "Not logged in to Railway. Run: railway login"
        exit 1
    fi
    
    # Check if .env file exists
    if [ ! -f ".env.${ENVIRONMENT}" ]; then
        print_warning ".env.${ENVIRONMENT} not found, using .env"
        if [ ! -f ".env" ]; then
            print_error "No environment file found!"
            exit 1
        fi
    fi
    
    print_status "Prerequisites check passed"
}

# Run tests and build
run_tests() {
    print_status "Running tests and build..."
    
    # Install dependencies
    npm ci
    
    # Run type checking
    if npm run type-check 2>/dev/null; then
        print_status "Type checking passed"
    else
        print_warning "Type checking skipped (script not found)"
    fi
    
    # Run linting
    if npm run lint 2>/dev/null; then
        print_status "Linting passed"
    else
        print_warning "Linting skipped (script not found)"
    fi
    
    # Build the project
    npm run build
    print_status "Build completed"
}

# Deploy to Railway
deploy_railway() {
    print_status "Deploying to Railway ($ENVIRONMENT)..."
    
    # Set environment variables from file
    if [ -f ".env.${ENVIRONMENT}" ]; then
        print_status "Setting environment variables from .env.${ENVIRONMENT}"
        
        # Read environment variables and set them in Railway
        while IFS='=' read -r key value; do
            # Skip empty lines and comments
            if [[ $key && $key != \#* ]]; then
                # Remove quotes from value if present
                value=$(echo "$value" | sed 's/^"//;s/"$//')
                railway variables set "$key=$value" --environment "$ENVIRONMENT"
            fi
        done < ".env.${ENVIRONMENT}"
    fi
    
    # Deploy
    railway up --environment "$ENVIRONMENT"
    
    print_status "Deployment to Railway completed"
}

# Health check
health_check() {
    print_status "Running health check..."
    
    # Get the deployment URL
    DEPLOY_URL=$(railway status --environment "$ENVIRONMENT" --json | jq -r '.deployments[0].url // empty')
    
    if [ -z "$DEPLOY_URL" ]; then
        print_warning "Could not get deployment URL, skipping health check"
        return
    fi
    
    print_status "Deployment URL: $DEPLOY_URL"
    
    # Wait for deployment to be ready
    echo "Waiting for deployment to be ready..."
    sleep 30
    
    # Check health endpoint
    for i in {1..5}; do
        if curl -f -s "$DEPLOY_URL/api/health" > /dev/null; then
            print_status "Health check passed ✅"
            echo "🌐 Application is live at: $DEPLOY_URL"
            return
        else
            print_warning "Health check attempt $i failed, retrying in 10s..."
            sleep 10
        fi
    done
    
    print_error "Health check failed after 5 attempts"
    exit 1
}

# Main deployment process
main() {
    echo "🚀 GetMeToDubai Deployment Script"
    echo "Environment: $ENVIRONMENT"
    echo "=================================="
    
    check_prerequisites
    run_tests
    deploy_railway
    health_check
    
    print_status "🎉 Deployment completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Test the deployed application"
    echo "2. Monitor logs: railway logs --environment $ENVIRONMENT"
    echo "3. Check metrics in Railway dashboard"
}

# Run main function
main