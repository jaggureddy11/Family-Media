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
     postgresql://<USERNAME>:<PASSWORD>@<NEON_HOST>/neondb?sslmode=require
     ```
   - Click the **Copy** button.

---

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

## 3B. Step-by-Step Backblaze B2 Setup (Alternative S3 Provider)

1. **Sign In to Backblaze**: Go to [backblaze.com/b2](https://www.backblaze.com/b2) and sign in.
2. **Create Private Bucket**:
   - Go to **Buckets** > **Create a Bucket**.
   - Bucket Name: `<YOUR_BUCKET_NAME>` (e.g. `kutumbam-private-media`).
   - Files in Bucket are: **Private** (Keep public access OFF!).
   - Default Encryption: Enabled (optional).
   - Object Lock: Disabled (unless desired).
   - Click **"Create a Bucket"**.
3. **Configure Bucket CORS**:
   - On the Buckets page, click **Bucket Settings** or **CORS Rules** for your bucket.
   - Set CORS rules to allow origins (`http://localhost:3000`, `https://*.vercel.app`, `https://your-domain.com`), methods (`GET`, `PUT`, `POST`, `HEAD`, `DELETE`), and expose headers (`ETag`, `Content-Range`, `Accept-Ranges`, `Content-Length`).
4. **Create Application Key Scoped to Bucket**:
   - Go to **Account** > **Application Keys** > **Add a New Application Key**.
   - Name of Key: `kutumbam-app`.
   - Allow access to Bucket(s): Select your bucket (e.g. `<YOUR_BUCKET_NAME>`).
   - Type of Access: **Read and Write**.
   - Allow List All Bucket Names: unchecked.
   - Click **"Create New Key"**.
   - Note down:
     - **keyID** (Used as `STORAGE_ACCESS_KEY_ID`)
     - **applicationKey** (Used as `STORAGE_SECRET_ACCESS_KEY`)
     - **S3 Endpoint** (e.g. `https://s3.<YOUR_REGION>.backblazeb2.com`)
     - **Region** (e.g. `us-east-005` or `us-west-004`)
5. **Set Environment Variables**:
   ```env
   STORAGE_ENDPOINT="https://s3.<YOUR_REGION>.backblazeb2.com"
   STORAGE_REGION="<YOUR_REGION>"
   STORAGE_ACCESS_KEY_ID="<YOUR_KEY_ID>"
   STORAGE_SECRET_ACCESS_KEY="<YOUR_APPLICATION_KEY>"
   STORAGE_BUCKET_NAME="<YOUR_BUCKET_NAME>"
   STORAGE_FORCE_PATH_STYLE="true"
   ```

---

## 4. Configure Environment Variables (`.env`)

1. In the project root, copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Populate the environment variables:
   ```env
   # Database (Neon PostgreSQL)
   DATABASE_URL="postgresql://<USERNAME>:<PASSWORD>@<NEON_HOST>/neondb?sslmode=require"

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
