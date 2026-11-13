# ─────────────────────────────────────────────────────────────────────────────
# Etapa 1: BUILD (Vue 3 + Vite)
# La configuración (URLs de las APIs y flags) NO se hornea: se lee al arrancar el contenedor desde
# su entorno (front.env) y se escribe en /config.js. La misma imagen sirve para dev y prod.
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder


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

# Script de arranque (lo ejecuta el entrypoint de nginx): genera /config.js desde el entorno
COPY docker-entrypoint.d/40-runtime-config.sh /docker-entrypoint.d/40-runtime-config.sh
RUN sed -i 's/\r$//' /docker-entrypoint.d/40-runtime-config.sh && chmod +x /docker-entrypoint.d/40-runtime-config.sh

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
