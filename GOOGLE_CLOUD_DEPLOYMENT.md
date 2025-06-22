# Google Cloud Deployment Guide for GetMeToDubai

## 📋 Prerequisites

### 1. Install Google Cloud SDK
```bash
# macOS (using Homebrew)
brew install google-cloud-sdk

# Or download from: https://cloud.google.com/sdk/docs/install
```

### 2. Create Google Cloud Account
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Sign in with your Google Workspace account
3. You'll get $300 free credit for 90 days

### 3. Create a New Project
```bash
# Login to Google Cloud
gcloud auth login

# Create project (choose a unique project ID)
gcloud projects create getmetodubai-prod --name="GetMeToDubai"

# Set as default project
gcloud config set project getmetodubai-prod
```

### 4. Enable Billing
- Go to [Billing](https://console.cloud.google.com/billing)
- Link a billing account (you won't be charged during free trial)

## 🚀 Quick Deployment (One Command)

After setup, deploy with:
```bash
./deploy-gcloud.sh
```

This script will:
- ✅ Enable required APIs
- ✅ Create Cloud SQL PostgreSQL database
- ✅ Set up secrets management
- ✅ Build and deploy your app
- ✅ Configure environment variables
- ✅ Return your live URL

## 🔧 Manual Deployment Steps

### 1. Enable Required APIs
```bash
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  sqladmin.googleapis.com \
  secretmanager.googleapis.com
```

### 2. Create Cloud SQL Instance
```bash
# Create PostgreSQL instance
gcloud sql instances create gmtd-postgres \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1

# Create database
gcloud sql databases create gmtd_dubai --instance=gmtd-postgres

# Set password
gcloud sql users set-password postgres \
  --instance=gmtd-postgres \
  --password=your-secure-password
```

### 3. Deploy to Cloud Run
```bash
# Deploy from source
gcloud run deploy gmtd-backend \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --add-cloudsql-instances PROJECT_ID:REGION:gmtd-postgres \
  --set-env-vars NODE_ENV=production
```

## 🌐 Custom Domain Setup

### 1. Map Domain in Cloud Run
```bash
gcloud run domain-mappings create \
  --service gmtd-backend \
  --domain api.getmetodub.ai \
  --region us-central1
```

### 2. Update GoDaddy DNS
Add these records:
- **Type**: CNAME
- **Name**: api
- **Value**: ghs.googlehosted.com
- **TTL**: 600

## 🔐 Environment Variables

### Required Variables (set in Cloud Run):
- `NODE_ENV=production`
- `PORT=8080` (Cloud Run default)
- `DATABASE_URL` (automatically set by Cloud SQL connector)
- `AUTH0_DOMAIN=dev-gmtd2025.uk.auth0.com`
- `AUTH0_AUDIENCE=https://api.getmetodub.ai`
- `CLIENT_URL=https://getmetodub.ai`

### Secrets (use Secret Manager):
```bash
# Create secrets
echo -n "your-jwt-secret" | gcloud secrets create jwt-secret --data-file=-
echo -n "your-stripe-key" | gcloud secrets create stripe-secret-key --data-file=-

# Grant access
gcloud secrets add-iam-policy-binding jwt-secret \
  --member="serviceAccount:PROJECT_ID@appspot.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

## 📊 Monitoring & Logs

### View Logs
```bash
# Stream logs
gcloud run logs read --service gmtd-backend --region us-central1 --follow

# Or in console
open https://console.cloud.google.com/run
```

### View Metrics
```bash
# Open Cloud Run console
open https://console.cloud.google.com/run/detail/us-central1/gmtd-backend/metrics
```

## 💰 Cost Optimization

### Free Tier Includes:
- **Cloud Run**: 2 million requests/month
- **Cloud SQL**: 30GB storage
- **Networking**: 1GB egress/month

### Cost Saving Tips:
1. Set `--min-instances=0` (scale to zero)
2. Use `db-f1-micro` for database (free tier)
3. Enable Cloud CDN for static assets
4. Set appropriate timeouts

## 🔧 Useful Commands

### Update Service
```bash
# Redeploy after code changes
gcloud run deploy gmtd-backend --source .

# Update environment variable
gcloud run services update gmtd-backend \
  --update-env-vars KEY=VALUE

# Update secret
echo -n "new-secret" | gcloud secrets versions add stripe-secret-key --data-file=-
```

### Database Access
```bash
# Connect to database
gcloud sql connect gmtd-postgres --user=postgres --database=gmtd_dubai

# Local development with Cloud SQL Proxy
gcloud sql proxy PROJECT_ID:REGION:gmtd-postgres
```

### Rollback
```bash
# List revisions
gcloud run revisions list --service gmtd-backend

# Route traffic to previous revision
gcloud run services update-traffic gmtd-backend \
  --to-revisions gmtd-backend-00001-abc=100
```

## 🚨 Troubleshooting

### Common Issues:

1. **"Permission denied" errors**
   - Enable required APIs
   - Check IAM permissions

2. **Database connection fails**
   - Ensure Cloud SQL Admin API is enabled
   - Check DATABASE_URL format

3. **Build fails**
   - Check Dockerfile syntax
   - Ensure all files are not in .gcloudignore

4. **Domain mapping fails**
   - Verify domain ownership
   - Wait for DNS propagation (up to 48h)

## 📱 Next Steps

1. **Set up monitoring**:
   ```bash
   gcloud alpha monitoring policies create \
     --notification-channels=YOUR_CHANNEL_ID \
     --display-name="High Error Rate"
   ```

2. **Configure CI/CD**:
   - Connect GitHub to Cloud Build
   - Auto-deploy on push to main

3. **Set up staging environment**:
   ```bash
   gcloud run deploy gmtd-backend-staging \
     --source . \
     --region us-central1
   ```

## 🎉 Success Checklist

- [ ] Google Cloud SDK installed
- [ ] Project created with billing enabled
- [ ] APIs enabled
- [ ] Database created
- [ ] Service deployed
- [ ] Health endpoint working
- [ ] Custom domain configured
- [ ] Environment variables set
- [ ] Secrets configured
- [ ] Monitoring enabled

---

**Need help?** 
- Google Cloud Console: https://console.cloud.google.com
- Cloud Run Docs: https://cloud.google.com/run/docs
- Support: https://cloud.google.com/support