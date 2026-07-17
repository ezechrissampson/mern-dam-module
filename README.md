# Enterprise File & Media Management Module (MERN DAM)

A production-ready, reusable **Digital Asset Management (DAM)** module for MERN
applications — CMS platforms, SaaS products, CRMs, LMS platforms, marketplaces,
admin dashboards, ecommerce, ERP, and fintech products.

This module manages **all media and document assets** for a host application
that already has its own Authentication and Authorization. It is designed to
be dropped into an existing Express + MongoDB backend and an existing React
frontend with minimal wiring.

---

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Folder Structure](#folder-structure)
4. [Installation](#installation)
5. [Integration Guide](#integration-guide)
6. [Configuration / Environment Variables](#configuration--environment-variables)
7. [Storage Adapter Architecture](#storage-adapter-architecture)
8. [Cloudinary Configuration](#cloudinary-configuration)
9. [Amazon S3 Configuration](#amazon-s3-configuration)
10. [API Documentation](#api-documentation)
11. [Metadata System](#metadata-system)
12. [Image Processing Pipeline](#image-processing-pipeline)
13. [Security Features](#security-features)
14. [Permissions Model](#permissions-model)
15. [Database Schema](#database-schema)
16. [Deployment Guide](#deployment-guide)
17. [Production Checklist](#production-checklist)
18. [Extension Guide](#extension-guide)
19. [Future Roadmap](#future-roadmap)

---

## Features

**Dashboard** — total assets, images/documents/videos/audio counts, folder
count, storage used, uploads today/this month, recent uploads, largest
files, unused/orphaned files, live storage-provider health, quick actions.

**Media Library** — grid & list views, pagination, instant search, filters
(type, visibility, size, folder, uploader, unused, favorites), sorting,
bulk selection, drag-and-drop upload, responsive thumbnails, folder
navigation, hover quick-actions.

**Folder Management** — nested folders, breadcrumb navigation, rename,
move (with descendant path cascade), delete (with in-use confirmation),
per-folder statistics, favorites.

**Upload Manager** — single & multiple uploads, drag-and-drop, per-file
progress, retry, duplicate detection (SHA-256 content hash), a
purpose-built extension point for chunked/resumable large-file uploads.

**Image Processing** — Sharp-powered resize/crop/rotate/flip/compress/
convert, automatic thumbnail + responsive WebP variant generation,
EXIF stripped by default, watermark hook.

**Media Details Panel** — full metadata, technical properties, public
URL with one-click copy, usage tracking, and version history with
rollback, all in one drawer.

**Editing & Metadata** — display name, description, alt text, caption,
SEO title, copyright, license, photographer, tags, categories, folder,
visibility (public/private/protected), custom metadata bag.

**Search & Filters** — MongoDB text index across filename, description,
alt text, caption; filters for type, extension, folder, uploader,
storage provider, size range, date range, visibility, unused, favorites.

**Bulk Operations** — delete, restore, move, tag, archive, export
metadata (JSON), with "asset in use" confirmation safeguards.

**Usage Tracking** — host app calls a simple API to register/release
where an asset is used (blog, product, page, email, banner, profile,
CMS, or custom); deletion is blocked (with override) while in use.

**Versioning** — every replace/edit is recorded; compare, restore, or
roll back to any prior version.

**Security** — OWASP-aligned: magic-number file signature verification,
MIME allowlist, blocked extension list, filename randomization, SVG
sanitization, PDF structural validation, pluggable virus-scan hook,
rate limiting, Mongo-injection sanitization, HPP protection, audit
logging, centralized error handling, signed/private URLs.

**Recycle Bin** — soft delete with a scheduled purge job past a
configurable retention window.

**Storage Abstraction** — Cloudinary (primary), Amazon S3, and a local
disk adapter for development, all behind one interface, selected purely
by environment variable.

---

## Tech Stack

**Frontend:** React 19, Vite, Bootstrap 5, Bootstrap Icons, React Icons,
React Router DOM, Axios.

**Backend:** Node.js, Express.js, MongoDB, Mongoose.

**Cloud Storage:** Cloudinary (primary), Amazon S3 (secondary adapter),
local disk (dev-only adapter).

**Supporting libraries:** multer, sharp, file-type, mime-types,
express-validator, helmet, compression, cors, dotenv, uuid/nanoid,
express-rate-limit, express-mongo-sanitize, hpp, DOMPurify (SVG
sanitization), image-size, pdf-lib, mammoth, xlsx, ioredis.

---

## Folder Structure

```
dam-module/
├── server/
│   ├── src/
│   │   ├── config/          # env, db, redis (no cloudinary.js needed — config lives in env.js)
│   │   ├── constants/        # permissions, file-type taxonomy, error codes
│   │   ├── controllers/      # thin HTTP handlers — no business logic
│   │   ├── errors/           # AppError hierarchy
│   │   ├── jobs/              # scheduled maintenance (trash purge, audit log purge)
│   │   ├── middlewares/       # security, permission, upload, error handling
│   │   ├── models/            # Mongoose schemas (Media, Folder, versions, usage, etc.)
│   │   ├── repositories/      # the only layer that builds Mongoose queries
│   │   ├── routes/v1/         # REST route definitions
│   │   ├── services/          # business logic (upload, media, folder, dashboard, ...)
│   │   ├── storage/            # StorageProvider interface + Cloudinary/S3/Local adapters
│   │   ├── utils/              # filename sanitizer, hashing, pagination, logger
│   │   ├── validators/         # express-validator schemas
│   │   ├── app.js              # Express app assembly (exported for mounted integration)
│   │   └── server.js           # standalone entry point
│   ├── scripts/                # migrate.js, seed.js
│   └── .env.example
└── client/
    ├── src/
    │   ├── api/                # Axios client + one module per resource
    │   ├── components/         # common/, media/, folders/, upload/, dashboard/
    │   ├── context/            # ToastContext, ConfirmContext
    │   ├── hooks/               # useMedia, useFolderTree, useDashboardStats, ...
    │   ├── pages/                # one file per route, incl. pages/status/*
    │   ├── routes/               # DamRoutes.jsx
    │   └── constants/, utils/
    └── .env.example
```

---

## Installation

```bash
# 1. Clone/copy this module into (or alongside) your existing MERN app
cd dam-module/server
cp .env.example .env        # fill in MongoDB / Cloudinary / Redis values
npm install
npm run migrate             # sync Mongoose indexes
npm run seed                # optional: sample folder structure + tag catalog
npm run dev                 # starts on PORT (default 5001)

cd ../client
cp .env.example .env
npm install
npm run dev                 # starts on 5173, proxies /api to the server
```

Requires Node.js ≥ 18.18, MongoDB ≥ 6, and (optionally) Redis ≥ 6.
Redis is optional in development — the module falls back to a no-op
cache automatically if `REDIS_URL` is unset.

---

## Integration Guide

This module assumes your host application **already has Authentication and
Authorization**. Integration is intentionally limited to five steps:

### 1. Register backend routes

```js
// your existing Express app
import { damRouter, configurePermissionResolver } from './dam-module/server/src/app.js';
import yourAuthMiddleware from './middleware/auth.js';
import { can } from './auth/rbac.js'; // your existing RBAC check

// Tell the DAM module how to check permissions using YOUR system
configurePermissionResolver((user, permission) => can(user, permission));

// Mount behind your existing auth + RBAC middleware
app.use('/api/v1/media-manager', yourAuthMiddleware, damRouter);
```

`req.user` (or `req.auth`, normalized automatically) must be populated by
your auth middleware before it reaches `damRouter`. The module never
implements login, sessions, or tokens itself.

### 2. Connect the existing auth middleware

Already done above — the DAM router is mounted **after** your auth
middleware in the chain, so every request is already authenticated by the
time it reaches DAM controllers.

### 3. Connect the existing RBAC/permission middleware

`configurePermissionResolver()` (above) is the seam. The default resolver
also works out of the box if your `req.user` object exposes either:
- `user.can(permissionString)` → boolean, or
- `user.permissions` → array of permission strings, or
- `user.roles.includes('admin')` → treated as superuser.

Permission keys checked by the module live in
`server/src/constants/permissions.js` (`media.view`, `media.upload`,
`media.edit`, `media.delete`, `media.download`, `media.manage`,
`media.bulk`, `folder.manage`, `metadata.edit`, `storage.settings`).

### 4. Add "Media Manager" to your sidebar

```jsx
import DamSidebar from './dam-module/client/src/components/common/DamSidebar.jsx';
// render <DamSidebar /> inside your existing sidebar, or copy the NAV_ITEMS
// array into your own sidebar component and route to `/media-manager/*`.
```

Then mount the routes under your existing authenticated layout:

```jsx
import DamRoutes from './dam-module/client/src/routes/DamRoutes.jsx';

<Route path="/media-manager/*" element={<DamRoutes />} />
```

Point the client's `VITE_API_BASE_URL` at wherever you mounted the router
(e.g. `/api/v1/media-manager`).

### 5. Configure MongoDB, Cloudinary, Redis, (optionally) S3

Fill out `server/.env` (see [Environment Variables](#configuration--environment-variables)).
If your host app already owns a Mongoose connection, skip `connectDB()`
in `server.js` and just `import '../dam-module/server/src/models/index.js'`
once during your own bootstrap to register the DAM models on your
existing connection.

### 6. Run migrations / seed

```bash
npm run migrate   # syncs indexes for all DAM collections — safe to re-run
npm run seed      # optional demo data
```

That's it — no application-specific code is required anywhere inside
`dam-module/`. Storage providers, permission checks, and mounting all go
through the seams above.

---

## Configuration / Environment Variables

See `server/.env.example` for the full, commented list. Highlights:

| Variable | Purpose |
|---|---|
| `STORAGE_PROVIDER` | `cloudinary` \| `s3` \| `local` — selects the active adapter |
| `MONGO_URI` | MongoDB connection string |
| `REDIS_URL` | Optional; enables metadata/search/dashboard caching |
| `CLOUDINARY_*` | Cloudinary credentials + root folder |
| `AWS_*` | S3 credentials, bucket, signed URL expiry |
| `MAX_UPLOAD_SIZE_MB` / `MAX_FILES_PER_REQUEST` | Upload limits |
| `ALLOWED_MIME_TYPES` / `BLOCKED_EXTENSIONS` | Upload allow/deny lists |
| `RATE_LIMIT_*` | API + upload rate limiting |
| `SIGNED_URL_SECRET` | Used for module-level signed URL flows |
| `VIRUS_SCAN_ENABLED` / `VIRUS_SCAN_*` | Optional ClamAV integration |
| `AUDIT_LOG_RETENTION_DAYS` | AuditLog purge window |

Client (`client/.env.example`):

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Base path for the DAM API (relative or absolute) |

---

## Storage Adapter Architecture

Every provider implements `StorageProvider` (`server/src/storage/StorageProvider.js`):

```js
upload({ buffer, filename, folder, mimeType }) → { publicId, url, secureUrl, bytes, ... }
delete(publicId, resourceType)
rename(fromPublicId, toPublicId, resourceType)
getSignedUrl(publicId, options)
getTransformedUrl(publicId, transformOptions)
healthCheck()
```

`storageFactory.js` maps `STORAGE_PROVIDER` to a concrete class. **No other
file in the codebase imports a provider directly** — services and
controllers only ever call `getStorageProvider()`. To add a new provider
(Azure Blob, GCS, Backblaze B2, ...):

1. Create `server/src/storage/providers/MyProvider.js extends StorageProvider`.
2. Implement every method above.
3. Register it in `storageFactory.js`'s `registry`.
4. Set `STORAGE_PROVIDER=myprovider`.

No application code changes required.

---

## Cloudinary Configuration

1. Create a Cloudinary account and note your Cloud Name, API Key, and API
   Secret from the dashboard.
2. Set in `server/.env`:
   ```
   STORAGE_PROVIDER=cloudinary
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   CLOUDINARY_ROOT_FOLDER=dam
   ```
3. All uploads are namespaced under `CLOUDINARY_ROOT_FOLDER/<your folder
   path>`, keeping the module's assets isolated from any other Cloudinary
   usage in the same account.
4. Resource type is inferred automatically: images → `image`, video/audio
   → `video` (Cloudinary's convention), everything else → `raw`.
5. Responsive derivatives (thumbnail + breakpoint WebP variants) are
   generated server-side via Sharp and uploaded as separate assets under
   `<folder>/derivatives` — this keeps delivery URLs stable and avoids
   relying on Cloudinary's paid on-the-fly transformation quota, while
   still letting you switch to Cloudinary `eager` transformations by
   passing a `transformation.eager` array into `provider.upload()` if
   preferred.

---

## Amazon S3 Configuration

```
STORAGE_PROVIDER=s3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=your-bucket
AWS_S3_PUBLIC_BASE_URL=https://cdn.yourapp.com   # e.g. a CloudFront distribution
```

Objects are uploaded with `ServerSideEncryption: AES256`. Private/protected
assets should be served exclusively through `getSignedUrl()` rather than
the raw bucket URL — the Media Details panel's "Public URL" field
switches to a signed URL automatically for non-public visibility once you
wire `visibility !== 'public'` through to a signed-URL request on the
client (extension point — see below).

---

## API Documentation

Base path: `/api/v1` (configurable via `API_PREFIX`, or wherever you mount
`damRouter`). All responses use a consistent envelope:

```json
{ "success": true, "data": { }, "meta": { } }
{ "success": false, "code": "VALIDATION_ERROR", "message": "...", "details": [] }
```

### Media
| Method | Route | Description |
|---|---|---|
| GET | `/media` | List/search/filter/paginate |
| GET | `/media/favorites` | Current user's favorites |
| GET | `/media/:id` | Get one asset |
| PATCH | `/media/:id` | Update metadata |
| PATCH | `/media/:id/tags` | Replace tags |
| PATCH | `/media/:id/move` | Move to folder |
| POST | `/media/:id/favorite` | Toggle favorite |
| POST/GET/DELETE | `/media/:id/usage` | Record/list/release usage |
| DELETE | `/media/:id?force=true` | Soft delete (Recycle Bin) |
| POST | `/media/:id/restore` | Restore from Recycle Bin |
| DELETE | `/media/:id/permanent` | Permanent delete (irreversible) |
| PUT | `/media/:id/replace` | Replace file (new version) |
| GET | `/media/:id/versions` | Version history |
| POST | `/media/:id/versions/:n/restore` | Roll back to version n |
| POST | `/media/bulk/{delete,restore,move,tags,archive,export-metadata}` | Bulk ops |

### Uploads
| Method | Route |
|---|---|
| POST | `/uploads/single` |
| POST | `/uploads/multiple` |
| POST | `/uploads/chunk`, `/uploads/chunk/complete` | Extension point (see below) |

### Folders
`GET /folders/tree`, `GET /folders/:id/breadcrumb`, `POST /folders`,
`PATCH /folders/:id/rename`, `PATCH /folders/:id/move`,
`POST /folders/:id/favorite`, `DELETE /folders/:id?cascade=true`.

### Dashboard & Activity
`GET /dashboard/stats`, `GET /dashboard/storage-chart`, `GET /activity`.

Every route is permission-gated per the [Permissions Model](#permissions-model)
and validated with `express-validator` before reaching a controller.

---

## Metadata System

Frequently-edited metadata (display name, description, alt text, caption,
SEO title, copyright, license, photographer, custom key/value bag) is
embedded directly on the `Media` document for fast list-view reads.
Heavier, append-only concerns live in their own collections:
`MediaVersion` (history), `MediaTag` (normalized tag catalog),
`MediaUsage` (where an asset is referenced), `MediaFavorite`,
`MediaActivity` (UX-facing feed), `MediaPermission` (optional per-asset
ACL), and `AuditLog` (security/compliance trail).

EXIF is stripped by Sharp's `.rotate()` (auto-orients, then drops
orientation metadata) during thumbnail/variant generation; only a
minimal, explicitly-allowlisted subset is ever surfaced to the
application layer (see `imageProcessingService.sanitizeExif`).

---

## Image Processing Pipeline

`services/imageProcessingService.js`, built on Sharp:

1. **On upload:** read dimensions/format, auto-orient, strip EXIF.
2. **Thumbnail:** 320×320 `cover` crop, WebP, quality 80.
3. **Responsive variants:** sm/md/lg/xl breakpoints (never upscaled),
   WebP by default, AVIF/JPEG available via `formats` option.
4. **On-demand transform:** resize, crop, rotate, flip/flop, format
   conversion (`webp`/`avif`/`png`/`jpeg`), quality control.
5. **Watermark:** composite a logo/text image at a configurable gravity
   and opacity.
6. **Original is always preserved** — variants are additional assets, not
   replacements.

---

## Security Features

Implemented, aligned with OWASP guidance:

- **File-signature (magic number) verification** via `file-type`, checked
  against the declared `Content-Type` — rejects a renamed `.exe`
  masquerading as `.png`.
- **MIME allowlist** + **blocked-extension list**, both env-configurable.
- **Filename sanitization & randomization** (`nanoid`-suffixed, diacritics
  stripped, path separators removed) — prevents traversal/overwrite.
- **SVG sanitization** via DOMPurify (`svg` profile) before storage —
  strips `<script>`, `on*` handlers, `foreignObject`.
- **PDF structural validation** via `pdf-lib` (rejects corrupted/invalid PDFs).
- **Pluggable virus-scan hook** (ClamAV INSTREAM client included, disabled
  by default; swap in a cloud AV API by replacing one function).
- **Rate limiting** — general API limiter + a stricter upload-specific limiter.
- **Mongo-injection protection** via `express-mongo-sanitize`.
- **HTTP Parameter Pollution protection** via `hpp`.
- **XSS protection** — SVG sanitization + `helmet` + no HTML metadata rendering.
- **Mass-assignment protection** — every mutating endpoint has an explicit
  express-validator allowlist; service layer copies only known fields.
- **Signed / private URLs** for `s3`/Cloudinary `protected` visibility assets.
- **Centralized error handling** — no stack traces leak in production.
- **Audit logging** — every delete, permission failure, and bulk operation
  is recorded to `AuditLog` with actor/IP/user-agent.
- **Secure logging** — Winston, structured JSON in production, never logs
  raw file buffers or auth tokens.
- **No direct filesystem exposure** — uploads are buffered in memory and
  handed to the active storage provider; the `local` adapter (dev-only)
  is the only one that touches disk, and it isn't served by Express
  directly in a way that walks arbitrary paths.
- **Environment validation** — the process exits at boot if required env
  vars are missing.

---

## Permissions Model

Declared in `server/src/constants/permissions.js`:

```
media.view · media.upload · media.edit · media.delete · media.download
media.manage · media.bulk · folder.manage · metadata.edit · storage.settings
```

The module does not implement RBAC — see [Integration Guide](#integration-guide)
step 3 for wiring these into your existing authorization system.

---

## Database Schema

Collections: `Media`, `Folder`, `MediaVersion`, `MediaTag`, `MediaUsage`,
`MediaFavorite`, `MediaActivity`, `MediaPermission`, `AuditLog`. All
timestamped (`createdAt`/`updatedAt`), all mutation-tracked
(`createdBy`/`updatedBy` where applicable), soft-delete via
`isDeleted`/`deletedAt` on `Media` and `Folder`. Indexes: text index on
`Media` (displayName/description/altText/caption), compound indexes on
`(folder, status, isDeleted)` and `(category, status, isDeleted)`, unique
indexes on `Folder.path`, `MediaFavorite(media, user)`,
`MediaUsage(media, contentType, contentId, fieldName)`. Run
`npm run migrate` to sync indexes explicitly (recommended in production,
where Mongoose `autoIndex` should be disabled).

---

## Deployment Guide

**Docker Compose** (reference stack, `docker-compose.yml` at repo root):

```bash
docker compose up --build
```

Brings up MongoDB, Redis, the API server, and an Nginx-served static
build of the client, wired together. In a real integration, replace the
`server` service with your existing host application's own container/
image (which mounts `damRouter`).

**Manual deployment:**
1. `server`: `npm ci --omit=dev`, set all required env vars, `npm run
   migrate`, run behind a process manager (PM2/systemd) or as a container;
   put it behind a reverse proxy (Nginx/ALB) that terminates TLS.
2. `client`: `npm run build`, serve the `dist/` folder as static assets
   (Nginx, S3+CloudFront, Vercel, etc.), proxy `/api` to the server.
3. Provision MongoDB (Atlas or self-hosted) and Redis (ElastiCache or
   self-hosted) — Redis is optional but strongly recommended in
   production for dashboard/list caching.
4. Set `NODE_ENV=production` — this disables the dev-only local storage
   convenience paths and enables JSON structured logging.

---

## Production Checklist

- [ ] `NODE_ENV=production`
- [ ] `STORAGE_PROVIDER` set to `cloudinary` or `s3` (never `local`)
- [ ] All Cloudinary/S3 credentials set via secret manager, not committed
- [ ] `SIGNED_URL_SECRET` rotated from the default placeholder
- [ ] `REDIS_URL` configured (dashboard/list caching)
- [ ] `RATE_LIMIT_*` tuned for expected traffic
- [ ] `VIRUS_SCAN_ENABLED=true` with a reachable ClamAV daemon (or swap
      in your cloud AV provider) if the compliance posture requires it
- [ ] Mongoose `autoIndex` disabled; `npm run migrate` run as part of CI/CD
- [ ] `npm run seed` **not** run against production data
- [ ] A scheduler (cron/Agenda/k8s CronJob) wired to
      `jobs/purgeTrash.js` and `jobs/purgeAuditLogs.js`
- [ ] `configurePermissionResolver()` wired to your real RBAC, not the
      default fallback
- [ ] `MAX_UPLOAD_SIZE_MB` matches your reverse proxy's own body-size limit
- [ ] TLS terminated in front of both `server` and `client`
- [ ] CORS `CLIENT_URL` restricted to your real frontend origin(s)
- [ ] Structured logs shipped to your log aggregator; alerts on 5xx rate
- [ ] AuditLog retention matches your compliance requirements

---

## Extension Guide

**Add a storage provider:** see [Storage Adapter Architecture](#storage-adapter-architecture).

**Chunked / resumable uploads:** `routes/v1/upload.routes.js` exposes
`POST /uploads/chunk` and `/uploads/chunk/complete` as stubs (501 by
default). Recommended implementation: buffer chunks against a
per-upload-id key in Redis (or a temp file for local dev) until all
chunks arrive, then hand the assembled buffer to
`uploadService.uploadSingleFile()` unchanged — or, for very large files,
use S3 multipart upload / Cloudinary's large-file upload API directly
and skip buffering entirely.

**Custom upload processing step:** add it inside
`services/uploadService.js#uploadSingleFile` — that function is the
single funnel every upload passes through (validation → scan →
dedup → storage → variants → persistence → activity log).

**New file type support:** extend `MIME_CATEGORY_MAP` in
`constants/fileTypes.js`, add the MIME type to `ALLOWED_MIME_TYPES`, and
(if it needs structural validation like PDF) add a case in
`fileValidationService.js`.

**Video/audio support:** the schema, dashboard counters, and category
taxonomy are already future-ready (`ASSET_CATEGORY.VIDEO/AUDIO`,
Cloudinary resource-type inference already maps them to `video`). Add
transcoding/thumbnail-frame-extraction as a new step in
`uploadService.js` when ready.

**Swap the cache layer:** `config/redis.js` exposes a small `{get, set,
del, keys, flushPattern}` interface — implement the same shape against
any other cache and swap the export.

**Different chart library:** `components/dashboard/CategoryBarChart.jsx`
is a minimal dependency-free bar chart; swap in recharts/chart.js if the
host app already depends on one.

---

## Future Roadmap

- Native video/audio transcoding + thumbnail-frame extraction
- Chunked resumable upload reference implementation (S3 multipart)
- Per-field EXIF/GPS display (currently sanitized to a presence flag)
- Fine-grained `MediaPermission` enforcement in the permission middleware
  (currently modeled in the schema, not yet enforced in `requirePermission`)
- AI-assisted alt-text generation hook
- WebSocket-based real-time upload/activity feed
- Multi-tenant folder-root isolation helper
