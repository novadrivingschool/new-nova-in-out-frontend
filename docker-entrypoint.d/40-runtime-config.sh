#!/bin/sh
# Genera config.js con la configuración del entorno del contenedor (front.env del servidor).
# La imagen es la misma en dev y prod: lo único que cambia son estas variables.
set -eu

OUT="${RUNTIME_CONFIG_OUT:-/usr/share/nginx/html/config.js}"

: "${VITE_API_AUTH_URL:?Falta VITE_API_AUTH_URL en front.env}"
: "${VITE_API_NOVA_IN_OUT_URL:?Falta VITE_API_NOVA_IN_OUT_URL en front.env}"

esc()  { printf '%s' "$1" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g'; }
url()  {
  case "$1" in
    http://*|https://*) printf '%s' "$1" | sed -e 's#/*$##' ;;
    *) echo "[runtime-config] URL inválida (debe iniciar con http:// o https://): $1" >&2; exit 1 ;;
  esac
}
bool() {
  case "$1" in
    true|false) printf '%s' "$1" ;;
    *) echo "[runtime-config] Valor inválido '$1' (use true o false)" >&2; exit 1 ;;
  esac
}

AUTH_URL="$(url "$VITE_API_AUTH_URL")"
API_URL="$(url "$VITE_API_NOVA_IN_OUT_URL")"
SHOT_DEL="$(bool "${VITE_ENABLE_SCREENSHOT_DELETE:-false}")"
DEV_BOT="$(bool "${VITE_DEV_ACTIVITY_BOT:-false}")"

cat > "$OUT" <<JS
window.__ENV__ = {
  VITE_API_AUTH_URL: "$(esc "$AUTH_URL")",
  VITE_API_NOVA_IN_OUT_URL: "$(esc "$API_URL")",
  VITE_ENABLE_SCREENSHOT_DELETE: "$SHOT_DEL",
  VITE_DEV_ACTIVITY_BOT: "$DEV_BOT"
};
JS

echo "[runtime-config] auth=$AUTH_URL api=$API_URL screenshotDelete=$SHOT_DEL devBot=$DEV_BOT"
