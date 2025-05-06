# Deployment Guide for Get Me To Dubai

This document provides a concise guide to deploying the "Get Me To Dubai" Express TypeScript API from Replit to an external environment.

## Overview

The application is a comprehensive travel booking platform with:
- Express.js backend with TypeScript
- Supabase authentication
- Stripe payment integration
- PostgreSQL database
- RESTful API endpoints for travel services

## Deployment Checklist

### Step 1: Export from Replit

1. **Download Project Files**
   - Use the "Download as ZIP" option in Replit's menu
   - Extract the files to your local machine

2. **Clean Up Replit-specific Files**
   ```bash
   rm -rf .replit replit.nix .config .upm
   ```

3. **Verify .gitignore**
   Ensure these files are excluded:
   - `.env`
   - `node_modules/`
   - Build artifacts
   - Editor config files

### Step 2: Prepare Environment

1. **Create Environment File**
   - Copy `.env.example` to `.env`
   - Fill in actual values for:
     - Supabase credentials
     - Stripe API keys
     - Database connection string
     - Amadeus API credentials (if using flight search)

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Compile TypeScript**
   ```bash
   npx tsc
   ```

### Step 3: Database Migration

1. **Export Database from Replit**
   ```bash
   pg_dump -U $PGUSER -h $PGHOST -p $PGPORT -d $PGDATABASE -f database_dump.sql
   ```

2. **Create New Database** on your hosting provider

3. **Import Data**
   ```bash
   psql -U username -h hostname -d database_name -f database_dump.sql
   ```

4. **Update DATABASE_URL** in your `.env` file

### Step 4: Git Setup

1. **Initialize Git Repository**
   ```bash
   git init
   ```

2. **Add Files to Git**
   ```bash
   git add .
   git commit -m "Initial commit"
   ```

3. **Connect to Remote Repository**
   ```bash
   git remote add origin https://github.com/yourusername/your-repository.git
   git push -u origin main
   ```

### Step 5: Deploy to Hosting Platform

#### Option A: Traditional Hosting (e.g., VPS)

1. **Clone Repository** on your server
   ```bash
   git clone https://github.com/yourusername/your-repository.git
   ```

2. **Install Dependencies**
   ```bash
   npm install --production
   ```

3. **Set Up Environment**
   - Create `.env` file with production values
   - Configure reverse proxy (Nginx/Apache) if needed

4. **Start Server**
   ```bash
   NODE_ENV=production node server.js
   ```

5. **Set Up Process Manager** (PM2 recommended)
   ```bash
   npm install -g pm2
   pm2 start server.js --name "get-me-to-dubai"
   pm2 save
   pm2 startup
   ```

#### Option B: Heroku Deployment

1. **Create Heroku App**
   ```bash
   heroku create
   ```

2. **Set Environment Variables**
   ```bash
   heroku config:set NEXT_PUBLIC_SUPABASE_URL=your_value
   heroku config:set NEXT_PUBLIC_SUPABASE_ANON_KEY=your_value
   # Set all other required variables
   ```

3. **Add PostgreSQL**
   ```bash
   heroku addons:create heroku-postgresql:hobby-dev
   ```

4. **Deploy**
   ```bash
   git push heroku main
   ```

#### Option C: Vercel/Netlify (Serverless)

1. **Connect Repository** to Vercel/Netlify

2. **Configure Build**
   - Build command: `npm run build`
   - Output directory: `dist`

3. **Set Environment Variables** in platform dashboard

4. **Deploy**

### Step 6: Post-Deployment Tasks

1. **Verify API Health**
   ```bash
   curl https://your-deployed-app.com/api/health
   ```

2. **Configure Stripe Webhooks** for your new production URL

3. **Update CORS settings** if needed

4. **Set up monitoring** with a service like New Relic or Datadog

## Security Reminders

- Never commit `.env` files or secrets to Git
- Set up HTTPS for your production deployment 
- Configure a Web Application Firewall if possible
- Regularly update dependencies with `npm audit fix`
- Implement proper rate limiting for public endpoints
- Use Helmet middleware for security headers

## Troubleshooting

If you encounter issues after deployment:

1. **Check Logs**
   ```bash
   heroku logs --tail  # For Heroku
   pm2 logs            # For traditional hosting with PM2
   ```

2. **Verify Environment Variables**
   Ensure all required environment variables are set correctly

3. **Database Connection**
   Test database connectivity:
   ```bash
   node scripts/check-supabase.js
   ```

4. **External Services**
   Verify connections to Stripe and Supabase:
   ```bash
   node scripts/test-stripe.js
   node scripts/test-supabase.js
   ```

## Additional Resources

- Complete documentation: See `DOCUMENTATION.md`
- Project README: See `README.md`
- API Endpoints: Listed in README.md under "API Endpoints"