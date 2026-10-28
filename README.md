# NIO Frontend

Vue 3 + Vuetify + Vite. Desarrollo: `npm run dev` (puerto 5173).

## Deploy con registry (GHCR) — recomendado

El servidor **no compila nada**: descarga la imagen (nginx + estáticos) desde GitHub Container Registry.

| Dato | Valor |
|---|---|
| Imagen | `ghcr.io/novadrivingschool/nio-frontend:<versión>` (la versión va sin `v`) |
| Repo | `novadrivingschool/new-nova-in-out-frontend` |
| Carpeta en el servidor | `~/NovaInOut` |
| Archivos en el servidor | `front.yml` y `front.env` (`.env` independiente por servicio) |
| Contenedor / proyecto | `nio-front-dev` / `nio-front` |
| Puerto | `127.0.0.1:5080` → contenedor `:80` (nginx del host lo expone por HTTPS) |
| URL | `https://dev.nio.novadrivingone.net` |

> **Las URLs de las APIs van horneadas en la imagen** (Vite las incrusta al compilar). Por defecto:
> `VITE_API_AUTH_URL=https://dev.auth-user.nio.novadrivingone.net` y
> `VITE_API_NOVA_IN_OUT_URL=https://dev.api.nio.novadrivingone.net`.
> Para cambiarlas: GitHub → Settings → Secrets and variables → Actions → **Variables**
> (`VITE_API_AUTH_URL`, `VITE_API_NOVA_IN_OUT_URL`, `VITE_ENABLE_SCREENSHOT_DELETE`, `VITE_DEV_ACTIVITY_BOT`) y publicar una versión nueva.
> El `.env` local **no** entra a la imagen (`.dockerignore`).
> `VITE_ENABLE_SCREENSHOT_DELETE` es solo dev (muestra el botón de borrar screenshots); ponerlo en `false` en producción.
> `VITE_DEV_ACTIVITY_BOT` es solo dev/pruebas: muestra el switch del bot de actividad en la edición de usuario, solo a super admins (requiere `DEV_ACTIVITY_BOT=true` en el API). En local va en `.env` (sección DEV ONLY); en la imagen sale en `true` por defecto, igual que `VITE_ENABLE_SCREENSHOT_DELETE` (lo fija el workflow, no el `.env`). En producción: variable de GitHub del mismo nombre en `false`.

> El servidor usa **docker-compose v1** (`docker-compose`, con guion). Atajo para cada sesión:
>
> ```bash
> cd ~/NovaInOut
> DC="docker-compose --env-file front.env -f front.yml -p nio-front"
> ```

### A. Publicar una versión (tu PC) — primera vez y cada actualización

```bash
npm run build                                   # type-check + build local
git add -A && git commit -m "mensaje" && git push origin main
git tag v1.0.1 && git push origin v1.0.1        # el tag lleva "v"; la imagen queda sin "v"
```

Esperar el ✅ verde en **Actions**. Sin `git push origin vX.Y.Z` el workflow no se dispara.
El workflow compila con `build-only` (sin type-check); el type-check se corre en local.

### B. Primera vez en el servidor

**1. Login a GHCR** (si ya se hizo para otro servicio, saltar): `docker login ghcr.io -u novadrivingschool`
con un token clásico con **solo** `read:packages` como contraseña. Debe decir `Login Succeeded`.

**2. Crear los archivos** (`~/NovaInOut`):

```bash
nano front.yml     # contenido de deploy/front.yml
nano front.env     # contenido de deploy/front.env.example
chmod 600 front.env
```

**3. Puerto libre:** `ss -ltnp | grep 5080` (no debe mostrar nada).

**4. Descargar y levantar:**

```bash
docker pull ghcr.io/novadrivingschool/nio-frontend:1.0.0
$DC stop; $DC rm -f
$DC up -d
sleep 15
$DC ps                                    # Up (healthy)
curl -sI http://127.0.0.1:5080/ | head -1 # HTTP/1.1 200 OK
```

**5. nginx y SSL** (solo la primera vez). El DNS A de `dev.nio.novadrivingone.net` debe apuntar al servidor.
No borrar otros vhosts. Se detiene solo si el DNS aún no resuelve:

```bash
getent hosts dev.nio.novadrivingone.net && \
cat > /etc/nginx/sites-available/nio-front <<'EOF'
# contenido de nginx.host.conf (de este repo)
EOF
ln -sf /etc/nginx/sites-available/nio-front /etc/nginx/sites-enabled/nio-front && \
nginx -t && systemctl reload nginx && \
certbot --nginx -d dev.nio.novadrivingone.net && \
curl -sI https://dev.nio.novadrivingone.net/ | head -1
```

Sustituir la línea `# contenido de nginx.host.conf...` por el contenido real de `nginx.host.conf`. Elegir **redirect** a HTTPS en certbot.

### C. Actualizar (cada versión nueva)

1. En tu PC, publicar la versión (sección **A**) y esperar el ✅.
2. En el servidor:

```bash
cd ~/NovaInOut
DC="docker-compose --env-file front.env -f front.yml -p nio-front"
sed -i 's/^FRONT_IMAGE_TAG=.*/FRONT_IMAGE_TAG=1.0.3/' front.env     # la versión nueva
$DC pull
$DC stop; $DC rm -f          # obligatorio en docker-compose v1 (bug ContainerConfig)
$DC up -d
sleep 15
$DC ps
```

3. En el navegador, recargar con Ctrl+Shift+R (el `index.html` no se cachea, pero ayuda con service workers/extensiones).

### D. Rollback

Poner la versión anterior en `FRONT_IMAGE_TAG` y repetir `pull`, `stop`, `rm -f` y `up -d`.

### Problemas frecuentes

| Síntoma | Causa y solución |
|---|---|
| `docker: unknown command: docker compose` | Usar `docker-compose` (con guion). |
| `pull` → `denied` | Login con otra cuenta o token sin `read:packages`. Repetir el login con `novadrivingschool`. |
| `pull` → `manifest unknown` | Esa versión no existe: la Action no terminó o falta `git push origin vX.Y.Z`. |
| `ContainerConfig` al hacer `up -d` | Hacer `$DC stop; $DC rm -f` antes del `up -d`. |
| `all predefined address pools have been fully subnetted` | `front.yml` usa `network_mode: bridge` para no crear red nueva. |
| La web llama a `localhost` o a otra URL | Las URLs van horneadas: revisar las Variables de Actions y publicar versión nueva. |
| 404 al recargar una ruta (`/dashboard`) | Falta el fallback SPA: revisar `nginx.conf` (`try_files ... /index.html`). |
| Error CORS en el navegador | CORS se configura en las APIs, no aquí; revisar `main.ts` del backend/auth. |

---

# RUN
npm run dev

# Git
git fetch origin
git merge origin/main


# CLONE
git clone github-beestomer:beestomer/crm_flowly.git


<route lang="json">
{ "meta": { "auth": true } }
</route>


<route lang="json">
{ "meta": { "auth": true, "roles": ["admin"] } }
</route>


git reset --hard HEAD

git fetch origin
git reset --hard origin/main
