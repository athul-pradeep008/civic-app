# Deployment Guide

## 🐳 Run Locally with Docker

Prerequisites:
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and **running**.

> [!NOTE]
> If you see an error like `error during connect: ... The system cannot find the file specified`, it means Docker Desktop is not running. Please start it and try again.

1.  **Build and Start**:
    Open your terminal in the project root and run:
    ```bash
    docker-compose up -d --build
    ```

2.  **Verify**:
    - App: `http://localhost:5002`
    - Logs: `docker-compose logs -f`

3.  **Stop**:
    ```bash
    docker-compose down
    ```

## ☁️ Deploy to Render.com

Render is a great platform that supports Docker deployments.

1.  **Push to GitHub**: Ensure your code is pushed to a GitHub repository.
2.  **Create a New Blueprint**:
    - Go to [Render Dashboard](https://dashboard.render.com/).
    - Click **New +** -> **Blueprint**.
    - Connect your repository.
    - Render will detect the `render.yaml` (create one if missing, see below).

### `render.yaml` (Create this file in root)

```yaml
services:
  - type: web
    name: civic-issue-reporting-system
    env: docker
    plan: free
    region: oregon
    envVars:
      - key: NODE_ENV
        value: production
      - key: MONGODB_URI
        fromConnectionString: mongodb
      - key: JWT_SECRET
        generateValue: true

databases:
  - name: mongodb
    plan: free
    ipAllowList: [] # Allow all
```

*Note: Render's free tier MongoDB deletes data after 90 days. For production, upgrade the database plan.*
