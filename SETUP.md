# Kutumbam · కుటుంబం — Local Setup Guide (Zero-Ops)

This guide walks you through setting up your local environment and connecting to a free **Neon Serverless PostgreSQL** database in under 3 minutes.

---

## 1. Prerequisites

- **Node.js**: v20 or later (`node -v`)
- **npm**: v10 or later (`npm -v`)
- A free account on [Neon.tech](https://neon.tech) (PostgreSQL)

---

## 2. Step-by-Step Neon Database Setup

1. **Sign In**: Go to [neon.tech](https://neon.tech) and sign up / log in (GitHub or Google login).
2. **Create Project**:
   - Click **"New Project"**.
   - Name: `kutumbam`.
   - Region: Choose the region closest to you (e.g. `AWS Asia Pacific (Mumbai)` or `AWS US East (N. Virginia)`).
   - Postgres Version: 16 (default).
   - Click **"Create project"**.
3. **Copy Connection String**:
   - On the Neon Dashboard, you will see the **Connection Details** widget.
   - Select **"Prisma"** or **"Connection string"** from the dropdown.
   - It looks like:
     ```text
     postgresql://username:password@ep-cool-butterfly-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
     ```
   - Click the **Copy** button.

---

## 3. Step-by-Step Cloudflare R2 Object Storage Setup

1. **Sign In to Cloudflare**: Go to [dash.cloudflare.com](https://dash.cloudflare.com) and navigate to **R2**.
2. **Create Bucket**:
   - Click **"Create bucket"**.
   - Name: `kutumbam-private` (or your chosen bucket name).
   - Location: Automatic (or region closest to you).
   - Click **"Create bucket"**.
3. **Configure Bucket CORS** (Essential for range requests, video seeking, and direct browser uploads):
   - In your bucket settings, go to the **Settings** tab.
   - Scroll to **CORS Policy** and click **"Add CORS policy"**.
   - Paste the following JSON:
     ```json
     [
       {
         "AllowedOrigins": [
           "http://localhost:3000",
           "https://*.vercel.app",
           "https://your-domain.com"
         ],
         "AllowedMethods": [
           "GET",
           "PUT",
           "POST",
           "HEAD",
           "DELETE"
         ],
         "AllowedHeaders": [
           "*"
         ],
         "ExposeHeaders": [
           "ETag",
           "Content-Range",
           "Accept-Ranges",
           "Content-Length"
         ],
         "MaxAgeSeconds": 3600
       }
     ]
     ```
   - Click **"Save"**.
4. **Create API Token**:
   - In Cloudflare dashboard, go to **R2** > **Manage R2 API Tokens**.
   - Click **"Create API token"**.
   - Name: `kutumbam-storage-token`.
   - Permissions: **Object Read & Write**.
   - Bucket scope: Select **Apply to specific buckets only** and choose `kutumbam-private`.
   - TTL: Permanent (or your preference).
   - Click **"Create API Token"**.
   - Copy:
     - **Access Key ID**
     - **Secret Access Key**
     - **Endpoint URL** (e.g. `https://<accountid>.r2.cloudflarestorage.com`)

---

## 4. Configure Environment Variables (`.env`)

1. In the project root, copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Populate the environment variables:
   ```env
   # Database (Neon PostgreSQL)
   DATABASE_URL="postgresql://username:password@ep-cool-butterfly-123456.us-east-2.aws.neon.tech/neondb?sslmode=require"

   # Authentication
   # Plaintext is accepted in development only. Production strictly requires ADMIN_PASSPHRASE_HASH.
   ADMIN_PASSPHRASE="your-secure-family-passphrase"
   ADMIN_PASSPHRASE_HASH="$2b$12$..." # (Optional in dev, required in production)
   SESSION_SECRET="change-this-to-a-random-32-char-string-for-kutumbam"

   # Cloudflare R2 Storage
   STORAGE_ENDPOINT="https://<accountid>.r2.cloudflarestorage.com"
   STORAGE_BUCKET_NAME="kutumbam-private"
   STORAGE_ACCESS_KEY_ID="your-r2-access-key-id"
   STORAGE_SECRET_ACCESS_KEY="your-r2-secret-access-key"
   STORAGE_REGION="auto"

   # Support Contact (displayed in Mom Help modal)
   NEXT_PUBLIC_HELP_CONTACT_NAME="Jaggu"
   NEXT_PUBLIC_HELP_PHONE_NUMBER="+919876543210"
   NEXT_PUBLIC_HELP_WHATSAPP_NUMBER="+919876543210"
   ```

---

## 5. Push Schema & Seed Initial Library

Run the following command to push the tables to Neon:
```bash
npx prisma db push
```
This creates all tables (`users`, `devices`, `device_links`, `media_items`, `albums`, `album_items`, `favorites`, `watch_progress`, `system_settings`).

---

## 5. Start the Application

```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

- Go to [http://localhost:3000/login](http://localhost:3000/login) to log in with your admin passphrase.
- Go to [http://localhost:3000/admin/family](http://localhost:3000/admin/family) to add Mom and create her 12-month persistent device link and QR code!

---

## 6. Running Automated Tests

- **Unit tests**:
  ```bash
  npm test
  ```
- **Playwright E2E & Accessibility Tests**:
  ```bash
  npm run test:e2e
  ```
