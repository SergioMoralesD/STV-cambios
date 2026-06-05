# syntax=docker/dockerfile:1

# ── Stage 1: build (Vite) ─────────────────────────────────────────────────────
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Vacío → rutas relativas; nginx proxyará al servicio backend
ARG VITE_BACKEND_URL_PROD=
ENV VITE_BACKEND_URL_PROD=${VITE_BACKEND_URL_PROD}

# build:docker = vite build (npm run build falla por errores TS preexistentes)
RUN npm run build:docker

# ── Stage 2: serve (nginx) ────────────────────────────────────────────────────
FROM nginx:1.27-alpine

RUN apk add --no-cache wget

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 5173

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:5173/ > /dev/null 2>&1 || exit 1

CMD ["nginx", "-g", "daemon off;"]
