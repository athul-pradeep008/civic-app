# Cloud Deployment & Debugging Guide (Vercel)

This guide provides a professional workflow for deploying your CivicReport System to Vercel and monitoring its health.

## 1. Prerequisites
- [Vercel CLI](https://vercel.com/download) installed (`npm i -g vercel`).
- MongoDB Atlas cluster (recommended for cloud storage).
- Gemini API Key.

## 2. Deployment Steps

### Step 1: Initialize Vercel
Run the following command in your project root:
```powershell
vercel
```
Follow the prompts to link your project.

### Step 2: Configure Environment Variables
Go to your project settings in the [Vercel Dashboard](https://vercel.com/dashboard) and add:
- `MONGODB_URI`: Your MongoDB connection string.
- `JWT_SECRET`: A secure random string.
- `GEMINI_API_KEY`: Your Google AI SDK key.
- `NODE_ENV`: `production`

### Step 3: Production Deploy
Once configured, push to production:
```powershell
vercel --prod
```

## 3. Professional Debugging in the Cloud

If your app crashes or behaves unexpectedly, use these tools:

### A. Real-time Log Streaming
Monitor requests and errors as they happen:
```powershell
vercel logs -f
```
This is the fastest way to catch "500 Internal Server Error" causes.

### B. Vercel Dashboard Logs
1. Open your project on Vercel.com.
2. Navigate to the **"Logs"** tab.
3. You can filter by **"Error"** to find crashes.
4. Each log entry provides a **Runtime ID** which you can share with developers for deep tracing.

### C. Server Startup Audit
Because we use a special "Port Stability" mode, Vercel will automatically assign its own port via `process.env.PORT`. The application is pre-configured to prioritize this, ensuring a 100% stable startup in the cloud.

## 4. Testing Your Deployment
After deployment, verify the following:
1. **Health Check**: `https://your-app.vercel.app/api/health`
2. **AI Verification**: Upload an image in the "Report Issue" section and ensure "AI Analysis" responds without errors.
- **Database Connectivity**: Log in as `admin@civicissues.com` to ensure your cloud database is linked correctly.

## 5. Docker Deployment (Standardized)

For local development or custom server hosting, use the professional Docker setup:

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed.

### Build & Run
Run the entire stack (App + MongoDB) with one command:
```powershell
npm run docker:up
```

### Viewing Logs
To monitor the container health:
```powershell
npm run docker:logs
```

### Stopping
To shut down the containerized environment:
```powershell
npm run docker:down
```

The Docker setup ensures that you have a reproducible environment with the correct Node.js and MongoDB versions pre-configured.

## 6. Render Deployment (Recommended for WebSockets)

Render is often better for this app because it supports WebSockets (Socket.io) and background workers natively, which Vercel Serverless can struggle with.

### Step 1: Create Blueprint
We have already created a `render.yaml` file in your project root.

### Step 2: Push to GitHub
Ensure your code is pushed to your GitHub repository.

### Step 3: Deploy on Render
1. Create a [Render account](https://render.com).
2. Click **"New +"** and select **"Blueprint"**.
3. Connect your GitHub repository.
4. Render will automatically detect the `render.yaml` and configure the service.
5. Click **"Apply"** to start the deployment.

### Step 4: Environment Variables
Render will read the variables from `render.yaml`. You may need to add your secrets (like `MONGODB_URI` and `GEMINI_API_KEY`) in the Render Dashboard under **Environment**.
