# 🚀 GetMeToDubai - Complete Deployment Guide

This guide will walk you through deploying the entire GetMeToDubai platform to Google Cloud Platform for live testing.

## Prerequisites

1. **Google Cloud Account** with billing enabled
2. **gcloud CLI** installed ([Install Guide](https://cloud.google.com/sdk/docs/install))
3. **Node.js 18+** and npm installed
4. **Git** installed
5. **GitHub account** (for CI/CD)

## 📋 Deployment Steps

### Step 1: Initial Google Cloud Setup

```bash
# 1. Login to Google Cloud
gcloud auth login

# 2. Create a new project (or use existing)
gcloud projects create gmtd-live-test --name="GetMeToDubai Live"
gcloud config set project gmtd-live-test

# 3. Enable billing for the project
# Visit: https://console.cloud.google.com/billing

# 4. Run the setup script
cd gmtd_web_backend
chmod +x setup-gcp.sh
./setup-gcp.sh
```

### Step 2: Configure API Keys

After running the setup script, you need to update the placeholder secrets with real API keys:

```bash
# 1. Stripe Keys (get from https://dashboard.stripe.com/test/apikeys)
echo -n "sk_test_YOUR_STRIPE_KEY" | gcloud secrets versions add stripe-secret-key --data-file=-
echo -n "whsec_YOUR_WEBHOOK_SECRET" | gcloud secrets versions add stripe-webhook-secret --data-file=-

# 2. Amadeus Keys (get from https://developers.amadeus.com)
echo -n "YOUR_AMADEUS_KEY" | gcloud secrets versions add amadeus-api-key --data-file=-
echo -n "YOUR_AMADEUS_SECRET" | gcloud secrets versions add amadeus-api-secret --data-file=-

# 3. OpenAI Key (get from https://platform.openai.com/api-keys)
echo -n "sk-YOUR_OPENAI_KEY" | gcloud secrets versions add openai-api-key --data-file=-
```

### Step 3: Deploy Backend API

```bash
# 1. Make deployment script executable
cd gmtd_web_backend
chmod +x deploy-production.sh

# 2. Deploy to Cloud Run
./deploy-production.sh

# 3. Note the service URL (will be shown in output)
# Example: https://gmtd-backend-abc123-uc.a.run.app
```

### Step 4: Deploy Admin Dashboard

```bash
# 1. Update API endpoint in admin dashboard
cd admin-dashboard

# Edit .env.production with your backend URL
echo "VITE_API_URL=https://gmtd-backend-abc123-uc.a.run.app" > .env.production

# 2. Deploy admin dashboard
chmod +x deploy.sh
./deploy.sh

# 3. Note the access URL (shown in output)
```

### Step 5: Configure Mobile App

```bash
# 1. Update backend URL in mobile app
cd ../../gmtd_mobile_app  # Return to mobile app directory

# Edit services/backendConfig.ts
# Update BASE_URL with your Cloud Run URL
```

### Step 6: Setup GitHub CI/CD (Optional but Recommended)

1. **Create GitHub Secrets:**
   - Go to your GitHub repo → Settings → Secrets
   - Add these secrets:
     - `GCP_PROJECT_ID`: Your project ID (e.g., gmtd-live-test)
     - `GCP_SA_KEY`: Service account key (see below)

2. **Create Service Account Key:**
   ```bash
   # Create key for GitHub Actions
   gcloud iam service-accounts keys create github-actions-key.json \
     --iam-account=gmtd-deployer@gmtd-live-test.iam.gserviceaccount.com
   
   # Copy the content and add as GCP_SA_KEY secret in GitHub
   cat github-actions-key.json
   
   # Delete local key file for security
   rm github-actions-key.json
   ```

3. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Setup deployment configuration"
   git push origin main
   ```

## 🧪 Testing Your Live Deployment

### 1. Test Backend API
```bash
# Health check
curl https://your-backend-url.a.run.app/api/health

# Test auth endpoint
curl https://your-backend-url.a.run.app/api/mobile-auth/health
```

### 2. Test Admin Dashboard
- Visit: `https://storage.googleapis.com/gmtd-admin-dashboard/index.html`
- Login with test admin credentials

### 3. Test Mobile App
```bash
# Start Expo
npx expo start

# Test on device/emulator
# The app should connect to your live backend
```

## 📊 Monitoring and Logs

### View Logs
```bash
# Backend logs
gcloud run services logs read gmtd-backend --limit=50

# Build logs
gcloud builds log list --limit=5
```

### Google Cloud Console Links
- **Cloud Run**: https://console.cloud.google.com/run
- **Cloud Build**: https://console.cloud.google.com/cloud-build/builds
- **Secret Manager**: https://console.cloud.google.com/security/secret-manager
- **Cloud SQL**: https://console.cloud.google.com/sql

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Error**
   ```bash
   # Check Cloud SQL instance
   gcloud sql instances describe gmtd-postgres
   
   # Verify connection in Cloud Run
   gcloud run services describe gmtd-backend --region=us-central1
   ```

2. **Permission Denied**
   ```bash
   # Grant missing permissions
   gcloud projects add-iam-policy-binding PROJECT_ID \
     --member="serviceAccount:SERVICE_ACCOUNT_EMAIL" \
     --role="roles/MISSING_ROLE"
   ```

3. **Build Failed**
   ```bash
   # Check build logs
   gcloud builds log list --limit=1
   ```

## 💰 Cost Management

### Estimated Monthly Costs
- Cloud Run: ~$50 (scales to zero)
- Cloud SQL: ~$50 (db-f1-micro)
- Cloud Storage: ~$5
- **Total**: ~$105/month

### Cost Saving Tips
1. Stop Cloud SQL when not testing:
   ```bash
   gcloud sql instances patch gmtd-postgres --no-assign-ip
   ```

2. Set Cloud Run min instances to 0:
   ```bash
   gcloud run services update gmtd-backend --min-instances=0
   ```

## 🎉 Success Checklist

- [ ] Backend API deployed and accessible
- [ ] Admin dashboard deployed and accessible
- [ ] Database connected and migrations run
- [ ] All API keys configured in Secret Manager
- [ ] Mobile app connecting to live backend
- [ ] GitHub Actions CI/CD configured (optional)

## 📱 Quick Commands Reference

```bash
# Deploy backend
cd gmtd_web_backend && ./deploy-production.sh

# Deploy admin
cd admin-dashboard && ./deploy.sh

# View backend logs
gcloud run services logs read gmtd-backend --limit=50

# Update a secret
echo -n "new-value" | gcloud secrets versions add secret-name --data-file=-

# Trigger manual deployment
gcloud builds submit --config=cloudbuild.yaml
```

## 🆘 Need Help?

1. Check logs first: `gcloud run services logs read gmtd-backend`
2. Visit [Google Cloud Console](https://console.cloud.google.com)
3. Review [Cloud Run documentation](https://cloud.google.com/run/docs)

---

**Your GetMeToDubai platform is now LIVE!** 🚀

Backend URL: `https://gmtd-backend-[PROJECT-ID].a.run.app`  
Admin Dashboard: `https://storage.googleapis.com/gmtd-admin-dashboard/index.html`