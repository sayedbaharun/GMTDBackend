#!/bin/bash

# Quick setup script for Google Cloud SDK on macOS

echo "🔧 Setting up Google Cloud SDK for GetMeToDubai deployment..."
echo ""

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    echo "📦 Installing Homebrew first..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

# Install Google Cloud SDK
if ! command -v gcloud &> /dev/null; then
    echo "☁️ Installing Google Cloud SDK..."
    brew install google-cloud-sdk
else
    echo "✅ Google Cloud SDK already installed"
fi

# Login to Google Cloud
echo ""
echo "🔐 Logging in to Google Cloud..."
echo "This will open your browser to authenticate with your Google account."
echo "Press Enter to continue..."
read

gcloud auth login

# Create a new project
echo ""
echo "📋 Creating a new Google Cloud project..."
echo "Enter a unique project ID (lowercase, no spaces, e.g., 'getmetodubai-prod'):"
read PROJECT_ID

if gcloud projects create ${PROJECT_ID} --name="GetMeToDubai"; then
    echo "✅ Project created successfully!"
    
    # Set as default project
    gcloud config set project ${PROJECT_ID}
    
    echo ""
    echo "💳 IMPORTANT: Enable billing for your project"
    echo "1. Go to: https://console.cloud.google.com/billing/linkedaccount?project=${PROJECT_ID}"
    echo "2. Link a billing account (you get $300 free credit)"
    echo "3. Press Enter when done..."
    read
    
    # Enable APIs
    echo ""
    echo "🔧 Enabling required APIs..."
    gcloud services enable \
        cloudbuild.googleapis.com \
        run.googleapis.com \
        sqladmin.googleapis.com \
        secretmanager.googleapis.com \
        artifactregistry.googleapis.com
    
    echo ""
    echo "✅ Setup complete!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Update PROJECT_ID in deploy-gcloud.sh to: ${PROJECT_ID}"
    echo "2. Run: ./deploy-gcloud.sh"
    echo ""
    echo "Your project ID: ${PROJECT_ID}"
    echo "Console URL: https://console.cloud.google.com/home/dashboard?project=${PROJECT_ID}"
else
    echo "❌ Failed to create project. The ID might already be taken."
    echo "Please try again with a different project ID."
fi