# Railway Deployment Guide for GetMeToDubai

## 🚀 Quick Start (15 minutes to live!)

### Step 1: Sign Up for Railway
1. Go to [railway.app](https://railway.app)
2. Click "Start a New Project"
3. **Sign up with GitHub** (this connects your repos automatically)
4. You'll get $5 free credit - enough for testing

### Step 2: Create New Project
1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Search for `GMTDBackend`
4. Click **"Deploy Now"**

### Step 3: Add PostgreSQL Database
1. In your project dashboard, click **"+ New"**
2. Select **"Database"** → **"Add PostgreSQL"**
3. Railway creates it instantly!
4. It automatically sets `DATABASE_URL` environment variable

### Step 4: Add Environment Variables
1. Click on your service (GMTDBackend)
2. Go to **"Variables"** tab
3. Click **"Raw Editor"**
4. Paste this entire block:

```env
NODE_ENV=production
PORT=5000
JWT_SECRET=ed5fcda809a26f4ddc062d298136be9f6839910521013b7dec2a77e4f248ddbe

# Auth0
AUTH0_DOMAIN=dev-gmtd2025.uk.auth0.com
AUTH0_AUDIENCE=https://api.getmetodub.ai

# Stripe
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_STRIPE_SECRET_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE

# APIs
AMADEUS_API_KEY=7GW9BtjxxiP4b9j5wjQVRJm6bjpngfPP
AMADEUS_API_SECRET=yrsVsEXxAckcMuqm
OPENAI_API_KEY=sk-proj-your-production-key-here

# Email
DEFAULT_EMAIL=admin@getmetodub.ai
SENDGRID_FROM_EMAIL=admin@getmetodub.ai
CLIENT_URL=https://getmetodub.ai
```

5. Click **"Save"** - deployment starts automatically!

### Step 5: Generate Domain
1. Go to **"Settings"** tab
2. Under **"Domains"**, click **"Generate Domain"**
3. You'll get something like: `gmtdbackend-production.up.railway.app`
4. Test it: `https://gmtdbackend-production.up.railway.app/api/health`

### Step 6: Add Custom Domain (api.getmetodub.ai)
1. Still in **"Settings"** → **"Domains"**
2. Click **"+ Custom Domain"**
3. Enter: `api.getmetodub.ai`
4. Railway shows you a CNAME record
5. Go to GoDaddy and add:
   ```
   Type: CNAME
   Name: api
   Value: [the-value-railway-shows-you].up.railway.app
   TTL: 600
   ```

## 🎯 Environment Variables Reference

### Required (Must Add):
- `NODE_ENV` - Set to "production"
- `PORT` - Set to 5000
- `DATABASE_URL` - Railway adds this automatically!
- `JWT_SECRET` - Use: ed5fcda809a26f4ddc062d298136be9f6839910521013b7dec2a77e4f248ddbe
- `AUTH0_DOMAIN` - Use: dev-gmtd2025.uk.auth0.com
- `AUTH0_AUDIENCE` - Set to https://api.getmetodub.ai
- `STRIPE_SECRET_KEY` - Your live Stripe key (starts with sk_live_)
- `STRIPE_WEBHOOK_SECRET` - Use: whsec_buBrj3OehIo3gXSAAUYEVYDbkWlz3yP5
- `AMADEUS_API_KEY` - For flight/hotel search

### Optional (Can Add Later):
- `OPENAI_API_KEY` - For AI features (get new production key)
- `SENDGRID_API_KEY` - For email sending
- `STRIPE_WEBHOOK_SECRET` - For payment webhooks

## ✅ Deployment Checklist

- [ ] GitHub account connected
- [ ] GMTDBackend repo selected
- [ ] PostgreSQL database added
- [ ] Environment variables added
- [ ] Deployment successful (check logs)
- [ ] Health endpoint working
- [ ] Custom domain configured
- [ ] DNS records updated in GoDaddy

## 🔍 Testing Your Deployment

### 1. Check Health Endpoint:
```bash
curl https://your-railway-domain.up.railway.app/api/health
```

### 2. Check Logs:
- Click on your service
- Go to **"Logs"** tab
- Should see: "Server started on 0.0.0.0:5000"

### 3. Common Issues:

**Build Failed?**
- Check if all dependencies are in package.json
- Look at build logs for specific errors

**App Crashed?**
- Usually missing environment variables
- Check logs for which variable is missing

**Database Connection Failed?**
- Railway should handle this automatically
- Make sure PostgreSQL service is running

## 🎉 Success Indicators

You know it's working when:
1. ✅ Build completes (green checkmark)
2. ✅ Logs show "Server started"
3. ✅ Health endpoint returns JSON
4. ✅ No error messages in logs

## 📱 Next Steps

Once backend is live:
1. Update frontend `.env.production`:
   ```
   NEXT_PUBLIC_API_URL=https://api.getmetodub.ai
   ```
2. Deploy frontend to Vercel
3. Test complete flow

## 💡 Pro Tips

1. **Use Railway CLI** (optional):
   ```bash
   npm install -g @railway/cli
   railway login
   railway up
   ```

2. **Environment Groups**: Create "production" group for easy management

3. **Automatic Deploys**: Every push to main branch deploys automatically

4. **Database Backups**: Railway does daily backups automatically

## 🆘 Need Help?

- Railway Discord: Very responsive community
- Railway Docs: [docs.railway.app](https://docs.railway.app)
- Check deployment logs first - they're very detailed

---

**Estimated Time**: 15-20 minutes to fully deployed API at api.getmetodub.ai! 🚀