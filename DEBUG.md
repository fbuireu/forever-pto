# Debug Steps

## 1. Ver logs en tiempo real de Cloudflare

```bash
npx wrangler tail --env production
```

Luego en otra terminal, haz una petición a `/api/payment` y copia TODOS los logs que aparezcan.

## 2. O ver logs desde el dashboard

1. Ve a https://dash.cloudflare.com
2. Workers & Pages → forever-pto
3. Logs → Real-time Logs
4. Haz la petición a `/api/payment`
5. Copia el error completo

## 3. Build local para ver errores de compilación

```bash
pnpm run cf:build
```

Si hay errores aquí, cópialos completos.

## 4. Si nada de lo anterior funciona, test mínimo

Reemplaza TEMPORALMENTE `src/app/api/payment/route.ts` con:

```typescript
export async function POST() {
  return new Response('OK from payment API');
}
```

Deploy y prueba si al menos esto funciona.

---

**Necesito ver los logs reales de Cloudflare Workers para saber qué está crasheando.**
