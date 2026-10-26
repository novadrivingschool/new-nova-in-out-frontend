# ─────────────────────────────────────────────────────────────────────────────
# Etapa 1: BUILD (Vue 3 + Vite)
# Las variables VITE_* se hornean en el build: cambiar una URL = publicar versión nueva.
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

ARG VITE_API_AUTH_URL=https://dev.auth-user.nio.novadrivingone.net
ARG VITE_API_NOVA_IN_OUT_URL=https://dev.api.nio.novadrivingone.net
ARG VITE_ENABLE_SCREENSHOT_DELETE=false

ENV VITE_API_AUTH_URL=$VITE_API_AUTH_URL
ENV VITE_API_NOVA_IN_OUT_URL=$VITE_API_NOVA_IN_OUT_URL
ENV VITE_ENABLE_SCREENSHOT_DELETE=$VITE_ENABLE_SCREENSHOT_DELETE

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
# build-only: el type-check (vue-tsc) se corre en local con `npm run build`
RUN npm run build-only

# ─────────────────────────────────────────────────────────────────────────────
# Etapa 2: SERVE (nginx sirve los estáticos)
# ─────────────────────────────────────────────────────────────────────────────
FROM nginx:stable-alpine AS production

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
