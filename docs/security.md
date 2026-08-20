# Security review

Last reviewed: 2026-08-20.

## Controls present

- Secrets are backend-only environment variables and tracked `.env` files are excluded.
- Production configuration rejects incomplete PostgreSQL URLs, plaintext database connections, weak IP hashing secrets, and non-HTTPS external origins.
- CORS uses an explicit allowlist rather than reflection or wildcards.
- Admin passwords use Argon2id and admin sessions are random, hashed, server-side, revocable, and time-limited.
- Authorization distinguishes administrator and super-administrator operations.
- Login and public lead submissions are rate-limited without writing client addresses to application logs.
- Request bodies, pagination, enums, coordinates, URLs, and uploaded media are validated.
- Google Maps resolution restricts redirects and final hosts to Google domains before extracting Addis Ababa coordinates.
- Uploads use detected MIME types, generated storage names, configured size limits, and a dedicated storage directory.
- Database queries use pgx parameters; no request value is concatenated into SQL.
- Security headers disable framing, MIME sniffing, sensitive browser capabilities, and cross-domain policy files.
- Admin pages set `noindex, nofollow` metadata.

## Operational requirements

- Put all production secrets in Railway variables and rotate any value ever pasted into chat, source code, screenshots, or logs.
- Attach and back up the Railway media volume. A database backup does not include uploaded files.
- Keep `AUTO_MIGRATE=false` in multi-instance production and run `/aspio-migrate` as the release command.
- Use exact Vercel production and preview origins in `CORS_ALLOWED_ORIGINS`.
- Verify the Resend sender domain and monitor delivery jobs that reach `dead` status.
- Create administrators with `cmd/admin`; remove `ASPIO_ADMIN_PASSWORD` immediately after use.
- Review dependency updates and CI results before deployment.

## Known scaling limits

- API rate limiting is process-local. Move it to a shared store before running multiple API replicas.
- Media uses one mounted filesystem. Move the `internal/media` implementation to object storage before horizontal scaling.
- Browser admin tokens live in `sessionStorage`. The current framing and injection controls are important; a stricter nonce-based Content Security Policy should be added before introducing third-party scripts.
- Railway and PostgreSQL backups, monitoring, alerting, and incident ownership are deployment responsibilities rather than source-code features.

No hard-coded production credential was found in tracked files during this review. Example development credentials remain clearly marked in Compose, tests, and `.env.example` only.

The frontend dependency audit reported zero vulnerabilities. `govulncheck` reported zero reachable Go vulnerabilities; it also reported GO-2026-5932 against the unmaintained `golang.org/x/crypto/openpgp` package, but this backend does not import or call that package. The backend uses the maintained Argon2 implementation from the same module.
