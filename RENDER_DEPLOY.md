# Render Deployment Guide

This project uses Render.com for full-stack deployment with a monorepo structure.

## Deployment Setup

### 1. Connect Your Repository
1. Go to [render.com](https://render.com)
2. Sign in with GitHub
3. Create a **new** → **Web Service**
4. Connect your GitHub repository
5. Render will automatically detect the `render.yaml` file

### 2. Set Environment Variables
In your Render dashboard, set these in your **Backend** service:

**Required:**
- `MONGODB_URI` - Your MongoDB connection string
  ```
  mongodb+srv://username:password@cluster.mongodb.net/pollpulse
  ```
- `JWT_SECRET` - A strong random secret
  ```
  your-super-secret-jwt-key-here
  ```

**Optional:**
- `NODE_ENV` - Set to `production` (auto-set in render.yaml)
- `PORT` - Set to `5000` (auto-set in render.yaml)
- `CORS_ORIGIN` - Your frontend URL (auto-set in render.yaml)

### 3. Deploy Process
1. **Push your code** to master branch
   ```bash
   git push origin master
   ```

2. **Render automatically triggers**:
   - Backend: Installs deps in `/backend`, starts with `npm start`
   - Frontend: Builds in `/frontend`, serves static files from `dist/`
   - Frontend routes all requests to `index.html` (for React Router)

3. **Monitor deployment**:
   - Backend logs: Dashboard → Backend Service → Logs
   - Frontend logs: Dashboard → Frontend Service → Logs

### 4. Service URLs
After deployment, you'll get:
- **Backend API**: `https://pollpulse-backend.onrender.com`
- **Frontend**: `https://pollpulse-frontend.onrender.com`

### 5. Environment Variables on Render
The frontend environment variables are set automatically in `render.yaml`:
- `VITE_API_URL=https://pollpulse-backend.onrender.com/api`
- `VITE_SOCKET_URL=https://pollpulse-backend.onrender.com`

For local development, use your `.env` file:
- `VITE_API_URL=http://localhost:5000/api`
- `VITE_SOCKET_URL=http://localhost:5000`

## Troubleshooting

### Build Fails
- Check backend logs for errors
- Ensure all dependencies are in `package.json`
- Verify MongoDB connection string is correct

### Frontend Not Loading
- Clear browser cache
- Check that backend is running
- Verify CORS_ORIGIN in backend matches your frontend URL

### WebSocket Connection Issues
- Socket.io needs same origin as backend
- Frontend must use `VITE_SOCKET_URL` environment variable
- Check backend Socket.io configuration

## Local Testing Before Deploy
```bash
# Install all dependencies
npm run install:all

# Run locally
npm run dev:backend    # Terminal 1
npm run dev:frontend   # Terminal 2

# Test build locally
npm run build
```

## Free Tier Limitations
- Spins down after 15 minutes of inactivity
- 750 free compute hours/month
- Shared resources

**Recommendation**: Upgrade to Starter ($7/month) for production reliability.
