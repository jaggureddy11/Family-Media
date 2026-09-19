# Kutumbam · కుటుంబం — Security & API Route Access Control Matrix

**Generated automatically from active source code in `src/app/api`**.

## 1. Access Control Matrix

| Route Path | HTTP Methods | Required Role / Access Level | Source File | Purpose & Description |
|---|---|---|---|---|
| `/api/admin/albums` | `GET, POST, PATCH, DELETE` | **Admin Only** | [`src/app/api/admin/albums/route.ts`](file:////Users/apple/Desktop/PROJECTS/Family media/src/app/api/admin/albums/route.ts) | Admin album creation, renaming, cover assignment, bulk items add/remove |
| `/api/admin/devices` | `GET, POST` | **Admin Only** | [`src/app/api/admin/devices/route.ts`](file:////Users/apple/Desktop/PROJECTS/Family media/src/app/api/admin/devices/route.ts) | Active device listing and immediate revocation |
| `/api/admin/family` | `GET, POST` | **Admin Only** | [`src/app/api/admin/family/route.ts`](file:////Users/apple/Desktop/PROJECTS/Family media/src/app/api/admin/family/route.ts) | Family member CRUD and accessibility profile preferences |
| `/api/admin/family/create-link` | `POST` | **Admin Only** | [`src/app/api/admin/family/create-link/route.ts`](file:////Users/apple/Desktop/PROJECTS/Family media/src/app/api/admin/family/create-link/route.ts) | Admin administrative control route |
| `/api/admin/files` | `POST, PUT, DELETE` | **Admin Only** | [`src/app/api/admin/files/route.ts`](file:////Users/apple/Desktop/PROJECTS/Family media/src/app/api/admin/files/route.ts) | Admin file/folder mutations (create folder max 3 levels, rename, move, delete) |
| `/api/admin/media` | `GET, POST, PATCH, DELETE` | **Admin Only** | [`src/app/api/admin/media/route.ts`](file:////Users/apple/Desktop/PROJECTS/Family media/src/app/api/admin/media/route.ts) | Admin media editing, metadata update, and deletion |
| `/api/auth/login` | `POST` | **Public** | [`src/app/api/auth/login/route.ts`](file:////Users/apple/Desktop/PROJECTS/Family media/src/app/api/auth/login/route.ts) | Admin passphrase authentication (rate limited, sliding window) |
| `/api/auth/logout` | `POST` | **Session Required** | [`src/app/api/auth/logout/route.ts`](file:////Users/apple/Desktop/PROJECTS/Family media/src/app/api/auth/logout/route.ts) | Signs out current device session |
| `/api/auth/session` | `GET` | **Session Required** | [`src/app/api/auth/session/route.ts`](file:////Users/apple/Desktop/PROJECTS/Family media/src/app/api/auth/session/route.ts) |  |
| `/api/auth/test-session` | `POST, GET` | **Non-Prod Only (404 in Prod)** | [`src/app/api/auth/test-session/route.ts`](file:////Users/apple/Desktop/PROJECTS/Family media/src/app/api/auth/test-session/route.ts) | Test-only session generator for Playwright automation; returns 404 in production |
| `/api/health` | `GET` | **Public** | [`src/app/api/health/route.ts`](file:////Users/apple/Desktop/PROJECTS/Family media/src/app/api/health/route.ts) | Public service liveness & readiness check |
| `/api/media/continue-watching` | `GET` | **Session Required** | [`src/app/api/media/continue-watching/route.ts`](file:////Users/apple/Desktop/PROJECTS/Family media/src/app/api/media/continue-watching/route.ts) |  |
| `/api/media/error-log` | `POST` | **Session Required** | [`src/app/api/media/error-log/route.ts`](file:////Users/apple/Desktop/PROJECTS/Family media/src/app/api/media/error-log/route.ts) | Client-side video playback error logger |
| `/api/media/family-videos` | `GET` | **Session Required** | [`src/app/api/media/family-videos/route.ts`](file:////Users/apple/Desktop/PROJECTS/Family media/src/app/api/media/family-videos/route.ts) | Family videos catalog grouped by year with duration badges |
| `/api/media/favorites` | `POST` | **Session Required** | [`src/app/api/media/favorites/route.ts`](file:////Users/apple/Desktop/PROJECTS/Family media/src/app/api/media/favorites/route.ts) | Toggle per-user favorite status for photos and videos |
| `/api/media/files` | `GET` | **Session Required** | [`src/app/api/media/files/route.ts`](file:////Users/apple/Desktop/PROJECTS/Family media/src/app/api/media/files/route.ts) | Read-only file browser & signed download URLs |
| `/api/media/movies` | `GET` | **Session Required** | [`src/app/api/media/movies/route.ts`](file:////Users/apple/Desktop/PROJECTS/Family media/src/app/api/media/movies/route.ts) | Telugu & English movie catalog with search and watch progress |
| `/api/media/photos` | `GET` | **Session Required** | [`src/app/api/media/photos/route.ts`](file:////Users/apple/Desktop/PROJECTS/Family media/src/app/api/media/photos/route.ts) | Photos timeline (grouped by year/month), albums, and favorites |
| `/api/media/progress` | `POST` | **Session Required** | [`src/app/api/media/progress/route.ts`](file:////Users/apple/Desktop/PROJECTS/Family media/src/app/api/media/progress/route.ts) |  |
| `/api/media/watch/[id]` | `GET` | **Session Required** | [`src/app/api/media/watch/[id]/route.ts`](file:////Users/apple/Desktop/PROJECTS/Family media/src/app/api/media/watch/[id]/route.ts) | Video streaming session, watch progress saving, and signed URL refresh |
| `/api/media/watch/[id]/refresh` | `POST` | **Session Required** | [`src/app/api/media/watch/[id]/refresh/route.ts`](file:////Users/apple/Desktop/PROJECTS/Family media/src/app/api/media/watch/[id]/refresh/route.ts) | Video streaming session, watch progress saving, and signed URL refresh |
| `/api/mock-media` | `GET` | **Non-Prod Only (404 in Prod)** | [`src/app/api/mock-media/route.ts`](file:////Users/apple/Desktop/PROJECTS/Family media/src/app/api/mock-media/route.ts) | Local mock media streaming server for dev/test; returns 404 in production |
| `/api/storage/check-duplicate` | `POST` | **Admin Only** | [`src/app/api/storage/check-duplicate/route.ts`](file:////Users/apple/Desktop/PROJECTS/Family media/src/app/api/storage/check-duplicate/route.ts) | Admin storage and direct upload helpers (presigned URLs, multipart, duplicate check) |
| `/api/storage/multipart/complete` | `POST` | **Admin Only** | [`src/app/api/storage/multipart/complete/route.ts`](file:////Users/apple/Desktop/PROJECTS/Family media/src/app/api/storage/multipart/complete/route.ts) | Admin storage and direct upload helpers (presigned URLs, multipart, duplicate check) |
| `/api/storage/multipart/create` | `POST` | **Admin Only** | [`src/app/api/storage/multipart/create/route.ts`](file:////Users/apple/Desktop/PROJECTS/Family media/src/app/api/storage/multipart/create/route.ts) | Admin storage and direct upload helpers (presigned URLs, multipart, duplicate check) |
| `/api/storage/multipart/sign-part` | `POST` | **Admin Only** | [`src/app/api/storage/multipart/sign-part/route.ts`](file:////Users/apple/Desktop/PROJECTS/Family media/src/app/api/storage/multipart/sign-part/route.ts) | Admin storage and direct upload helpers (presigned URLs, multipart, duplicate check) |
| `/api/storage/presigned-url` | `POST` | **Admin Only** | [`src/app/api/storage/presigned-url/route.ts`](file:////Users/apple/Desktop/PROJECTS/Family media/src/app/api/storage/presigned-url/route.ts) | Admin storage and direct upload helpers (presigned URLs, multipart, duplicate check) |

## 2. Route Separation & Design Reconciliations

1. **/api/media/files vs /api/admin/files**:
   - `/api/media/files` is strictly **read-only** (`GET`) for all family member sessions.
   - All mutations (creating folders, renaming, moving, deleting) are strictly restricted to `/api/admin/files` (`POST`, `PUT`, `DELETE`, requiring `ADMIN` role).

2. **/api/storage/* and /api/admin/upload**:
   - All direct presigned URL generators (`/api/storage/presigned-url`, `/api/storage/multipart`, `/api/storage/check-duplicate`, `/api/admin/upload`) are **Admin Only**.
   - Family members stream and download media only via short-lived signed URLs generated on-demand by session-verified endpoints.

3. **Non-Production Test & Mock Routes**:
   - `/api/auth/test-session` and `/api/mock-media` strictly return `404 Not Found` in production environments.
