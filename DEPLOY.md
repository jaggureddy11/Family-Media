# Kutumbam · కుటుంబం — Production Deployment Guide (Vercel + Neon + Backblaze B2)

This document provides complete, click-by-click instructions to deploy Kutumbam to **Vercel** with **Neon Serverless PostgreSQL** and **Backblaze B2 Object Storage**.

---

## 1. Push Code to GitHub

The repository remote is configured as:
`https://github.com/jaggureddy11/Family-Media.git`

1. Run the local pre-commit secret scan to verify no credentials exist in code:
   ```bash
   npm run secret-scan
   ```
2. Commit all staged files:
   ```bash
   git add .
   git commit -m "Prepare production deployment with safe DB guardrails and pooled Neon connection"
   ```
3. Set the remote (if not already set) and push to the main branch:
   ```bash
   git remote add origin https://github.com/jaggureddy11/Family-Media.git || git remote set-url origin https://github.com/jaggureddy11/Family-Media.git
   git branch -M main
   git push -u origin main
   ```

---

## 2. Neon Database Connection Setup

Kutumbam runs against a serverless PostgreSQL instance on **Neon**. In a serverless environment like Vercel, connections must use Neon's connection pooler.

### Connection String Format
In the Neon Console:
1. Go to your project dashboard at [console.neon.tech](https://console.neon.tech).
2. Look at the **Connection Details** widget.
3. Check the **Pooled connection** checkbox. The hostname will contain `-pooler` (e.g., `ep-shiny-sun-b5vghxti-pooler.c-7.us-east-2.aws.neon.tech`).
4. Append `&pgbouncer=true` to ensure Prisma operates correctly through PgBouncer transaction pooling.

**Exact String Format:**
```text
postgresql://<USERNAME>:<PASSWORD>@ep-<ENDPOINT_ID>-pooler.<REGION>.aws.neon.tech/neondb?sslmode=require&pgbouncer=true
```

> [!TIP]
> If you have not yet created the database schema on Neon, run from your local terminal once before deploying:
> ```bash
> npx prisma db push
> ```

---

## 3. Vercel Deployment (Click-by-Click)

1. Go to [vercel.com](https://vercel.com) and log in.
2. Click **"Add New..."** > **"Project"**.
3. Under **"Import Git Repository"**, locate `jaggureddy11/Family-Media` and click **"Import"**.
4. In the configuration screen:
   - **Project Name**: `family-media` (or your chosen name).
   - **Framework Preset**: **Next.js** (detected automatically).
   - **Root Directory**: `./` (default).
   - **Build Command**: Leave default (automatically executes `prisma generate && next build` via `package.json`).
   - **Install Command**: Leave default (automatically executes `npm install`, which triggers `postinstall: prisma generate`).
5. Open the **"Environment Variables"** accordion and add the variables listed in Section 4 below.
6. Click **"Deploy"**.
7. Wait 1–2 minutes for the build to finish. Once complete, note your assigned Vercel URL (e.g. `https://family-media-ten.vercel.app` or `https://family-media.vercel.app`).

---

## 4. Production Environment Variables (Vercel)

Add **ONLY** the production variables below into Vercel (**Settings** > **Environment Variables**).

> [!CAUTION]
> **NEVER add the following variables to Vercel:**
> - `TEST_MODE` (Do NOT set)
> - `REAL_STORAGE_TEST` (Do NOT set)
> - `USE_MOCK_DB` (Do NOT set)
> - `ADMIN_PASSPHRASE` (Do NOT set plaintext passphrase in production; production requires `ADMIN_PASSPHRASE_HASH`)

| Variable Name | Value / Format | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://<USER>:<PASS>@<HOST>-pooler.../neondb?sslmode=require&pgbouncer=true` | Neon pooled PostgreSQL connection string |
| `ADMIN_PASSPHRASE_HASH` | Output from `npm run hash-passphrase` (starts with `$2b$`) | Bcrypt hash of your admin passphrase |
| `SESSION_SECRET` | 32+ random characters | Secret key for signing 12-month device session tokens |
| `STORAGE_ENDPOINT` | `https://s3.<YOUR_REGION>.backblazeb2.com` | Backblaze B2 S3 API endpoint |
| `STORAGE_REGION` | `<YOUR_REGION>` (e.g. `us-east-005`) | Backblaze B2 region |
| `STORAGE_ACCESS_KEY_ID` | `<YOUR_KEY_ID>` | Backblaze B2 Application Key ID |
| `STORAGE_SECRET_ACCESS_KEY` | `<YOUR_APPLICATION_KEY>` | Backblaze B2 Application Key Secret |
| `STORAGE_BUCKET_NAME` | `<YOUR_BUCKET_NAME>` | Name of your private B2 bucket |
| `STORAGE_FORCE_PATH_STYLE` | `true` | Required for Backblaze B2 S3 API compatibility |
| `NEXT_PUBLIC_HELP_CONTACT_NAME` | e.g. `Jaggu` | Name displayed on Mom's 1-tap Help screen |
| `NEXT_PUBLIC_HELP_PHONE_NUMBER` | e.g. `+919876543210` | Direct phone number for Mom's 1-tap call |
| `NEXT_PUBLIC_HELP_WHATSAPP_NUMBER` | e.g. `+919876543210` | WhatsApp number for Mom's 1-tap message |
| `SITE_URL` | `https://<YOUR_APP_NAME>.vercel.app` | (Recommended) Production canonical site URL for QR codes & links |
| `ADMIN_EMAIL_ALLOWLIST` | e.g. `admin@kutumbam.local` | (Optional) Allowed admin email identifiers |

### Generating the Admin Hash:
In your local terminal:
```bash
npm run hash-passphrase
```
Enter your secret passphrase, and copy the generated hash value into Vercel's `ADMIN_PASSPHRASE_HASH`.

---

## 5. Add Vercel Domain to Backblaze B2 CORS Rules

Because uploads and video streaming stream directly between the client browser and Backblaze B2, B2 must permit your production Vercel domain.

1. Log in to [backblaze.com/b2](https://www.backblaze.com/b2).
2. Navigate to **Buckets** and locate your bucket.
3. Click **Bucket Settings** (or **CORS Rules**).
4. Update the **Allowed Origins** list to include your exact Vercel domain:
   ```json
   [
     {
       "corsRuleName": "kutumbam-production-cors",
       "allowedOrigins": [
         "http://localhost:3000",
         "https://<YOUR_PROJECT_NAME>.vercel.app",
         "https://*.vercel.app"
       ],
       "allowedOperations": [
         "s3_put",
         "s3_get",
         "s3_head",
         "s3_post",
         "s3_delete"
       ],
       "allowedHeaders": [
         "*"
       ],
       "exposeHeaders": [
         "ETag",
         "Content-Range",
         "Accept-Ranges",
         "Content-Length"
       ],
       "maxAgeSeconds": 3600
     }
   ]
   ```
5. Save the CORS configuration.

---

## 6. First Login & Verification

1. Open your production site: `https://<YOUR_PROJECT_NAME>.vercel.app/login`.
2. Enter your plaintext admin passphrase (the one you hashed in Step 4).
3. Confirm you are redirected to `/admin/library`.
4. Inspect the **Top Status Bar**:
   - **Storage**: `Storage: Backblaze B2 (real)` (in green)
   - **Database**: `Database: Neon (real)` (in green)
5. Go to `/admin/family`:
   - Click **"Add Family Member"** to add Mom (`అమ్మ`).
   - Click **"Generate Device Link"**.
   - Confirm the QR code and Link URL use your production domain (`https://<YOUR_PROJECT_NAME>.vercel.app/link/...`).
6. Scan the QR code on Mom's phone or iPad:
   - The device automatically redeems the single-use link.
   - It stores a persistent 12-month session cookie.
   - The home page greets Mom in Telugu and English: `"నమస్తే, అమ్మ · Namaste, Amma"`.
7. Go to `/admin/install` to view or print the step-by-step PWA install instructions for Mom's phone.
