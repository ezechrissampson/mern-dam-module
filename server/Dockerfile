FROM node:20-alpine AS base
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production
EXPOSE 5001

# Runs as a non-root user for defense in depth.
RUN addgroup -S dam && adduser -S dam -G dam
USER dam

CMD ["node", "src/server.js"]
