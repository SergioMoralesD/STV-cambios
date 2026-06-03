FROM node:22-alpine AS backend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json nest-cli.json ./
COPY src/ ./src/
RUN npm run build

FROM node:22-alpine AS frontend-builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npx vite build

FROM node:22-alpine
RUN apk add --no-cache nginx supervisor

WORKDIR /app
COPY --from=backend-builder /app/dist ./dist
COPY --from=backend-builder /app/node_modules ./node_modules
COPY package*.json ./
COPY utils/ ./utils/
COPY portalb2b.db ./

COPY --from=frontend-builder /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/http.d/default.conf
COPY supervisord.conf /etc/supervisord.conf

RUN mkdir -p /app/uploads /app/logs
COPY uploads/ /app/uploads/

EXPOSE 80

CMD ["supervisord", "-c", "/etc/supervisord.conf"]
