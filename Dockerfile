# ==========================================
# Stage 1: Build the TypeScript code
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install TypeScript globally inside this build container
RUN npm install -g typescript

# Copy your ENTIRE project (HTML, CSS, TS, pages folders) into /app
COPY . .

# Run the TypeScript compiler
# (This assumes you have a tsconfig.json in your root folder telling it what to do)
RUN tsc

# ==========================================
# Stage 2: Serve the website
# ==========================================
FROM nginx:alpine

# Copy the ENTIRE /app directory from the builder stage into Nginx.
# This keeps your exact folder structure intact (pages/, dist/, index.html, etc.)
COPY --from=builder /app /usr/share/nginx/html

EXPOSE 80
