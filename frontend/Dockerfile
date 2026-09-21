# ── Stage 1: build the React app ───────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies (uses package-lock.json if present)
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# ── Stage 2: serve with nginx ───────────────────────────────────
FROM nginx:1.25-alpine

# Replace default nginx config with our custom one
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built app from the previous stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
