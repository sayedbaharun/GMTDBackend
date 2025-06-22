#!/bin/bash

# Admin Dashboard Deployment Script
# Deploy the admin dashboard to Google Cloud Storage with CDN

set -e

echo "🚀 Starting Admin Dashboard Deployment..."

# Check if required tools are installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Error: gcloud CLI is not installed"
    echo "Install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm is not installed"
    exit 1
fi

# Configuration
PROJECT_ID=$(gcloud config get-value project)
BUCKET_NAME="gmtd-admin-dashboard"
REGION="us-central1"

if [ -z "$PROJECT_ID" ]; then
    echo "❌ Error: No Google Cloud project configured"
    echo "Run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

echo "📦 Building Admin Dashboard..."
npm install
npm run build

echo "☁️  Creating bucket if it doesn't exist..."
if ! gsutil ls -b gs://$BUCKET_NAME &> /dev/null; then
    gsutil mb -p $PROJECT_ID -c STANDARD -l $REGION gs://$BUCKET_NAME
    
    # Make bucket public
    gsutil iam ch allUsers:objectViewer gs://$BUCKET_NAME
    
    # Configure bucket as website
    gsutil web set -m index.html -e index.html gs://$BUCKET_NAME
fi

echo "📤 Uploading files to Cloud Storage..."
# Delete old files first
gsutil -m rm -r gs://$BUCKET_NAME/** 2>/dev/null || true

# Upload new files
gsutil -m cp -r dist/* gs://$BUCKET_NAME/

# Set cache headers
echo "⚙️  Setting cache headers..."
gsutil -m setmeta -h "Cache-Control:public, max-age=3600" gs://$BUCKET_NAME/**/*.js
gsutil -m setmeta -h "Cache-Control:public, max-age=3600" gs://$BUCKET_NAME/**/*.css
gsutil -m setmeta -h "Cache-Control:public, max-age=86400" gs://$BUCKET_NAME/**/*.{png,jpg,jpeg,gif,svg,ico}
gsutil -m setmeta -h "Cache-Control:no-cache, no-store, must-revalidate" gs://$BUCKET_NAME/index.html

echo "🌐 Setting up Load Balancer and CDN (if not exists)..."
# Check if backend bucket exists
if ! gcloud compute backend-buckets list --filter="name:gmtd-admin-backend" --format="value(name)" | grep -q "gmtd-admin-backend"; then
    echo "Creating backend bucket..."
    gcloud compute backend-buckets create gmtd-admin-backend \
        --gcs-bucket-name=$BUCKET_NAME \
        --enable-cdn \
        --cache-mode=CACHE_ALL_STATIC \
        --max-ttl=86400 \
        --default-ttl=3600
fi

# Check if URL map exists
if ! gcloud compute url-maps list --filter="name:gmtd-admin-url-map" --format="value(name)" | grep -q "gmtd-admin-url-map"; then
    echo "Creating URL map..."
    gcloud compute url-maps create gmtd-admin-url-map \
        --default-backend-bucket=gmtd-admin-backend
fi

# Check if HTTPS proxy exists
if ! gcloud compute target-https-proxies list --filter="name:gmtd-admin-https-proxy" --format="value(name)" | grep -q "gmtd-admin-https-proxy"; then
    echo "Note: HTTPS proxy not configured. To enable HTTPS:"
    echo "1. Create SSL certificate: gcloud compute ssl-certificates create gmtd-admin-cert --domains=admin.getmetodubai.com"
    echo "2. Create HTTPS proxy: gcloud compute target-https-proxies create gmtd-admin-https-proxy --url-map=gmtd-admin-url-map --ssl-certificates=gmtd-admin-cert"
    echo "3. Create forwarding rule: gcloud compute forwarding-rules create gmtd-admin-https-rule --global --target-https-proxy=gmtd-admin-https-proxy --ports=443"
fi

# Invalidate CDN cache
echo "🔄 Invalidating CDN cache..."
gcloud compute url-maps invalidate-cdn-cache gmtd-admin-url-map --path="/*" --async || true

echo "✅ Deployment Complete!"
echo ""
echo "📍 Access your admin dashboard at:"
echo "   Direct: https://storage.googleapis.com/$BUCKET_NAME/index.html"
echo "   CDN: Configure domain pointing to Load Balancer IP"
echo ""
echo "📊 View in Console:"
echo "   https://console.cloud.google.com/storage/browser/$BUCKET_NAME"