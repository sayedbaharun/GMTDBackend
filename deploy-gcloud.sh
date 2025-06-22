#!/bin/bash

# Google Cloud Deployment Script for GetMeToDubai Backend
# This script handles the complete deployment process to Google Cloud Run

set -e  # Exit on error

# Configuration
PROJECT_ID="getmetodubai"  # Change this to your Google Cloud project ID
REGION="us-central1"       # Change to preferred region (asia-south1 for Mumbai)
SERVICE_NAME="gmtd-backend"
DB_INSTANCE_NAME="gmtd-postgres"

echo "🚀 Starting Google Cloud deployment for GetMeToDubai Backend..."
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Google Cloud SDK is not installed!"
    echo "Please install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" &> /dev/null; then
    echo "🔐 Please authenticate with Google Cloud..."
    gcloud auth login
fi

# Set the project
echo "📋 Setting project to ${PROJECT_ID}..."
gcloud config set project ${PROJECT_ID} 2>/dev/null || {
    echo "❌ Project ${PROJECT_ID} not found or you don't have access."
    echo ""
    echo "To create a new project:"
    echo "1. Run: gcloud projects create ${PROJECT_ID} --name='GetMeToDubai'"
    echo "2. Enable billing: https://console.cloud.google.com/billing"
    echo "3. Run this script again"
    exit 1
}

# Enable required APIs
echo "🔧 Enabling required Google Cloud APIs..."
gcloud services enable \
    cloudbuild.googleapis.com \
    run.googleapis.com \
    sqladmin.googleapis.com \
    secretmanager.googleapis.com \
    artifactregistry.googleapis.com

# Check if Cloud SQL instance exists
echo "🗄️ Checking Cloud SQL instance..."
if ! gcloud sql instances describe ${DB_INSTANCE_NAME} --project=${PROJECT_ID} &> /dev/null; then
    echo "Creating Cloud SQL PostgreSQL instance..."
    gcloud sql instances create ${DB_INSTANCE_NAME} \
        --database-version=POSTGRES_15 \
        --tier=db-f1-micro \
        --region=${REGION} \
        --network=default \
        --database-flags=cloudsql.iam_authentication=on
    
    # Wait for instance to be ready
    echo "⏳ Waiting for database to be ready..."
    gcloud sql operations wait --project=${PROJECT_ID} \
        $(gcloud sql operations list --instance=${DB_INSTANCE_NAME} --project=${PROJECT_ID} --filter="status=RUNNING" --format="value(name)" | head -n1)
    
    # Create database
    echo "📊 Creating database..."
    gcloud sql databases create gmtd_dubai --instance=${DB_INSTANCE_NAME}
    
    # Set root password
    echo "🔐 Setting database password..."
    gcloud sql users set-password postgres --instance=${DB_INSTANCE_NAME} --password="gmtd-secure-password-2025"
fi

# Get database connection name
DB_CONNECTION_NAME=$(gcloud sql instances describe ${DB_INSTANCE_NAME} --format="value(connectionName)")
echo "✅ Database connection: ${DB_CONNECTION_NAME}"

# Create secrets if they don't exist
echo "🔐 Managing secrets..."
create_secret_if_not_exists() {
    local secret_name=$1
    local secret_value=$2
    
    if ! gcloud secrets describe ${secret_name} &> /dev/null; then
        echo "Creating secret: ${secret_name}"
        echo -n "${secret_value}" | gcloud secrets create ${secret_name} --data-file=-
        gcloud secrets add-iam-policy-binding ${secret_name} \
            --member="serviceAccount:${PROJECT_ID}@appspot.gserviceaccount.com" \
            --role="roles/secretmanager.secretAccessor"
    else
        echo "Secret ${secret_name} already exists"
    fi
}

# Create necessary secrets
create_secret_if_not_exists "jwt-secret" "ed5fcda809a26f4ddc062d298136be9f6839910521013b7dec2a77e4f248ddbe"
create_secret_if_not_exists "stripe-secret-key" "YOUR_STRIPE_LIVE_SECRET_KEY_HERE"
create_secret_if_not_exists "openai-api-key" "YOUR_OPENAI_API_KEY_HERE"

# Build and deploy to Cloud Run
echo "🏗️ Building and deploying to Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
    --source . \
    --region ${REGION} \
    --platform managed \
    --allow-unauthenticated \
    --add-cloudsql-instances ${DB_CONNECTION_NAME} \
    --set-env-vars "NODE_ENV=production" \
    --set-env-vars "PORT=8080" \
    --set-env-vars "DATABASE_URL=postgresql://postgres:gmtd-secure-password-2025@localhost:5432/gmtd_dubai?host=/cloudsql/${DB_CONNECTION_NAME}" \
    --set-env-vars "AUTH0_DOMAIN=dev-gmtd2025.uk.auth0.com" \
    --set-env-vars "AUTH0_AUDIENCE=https://api.getmetodub.ai" \
    --set-env-vars "AMADEUS_API_KEY=7GW9BtjxxiP4b9j5wjQVRJm6bjpngfPP" \
    --set-env-vars "AMADEUS_API_SECRET=yrsVsEXxAckcMuqm" \
    --set-env-vars "DEFAULT_EMAIL=admin@getmetodub.ai" \
    --set-env-vars "CLIENT_URL=https://getmetodub.ai" \
    --set-secrets "JWT_SECRET=jwt-secret:latest" \
    --set-secrets "STRIPE_SECRET_KEY=stripe-secret-key:latest" \
    --set-secrets "OPENAI_API_KEY=openai-api-key:latest" \
    --memory 512Mi \
    --min-instances 0 \
    --max-instances 10 \
    --timeout 300

# Get the service URL
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region ${REGION} --format "value(status.url)")
echo ""
echo "✅ Deployment complete!"
echo "🌐 Service URL: ${SERVICE_URL}"

# Test the health endpoint
echo ""
echo "🧪 Testing health endpoint..."
curl -s "${SERVICE_URL}/api/health" | jq . || echo "Health check returned non-JSON response"

echo ""
echo "📋 Next steps:"
echo "1. Update your Stripe secret key:"
echo "   gcloud secrets versions add stripe-secret-key --data-file=-"
echo ""
echo "2. Set up custom domain (api.getmetodub.ai):"
echo "   gcloud run domain-mappings create --service ${SERVICE_NAME} --domain api.getmetodub.ai --region ${REGION}"
echo ""
echo "3. Update DNS records in GoDaddy:"
echo "   - Type: CNAME"
echo "   - Name: api"
echo "   - Value: ghs.googlehosted.com"
echo ""
echo "4. View logs:"
echo "   gcloud run logs read --service ${SERVICE_NAME} --region ${REGION}"
echo ""
echo "🎉 Your backend is live at: ${SERVICE_URL}"