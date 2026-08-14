# Nginx & Cloudflare

## Nginx Routing (architecture plan §11)
```nginx
server {
  listen 443 ssl;
  server_name example.com;

  location / {
    proxy_pass http://web:4200;
  }
  location /admin {
    proxy_pass http://admin:4200;
  }
  location /api {
    proxy_pass http://api:3000;
  }

  # Security headers
  add_header X-Content-Type-Options nosniff;
  add_header X-Frame-Options DENY;
  add_header Referrer-Policy strict-origin-when-cross-origin;

  # Defense-in-depth rate limiting (Cloudflare's edge rules are the primary defense)
  limit_req zone=api_limit burst=20 nodelay;
}
```
- Only Nginx is reachable from outside the Docker network — `web`, `admin`, `api` should not publish ports directly to the host once Nginx is in place.
- Compression, connection handling, and static asset serving for `/assets` also live here per §11 — add as needed, don't duplicate what Cloudflare's CDN already caches.

## Cloudflare Setup (architecture plan §12)
1. **DNS**: point the domain (and `www`) at the VPS's public IP with the proxy ("orange cloud") **on**.
2. **TLS**: set SSL/TLS mode to **Full (strict)**. Generate a Cloudflare **Origin CA** certificate (Cloudflare dashboard) and install it in Nginx — this is a different certificate from a normal publicly-trusted one; it's only for the Cloudflare-to-origin leg.
3. **Rate limiting split** — not duplicated effort between the two layers:
   - **Cloudflare** (edge, free-tier rules): first line of defense, stops abuse before it reaches the VPS at all. Add rules for sensitive paths like `/api/auth/*`.
   - **Nginx** (origin, `limit_req` above): defense-in-depth fallback only, in case traffic reaches the origin directly or Cloudflare is bypassed.
4. **WAF**: enable the free-plan managed rules where useful.

## Domain Strategy
Serve the API under `example.com/api/*` rather than a separate `api.example.com` subdomain — keeps the architecture simple and avoids unnecessary cross-origin concerns (per §12).
