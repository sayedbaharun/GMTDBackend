# Deploy to Railway - Web Interface Guide

## ✅ Build Fixed! Ready to Deploy

The TypeScript build errors have been fixed. Your backend is now ready to deploy to Railway.

## 🚀 Quick Deploy Steps (5 minutes)

### 1. Push to GitHub
```bash
git add -A
git commit -m "Fix TypeScript build errors for deployment"
git push origin main
```

### 2. Deploy via Railway Dashboard

1. Go to [railway.app](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose **`GMTDBackend`** repository
5. Railway will automatically start building and deploying

### 3. Add PostgreSQL Database

Once deployment starts:
1. Click **"+ New"** in your project
2. Select **"Database"** → **"Add PostgreSQL"**
3. Railway automatically connects it

### 4. Add Environment Variables

1. Click on your service (GMTDBackend)
2. Go to **"Variables"** tab
3. Click **"Raw Editor"**
4. Paste this block:

```env
NODE_ENV=production
PORT=5000
JWT_SECRET=ed5fcda809a26f4ddc062d298136be9f6839910521013b7dec2a77e4f248ddbe
AUTH0_DOMAIN=dev-gmtd2025.uk.auth0.com
AUTH0_AUDIENCE=https://api.getmetodub.ai
STRIPE_SECRET_KEY=YOUR_STRIPE_LIVE_SECRET_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_buBrj3OehIo3gXSAAUYEVYDbkWlz3yP5
AMADEUS_API_KEY=7GW9BtjxxiP4b9j5wjQVRJm6bjpngfPP
AMADEUS_API_SECRET=yrsVsEXxAckcMuqm
DEFAULT_EMAIL=admin@getmetodub.ai
CLIENT_URL=https://getmetodub.ai
```

5. Click **"Save"**

### 5. Get Your URL & Add Custom Domain

1. Go to **"Settings"** → **"Domains"**
2. Click **"Generate Domain"** to get your Railway URL
3. Test it: `https://your-app.up.railway.app/api/health`
4. Click **"+ Custom Domain"**
5. Enter: `api.getmetodub.ai`
6. Copy the CNAME value Railway provides

### 6. Update GoDaddy DNS

1. Go to GoDaddy DNS management
2. Add CNAME record:
   - Type: CNAME
   - Name: api
   - Value: [the-value-from-railway].up.railway.app
   - TTL: 600

## ✅ Success Checklist

- [ ] Code pushed to GitHub
- [ ] Railway deployment started
- [ ] PostgreSQL database added
- [ ] Environment variables saved
- [ ] Health endpoint working
- [ ] Custom domain configured

## 🎉 What Was Fixed

1. **Route Handler Types**: Fixed async route handlers returning Response objects
2. **Stripe Null Checks**: Added proper null checks for all stripe client usage
3. **Build Now Passes**: `npm run build` completes successfully

Your backend is production-ready! 🚀