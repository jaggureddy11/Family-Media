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

## 3. Configure Local Environment

1. In the project root, open `.env` (or copy `.env.example` to `.env`):
   ```bash
   cp .env.example .env
   ```
2. Paste your Neon connection string into `DATABASE_URL`:
   ```env
   DATABASE_URL="postgresql://username:password@ep-cool-butterfly-123456.us-east-2.aws.neon.tech/neondb?sslmode=require"
   ```
3. Set your Admin Passphrase:
   ```env
   ADMIN_PASSPHRASE="your-secure-family-passphrase"
   ```
   *(Optional: you can also set `ADMIN_PASSPHRASE_HASH` using a bcrypt hash for production).*
4. Set a random 32+ character string for `SESSION_SECRET`:
   ```env
   SESSION_SECRET="change-this-to-a-random-32-char-string-for-kutumbam"
   ```
5. Set your Admin Contact for the Mom Help button:
   ```env
   NEXT_PUBLIC_HELP_CONTACT_NAME="Jaggu"
   NEXT_PUBLIC_HELP_PHONE_NUMBER="+919876543210"
   NEXT_PUBLIC_HELP_WHATSAPP_NUMBER="+919876543210"
   ```

---

## 4. Push Schema to Neon Database

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
