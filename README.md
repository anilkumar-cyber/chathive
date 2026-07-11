# ChatiHive

A modern, real-time chat platform — private/group messaging, public topic rooms, friends, notifications, and more. Built as a production-oriented monorepo with a strong security and testing baseline. Voice/video calling, Stories, and the full admin dashboard UI are intentionally scoped as **Phase 2** (see [Roadmap](#roadmap)); everything else below is implemented and working.

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, TypeScript, Tailwind CSS, Framer Motion, Zustand, React Router, Socket.io client |
| Backend | Node.js, Express, TypeScript, Socket.io, JWT (access + rotating refresh), REST |
| Database | MongoDB + Mongoose |
| Cache / scaling | Redis (Socket.io adapter for multi-instance broadcast) |
| Storage | Cloudinary (images/video/audio/docs) |
| Push | Firebase Cloud Messaging (optional) |
| Deployment | Docker, Nginx, PM2 |

## Monorepo layout

```
packages/
  shared/   # Types, enums, socket event names, constants — used by both client & server
  server/   # Express API + Socket.io + Mongoose models
  client/   # React SPA (Vite)
```

## Quick start (local, no Docker)

Prerequisites: Node 20+, a MongoDB instance (local or Atlas), optionally Redis.

```bash
npm install                      # installs all workspaces
cp .env.example .env             # fill in MONGO_URI at minimum
npm run build --workspace=packages/shared
npm run seed --workspace=packages/server   # optional demo data (see below)
npm run dev                      # runs server (:5000) + client (:5173) concurrently
```

Demo login after seeding: `alice@chatihive.app` / `Password123` (same password for `bob`, `carol`, `dave`; `admin@chatihive.app` is role `admin`).

Swagger docs: `http://localhost:5000/api-docs`

## Quick start (Docker Compose)

```bash
cp .env.example .env             # fill in secrets
docker compose up --build
```

- Client: `http://localhost:8080`
- API (direct): `http://localhost:5000`
- Mongo and Redis run as their own containers with named volumes.

The client's Nginx container reverse-proxies `/api/*` and `/socket.io/*` to the server container, so the browser only ever talks to one origin.

## Environment variables

See `.env.example` for the full list. Everything third-party is optional and degrades gracefully when unset:

- **No Cloudinary keys** → file/avatar uploads return a clear 400 instead of crashing.
- **No SMTP config** → verification/reset emails are logged to the server console instead of sent (useful for local dev).
- **No Google OAuth keys** → the `/auth/google*` routes simply aren't mounted; the "Continue with Google" button still renders but points at a route that 404s until configured.
- **No Firebase keys** → push notifications are silently skipped; in-app/socket notifications still work.
- **No `REDIS_URL`** → Socket.io runs single-instance (fine for one server process); set it for horizontal scaling.

## What's implemented (Phase 1 — Core MVP)

**Auth**: register/login with validation, JWT access tokens + rotating refresh tokens (reuse detection revokes the whole token family), "remember me", email verification, forgot/reset password, Google OAuth (behind env flag), TOTP 2FA (QR setup via `otplib`/`qrcode`), account lockout after repeated failed logins.

**Profile**: avatar/cover upload (Cloudinary), bio/age/gender/location/languages/interests/profession, online status (online/away/busy/invisible) with real-time presence broadcast to friends, last seen, profile privacy levels.

**Chat**: 1:1 and group messaging over Socket.io with a REST fallback/history API, typing indicators, delivered/read receipts, emoji reactions, replies, edit/delete (for me / for everyone), pin messages, message search, image/video/audio/document sharing with drag-and-drop upload, profanity filtering against an admin-managed blocklist.

**Groups**: create/edit, member management with owner/admin/member roles, leave group, group avatar.

**Public rooms**: category-based (general, tech, gaming, music, AI, programming, etc.), create custom rooms, join/leave, search/filter.

**Friends**: send/accept/reject/cancel requests, remove, block, mute, best friends.

**Notifications**: real-time via Socket.io + persisted history, friend requests, mentions, message alerts; FCM push when configured.

**Security**: Helmet, CORS allowlist, rate limiting (auth/password-reset/messages tiered separately), mongo-sanitize, xss-clean, hpp, bcrypt password hashing, Zod input validation everywhere, IP/device block list, audit log for admin actions, 2FA.

**Admin API**: dashboard stats, user ban/suspend, report review, blocked-word management, room moderation, audit log — REST endpoints are complete; a dedicated admin UI is Phase 2 (use the Postman collection or Swagger to drive it today).

**Other**: dark/light/system theme, PWA (installable, offline app-shell caching), responsive layout down to mobile, toast notifications, skeleton loading states, glassmorphism UI.

## Roadmap (Phase 2)

- WebRTC voice/video calling (signaling scaffolding already exists in `sockets/call.handlers.ts` and `SocketEvents.CALL_*`; needs the peer-connection/UI layer, TURN server, screen share, background blur, recording).
- Stories (24h expiring image/video posts + views/reactions).
- Full admin dashboard UI (analytics charts, revenue, server status/logs viewer — APIs exist, UI doesn't yet).
- Message translation / auto language detection, AI chatbot, scheduled messages, polls, events, location sharing, QR login, multi-device session list, chat import/export/backup.

## Testing

```bash
npm run test --workspace=packages/server
```

Uses Jest + Supertest + `mongodb-memory-server` (no real DB needed). Covers auth flow (register/verify/login/lockout/refresh), messaging (send/history/access-control/edit-permissions), and the friend request lifecycle.

## API documentation

- **Swagger/OpenAPI**: live at `/api-docs` when the server is running (JSON at `/api-docs.json`).
- **Postman**: import [`docs/postman_collection.json`](docs/postman_collection.json). Run "Login" first — its test script saves `accessToken`/`userId` into collection variables that every other request reuses.

## Scaling notes

- Socket.io is wired with `@socket.io/redis-adapter` when `REDIS_URL` is set, so events fan out correctly across multiple server instances/containers.
- PM2's `ecosystem.config.js` supports cluster mode (`PM2_INSTANCES=max`), but Socket.io's polling handshake needs to land on the same worker before upgrading — see the `ip_hash` note in `nginx/nexuschat.conf` if you run cluster mode behind Nginx directly (not needed for the default single-instance Docker Compose setup).
- Presence (`online`/`offline`) is derived from `User.status` in Mongo, which every instance updates, so it stays correct regardless of which instance a socket connects to.

## Security notes for production

- Rotate `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` / `COOKIE_SECRET` — the `.env.example` placeholders are for local dev only.
- Put the API behind HTTPS (Nginx + Let's Encrypt/certbot) — cookies are marked `secure` automatically when `NODE_ENV=production`.
- The in-memory IP/device block list (`middlewares/security.middleware.ts`) is per-process; move it to Redis before running multiple server instances.
