# Kutumbam · కుటుంబం

A private, ad-free, bilingual (Telugu + English) family media streaming and memories website.

> **North Star:** *"Technology for Mom, not Mom for Technology."*  
> Designed specifically for an elderly Telugu-speaking mother with low vision / short-sightedness who is uncomfortable with complex smartphone apps.

---

## Key Principles & Rules

1. **Bilingual Everywhere:** Every visible element displays "English · తెలుగు" via `<Bi>` and `src/lib/strings.ts`. No language switches.
2. **Low-Vision First:**
   - Body text >= 26px (TV: 40px+)
   - Buttons >= 28px font, min 88px tall
   - Headings >= 40px (TV: 64px+)
   - Minimum contrast ratio >= 10:1 (targeting 14:1+)
   - Telugu font weight >= 500 (Medium)
   - Controllable via `--text-scale` (`Large` = 1.0, `Extra Large` = 1.25, `Huge` = 1.5)
3. **No Dead Ends:** Every single screen has persistent, high-contrast **Home · హోమ్** and **Back · వెనుకకు** buttons.
4. **TV & D-Pad Remote Ready:** Spatial navigation works via arrow keys, Enter, and Escape/Backspace without requiring a mouse.
5. **Private by Default:** Zero tracking, no public routes, short-lived signed media URLs.

---

## Local Development Setup

### 1. Prerequisites
- Node.js 20+
- PostgreSQL (local instance, Docker, or Neon/Supabase)

### 2. Installation
```bash
git clone <repo-url> kutumbam
cd kutumbam
npm install
cp .env.example .env
```

### 3. Database
```bash
npx prisma generate
# When PostgreSQL is running:
npx prisma db push
```

### 4. Running the Dev Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application, or [http://localhost:3000/styleguide](http://localhost:3000/styleguide) to review the design system.

### 5. Running Tests
```bash
# Unit & accessibility guard tests
npm run test

# End-to-end Playwright tests
npm run test:e2e
```
