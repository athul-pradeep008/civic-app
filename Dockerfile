# --- STAGE 1: BUILDER ---
FROM node:18-slim AS builder

WORKDIR /app

# Copy package files for dependency caching
COPY package*.json ./

# Install ALL dependencies (including dev) for potential builds/tests
RUN npm install

# Copy source code
COPY . .

# --- STAGE 2: RUNNER ---
FROM node:18-slim AS runner

# Add metadata labels
LABEL maintainer="CivicReport Team"
LABEL version="1.0.0"
LABEL description="Professional Civic Issue Reporting System"

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=5002

# Copy only production dependencies from builder
COPY --from=builder /app/package*.json ./
RUN npm install --production

# Copy application files from builder (excluding source/tests if needed)
COPY --from=builder /app/server.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/routes ./routes
COPY --from=builder /app/models ./models
COPY --from=builder /app/controllers ./controllers
COPY --from=builder /app/services ./services
COPY --from=builder /app/config ./config
COPY --from=builder /app/middleware ./middleware

# Create uploads directory with correct permissions
RUN mkdir -p uploads && chown -R node:node /app

# Switch to non-root user
USER node

# Expose port
EXPOSE 5002

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5002/api/health', (res) => { if (res.statusCode === 200) process.exit(0); else process.exit(1); })"

# Start the application
CMD ["node", "server.js"]
