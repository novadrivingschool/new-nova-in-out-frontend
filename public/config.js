// Desarrollo local: sin valores, se usa .env (import.meta.env).
// En el contenedor, docker-entrypoint.d/40-runtime-config.sh reemplaza este archivo al arrancar.
window.__ENV__ = window.__ENV__ || {}
