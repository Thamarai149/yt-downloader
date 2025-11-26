# Render Deployment Guide

## Automatic Deployment Setup

This project is configured for automatic deployment on Render using the `render.yaml` blueprint.

### Prerequisites

1. A GitHub/GitLab/Bitbucket repository with your code
2. A Render account (sign up at https://render.com)

### Deployment Steps

1. **Push your code to a Git repository**
   ```bash
   git add .
   git commit -m "Add Render deployment configuration"
   git push origin main
   ```

2. **Connect to Render**
   - Go to https://dashboard.render.com
   - Click "New +" → "Blueprint"
   - Connect your repository
   - Render will automatically detect the `render.yaml` file

3. **Configure Environment Variables**
   - After blueprint detection, you'll be prompted to set:
     - `CORS_ORIGIN`: Your frontend URL (e.g., `https://yourdomain.com`)
   - Other variables are pre-configured in `render.yaml`

4. **Deploy**
   - Click "Apply" to start the deployment
   - Render will automatically:
     - Install dependencies
     - Start your backend
     - Assign a URL (e.g., `https://youtube-downloader-backend.onrender.com`)

### Automatic Updates

Once deployed, Render will automatically:
- Redeploy when you push to the `main` branch
- Monitor your service health via `/api/health`
- Restart if the service crashes

### Configuration Details

The `render.yaml` file configures:
- **Runtime**: Node.js
- **Region**: Oregon (change if needed)
- **Plan**: Free tier
- **Build**: `npm install` in the `backend` directory
- **Start**: `npm start`
- **Health Check**: `/api/health` endpoint
- **Auto Deploy**: Enabled for `main` branch

### Environment Variables

Default production settings:
- `NODE_ENV=production`
- `PORT=10000` (Render's default)
- `MAX_CONCURRENT_DOWNLOADS=3`
- `RATE_LIMIT_WINDOW=15`
- `RATE_LIMIT_MAX=100`

You must set manually:
- `CORS_ORIGIN`: Your frontend domain

### Important Notes

1. **Free Tier Limitations**:
   - Service spins down after 15 minutes of inactivity
   - First request after spin-down takes ~30 seconds
   - 750 hours/month free

2. **Upgrade Options**:
   - Starter plan ($7/month): No spin-down, better performance
   - Standard plan ($25/month): More resources

3. **Custom Domain**:
   - Available on paid plans
   - Configure in Render dashboard under "Settings" → "Custom Domain"

### Monitoring

- View logs: Render Dashboard → Your Service → Logs
- Check health: `https://your-service.onrender.com/api/health`
- Monitor metrics: Render Dashboard → Your Service → Metrics

### Troubleshooting

**Service won't start:**
- Check logs in Render dashboard
- Verify all environment variables are set
- Ensure `package.json` has correct Node version

**CORS errors:**
- Update `CORS_ORIGIN` environment variable
- Restart service after changes

**Slow first request:**
- Normal on free tier (cold start)
- Consider upgrading to paid plan

### Alternative: Manual Deployment

If you prefer manual deployment without the blueprint:

1. Go to Render Dashboard
2. Click "New +" → "Web Service"
3. Connect your repository
4. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment Variables**: Add from above list

### Support

- Render Docs: https://render.com/docs
- Community: https://community.render.com
