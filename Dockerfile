# Multi-stage Dockerfile for Unified Full-Stack Production Deployment
# 1. Build Frontend
FROM node:24-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# 2. Production Server
FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000

# Install server dependencies
COPY server/package*.json ./server/
RUN cd server && npm install --omit=dev

# Copy server code
COPY server/ ./server/

# Copy compiled frontend from client-builder into client/dist
COPY --from=client-builder /app/client/dist ./client/dist

# Expose port
EXPOSE 5000

# Start server
CMD ["node", "server/src/index.js"]
