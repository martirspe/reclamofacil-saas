# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build:dashboard

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist/dashboard/browser /usr/share/nginx/html
COPY infra/nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
