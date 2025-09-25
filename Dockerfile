# Use official node LTS image
FROM node:22-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package manifests and install dependencies first (layer caching)
COPY node_service/package.json node_service/package-lock.json* ./
RUN npm ci --only=production

# Copy app source
COPY node_service/ .

# Expose port
EXPOSE 3000

# Use non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

CMD ["node", "service.js"]
