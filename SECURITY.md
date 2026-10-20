# Security and deployment

This personal tracker has no user authentication. Keep the default localhost-only published ports. Remote use requires an authenticated reverse proxy or private VPN; do not expose the API, development UI or database directly to the internet.

Copy `.env.example` to `.env` and choose a unique `DB_PASSWORD`. The ignored `.env` file is not committed. Docker Compose refuses to start without the password. Existing PostgreSQL volumes keep their existing database password; updating an environment variable does not rotate a stored database role. Update the role and configuration together before reusing a volume.

The API rate limiter covers all `/api` routes. `RATE_LIMIT_MAX` and `RATE_LIMIT_WINDOW_MS` tune its budget. Proxy headers are untrusted by default. Only set `TRUSTED_PROXIES` to the specific IP addresses or CIDRs of your own reverse proxy. Never trust arbitrary forwarded headers or a wildcard proxy.

Uploads retain the 10 MB limit, with one file and bounded form fields/parts. JSON and URL-encoded bodies are limited to 100 KB. Dependency alerts and CodeQL provide ongoing checks; a clean scan does not replace application review.
