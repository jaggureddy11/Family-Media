# Kutumbam · కుటుంబం — Production Deployment Guide
**Zero-Ops Architecture: Vercel + Neon PostgreSQL + Cloudflare R2**

This guide provides a comprehensive, click-by-click walkthrough to deploy Kutumbam into production.

---

## 1. Cloudflare R2 (Private Zero-Egress Storage)

1. **Log in to Cloudflare Dashboard**:
   - Go to **R2 Storage** > **Create bucket**.
   - Bucket Name: `kutumbam-media` (or your chosen name).
   - Location: Automatic (or closest region).
   - Click **Create Bucket**.

2. **Strict Privacy Check (NON-NEGOTIABLE)**:
   - In your bucket settings, ensure **Public access** is **OFF**.
   - Do **NOT** connect a custom public domain or enable public R2 dev URLs.
   - All media is accessed solely via signed URLs with $\le 2\text{h}$ validity.

3. **Configure CORS**:
   - In bucket **Settings** > **CORS Policy**, add:
     ```json
     [
       {
         "AllowedOrigins": [
           "https://your-kutumbam-domain.vercel.app",
           "https://kutumbam.yourdomain.com",
           "http://localhost:3000"
         ],
         "AllowedMethods": ["GET", "PUT", "HEAD"],
         "AllowedHeaders": ["*"],
         "ExposeHeaders": ["ETag", "Content-Range", "Accept-Ranges"],
         "MaxAgeSeconds": 3600
       }
     ]
     ```

4. **Generate API Tokens**:
   - In R2 Overview > **Manage R2 API Tokens** > **Create API Token**.
   - Permissions: **Object Read & Write**.
   - Specify bucket: `kutumbam-media`.
   - Copy:
     - `Account ID`
     - `Access Key ID`
     - `Secret Access Key`

---

## 2. Neon (Serverless PostgreSQL)

1. **Create Neon Project**:
   - Go to [console.neon.tech](https://console.neon.tech) and create a project named `kutumbam-prod`.
2. **Copy Connection String**:
   - Copy the Pooled Connection String (format: `postgresql://user:password@ep-xyz-pooler.region.neon.tech/neondb?sslmode=require`).
3. **Run Migrations**:
   - From your local terminal (pointing `DATABASE_URL` to your Neon database):
     ```bash
     npx prisma db push
     ```

---

## 3. Generate Admin Passphrase Hash

1. Run the Kutumbam CLI tool:
   ```bash
   npm run hash-passphrase
   ```
2. Enter your strong admin passphrase (e.g. `M0m$F@m1lyM3d1a!2026`).
3. Copy the output bcrypt hash starting with `$2a$12$...` or `$2b$12$...`.

---

## 4. Vercel Deployment

1. **Import Git Repository**:
   - Go to [vercel.com/new](https://vercel.com/new) and select the `Family media` repository.
   - Framework Preset: **Next.js**.
   - Build Command: `next build` (or `npx prisma generate && next build`).
   - Output Directory: `.next`.

2. **Set Environment Variables**:
   Add the following in Vercel Project Settings > **Environment Variables**:

   | Variable Name | Description | Example / Source |
   |---|---|---|
   | `DATABASE_URL` | Neon Postgres pooled connection string | `postgresql://...neon.tech/neondb?sslmode=require` |
   | `R2_ACCOUNT_ID` | Cloudflare Account ID | `a1b2c3d4e5f6...` |
   | `R2_ACCESS_KEY_ID` | Cloudflare R2 Access Key ID | `24-char hex string` |
   | `R2_SECRET_ACCESS_KEY` | Cloudflare R2 Secret Access Key | `64-char hex string` |
   | `R2_BUCKET_NAME` | Cloudflare R2 Bucket Name | `kutumbam-media` |
   | `R2_ENDPOINT` | (Optional) Custom R2 Endpoint | `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` |
   | `ADMIN_PASSPHRASE_HASH` | Bcrypt hash generated via CLI | `$2a$12$....` |
   | `SESSION_SECRET` | 64+ char random secret for signed cookies | `openssl rand -hex 32` |
   | `NEXT_PUBLIC_APP_URL` | Production URL for QR codes / links | `https://your-domain.vercel.app` |
   | `NEXT_PUBLIC_HELP_CONTACT_NAME` | Name shown on Mom's Help card | `Kiran (Son)` |
   | `NEXT_PUBLIC_HELP_PHONE_NUMBER` | Direct phone link (`tel:`) | `+919876543210` |
   | `NEXT_PUBLIC_HELP_WHATSAPP_NUMBER` | WhatsApp direct contact | `+919876543210` |

3. **Deploy**:
   - Click **Deploy**.
   - Vercel will build and launch your production site.

---

## 5. Post-Deployment Verification (`npm run smoke`)

1. Set your local `.env` with production credentials.
2. Run the automated smoke test:
   ```bash
   npm run smoke
   ```
3. Verification Checklist:
   - [x] Direct unauthenticated requests to R2 bucket return `403 Forbidden`.
   - [x] Admin can log in at `/login` with passphrase.
   - [x] Admin creates a single-use 24-hour device link in `/admin/family`.
   - [x] Mom opens the link on her phone, gains 12-month persistent session.
   - [x] Movies, photos, family videos, and files load smoothly with Telugu & English titles.
   - [x] Global "Help · సహాయం" button calls and messages the configured family member.
