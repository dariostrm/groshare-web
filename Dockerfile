# ==========================================
# Stage 1: Build the TypeScript code
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install a pinned TypeScript version globally inside this build container
RUN npm install -g typescript@5.6.3

# Copy your ENTIRE project (HTML, CSS, TS, pages folders) into /app
COPY . .

# Run the TypeScript compiler
# (This assumes you have a tsconfig.json in your root folder telling it what to do)
RUN tsc

# ==========================================
# Stage 2: Serve the website
# ==========================================
FROM nginx:alpine

# Copy only the runtime assets needed by the static site into Nginx.
# This preserves the served folder structure without including build-time artifacts.
COPY --from=builder /app/index.html /usr/share/nginx/html/index.html
COPY --from=builder /app/css /usr/share/nginx/html/css
COPY --from=builder /app/pages /usr/share/nginx/html/pages
COPY --from=builder /app/dist /usr/share/nginx/html/dist

EXPOSE 80
