# infrastructure/services/location

## Purpose

Multi-strategy country detection. Returns an ISO 3166-1 alpha-2 country code using three strategies in priority order, falling back gracefully if any step fails.

## Detection chain

```
CDN trace (Cloudflare /cdn-cgi/trace)
  └─ fails / unavailable
     → HTTP headers (CF-IPCountry header)
        └─ missing / filtered
           → IP geolocation (ipify + ipinfo.io)
```

- **CDN** (`utils/detectCountryFromCDN.ts`): fetches `https://www.cloudflare.com/cdn-cgi/trace`, 5 s timeout. Most reliable in production (Cloudflare edge).
- **Headers** (`utils/detectCountryFromHeaders.ts`): reads `CF-IPCountry` request header. Filters out `T1` (Tor) and `XX` (unknown).
- **IP fallback** (`utils/detectCountryFromIP.ts`): calls ipify to get the public IP, then ipinfo.io for the country. Two external round-trips; last resort only.

## Non-obvious details

- `T1` and `XX` codes from Cloudflare indicate Tor exit nodes and unidentified traffic — they are filtered out so the UI does not attempt to load holidays for non-countries.
- The CDN strategy is tried client-side (browser fetch) even on SSR — it will fail in server context where `window` is unavailable. This is expected and the chain continues.
- All three strategies are plain async functions (no Effect) — they are called from a server action / middleware context where no layer is available.
