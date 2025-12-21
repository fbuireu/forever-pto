# Debug Error 1101 - Worker Crashed

El error 1101 significa que el Worker lanzó una excepción JavaScript no capturada.

## Paso 1: Ver logs en tiempo real

Ejecuta en tu terminal:

```bash
npx wrangler tail
```

Luego abre tu sitio en el navegador y navega a cualquier página.

**Copia el stack trace completo que aparezca**, especialmente el campo `exceptions`.

## Paso 2: Verificar que las env vars están configuradas

Ejecuta:

```bash
npx wrangler secret list
```

Deberías ver:
- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`
- `STRIPE_SECRET_KEY`
- `JWT_SECRET`
- `RESEND_API_KEY`
- `STRIPE_WEBHOOK_SECRET`

Si alguna falta, agrégala con:
```bash
npx wrangler secret put NOMBRE_DE_LA_VAR
```

## Paso 3: Test endpoint mínimo

Prueba acceder a:
```
https://tu-worker.workers.dev/api/health
```

Si este endpoint también tira 1101, el problema es la inicialización de los clientes globales.

---

**Necesito que ejecutes el Paso 1 y copies TODOS los logs que aparezcan.**
