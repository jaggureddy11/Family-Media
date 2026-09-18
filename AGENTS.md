# Kutumbam · కుటుంబం — Project Rules & Guidelines

PROJECT: "Kutumbam · కుటుంబం" — a private, ad-free, Telugu + English family media website.
Think "simple personal Netflix + Google Photos" for one primary user: an elderly Telugu-speaking mother who is not comfortable with smartphones or complicated apps.

NORTH STAR: "Technology for Mom, not Mom for Technology."
If a design decision is a trade-off between power and simplicity, ALWAYS choose simplicity.

## NON-NEGOTIABLE RULES

1. **BILINGUAL EVERYWHERE**:
   - Every visible label, button, heading, error, empty state, toast, and aria-label is shown as "English · తెలుగు" (e.g., "Movies · సినిమాలు").
   - No language switcher.
   - All strings live in ONE file: `src/lib/strings.ts`, as `{ en, te }` pairs, rendered through a single `<Bi>` component.
   - Never hardcode UI text elsewhere.

2. **EXTREMELY SIMPLE UI**:
   - Maximum 4 top-level destinations (Movies, Photos, Family Videos, Other Files) plus Home.
   - Big touch targets (min 64px tall, prefer 88px+), big thumbnails, high contrast, minimal text.
   - No menus hidden behind icons, no hamburger menus, no swipe-only gestures, no hover-only interactions, no tiny icons without labels.
   - **TEXT SIZE (low-vision / short-sighted friendly)**:
     - Body text >= 26px
     - Button labels >= 28px
     - Headings >= 40px
     - On TV (10-foot UI): body >= 40px, headings >= 64px
     - Telugu text is always the same size or larger than the English next to it.
     - Nothing on any screen smaller than 24px, ever.
     - Use `rem` units so browser/OS text scaling works and layouts never break at 200% zoom.

3. **NO DEAD ENDS**:
   - Every screen has a visible big "Home · హోమ్" and "Back · వెనుకకు" button.
   - Errors always explain what to do next in plain, reassuring words.

4. **PRIVATE BY DEFAULT**:
   - No public URLs, no indexing (`robots noindex`, `X-Robots-Tag: noindex, nofollow`), no analytics, no third-party trackers, no ads, no recommendation feeds, no external CDNs for fonts/scripts.
   - All media served via short-lived signed URLs after auth checks.

5. **RESPONSIVE + TV FRIENDLY**:
   - Works on phones (390px), tablets, laptops, and TV browsers (1920x1080, 10-foot UI) with remote/D-pad navigation (arrow keys, Enter, Escape/Back).
   - Visible focus ring (>= 4px, prefer 6px) on every focusable element.

6. **STORAGE IS ABSTRACTED**:
   - All file access goes through a `StorageProvider` interface (S3-compatible implementation first) so storage can grow or move without touching UI code.

7. **ACCESSIBILITY**:
   - WCAG AA contrast minimum (target AAA for text; contrast ratio >= 10:1).
   - `prefers-reduced-motion` respected.
   - Full keyboard/D-pad support.
   - Screen-reader labels in both languages.
   - No auto-playing video with sound.

8. **FONTS**:
   - Noto Sans Telugu + Inter, self-hosted via `next/font/local`.
   - Verify Telugu conjuncts render correctly (e.g., "కుటుంబ వీడియోలు").

9. **STACK**:
   - Next.js App Router, TypeScript (strict), Tailwind CSS, Prisma + PostgreSQL, Auth.js, S3-compatible storage (Cloudflare R2 / MinIO), ffmpeg worker (`pg-boss` queue), Vitest + Playwright.

10. **QUALITY**:
    - Small components, no dead code, env vars in `.env.example`, secrets never committed.
    - Every feature has automated tests and a short README section.

11. **WORKFLOW**:
    - For anything non-trivial, produce an implementation plan artifact first.
    - After implementing, produce a walkthrough artifact with screenshots at 390px and 1920px widths.
    - Commit with clear git messages.

12. **TONE OF COPY**:
    - Warm, respectful, short, plain words.
    - Never use jargon (no "upload failed: 500", "sync", "cache", "codec").

13. **LOW-VISION FIRST**:
    - High contrast: text/background ratio >= 10:1 (target 14:1+). Pure-ish white on near-black, or near-black on white. Never grey-on-grey, never light text on photos without solid backing.
    - Bold type: Telugu weight >= 500 (Medium), headings 700. Line-height >= 1.7 for Telugu. No thin weights, no italics, no all-caps, no text burned into images.
    - Fewer things per screen: 2 tiles per row on phones (1 per row at Huge text size), one clear primary action per screen.
    - Large, thick controls: 4px+ borders on buttons, solid fills, seek bars >= 24px tall, thick focus rings (>= 6px).
    - Icons always >= 48px, filled, paired with text labels.
    - No low-contrast decoration. Movie/photo captions sit on solid bars underneath, not overlaid on top of images.
    - Per-profile `--text-scale` CSS variable driving Large (1.0), Extra Large (1.25, default), Huge (1.5).
    - High contrast theme option (pure black `#000000` + yellow `#FACC15` / white `#FFFFFF`).
    - Movie titles displayed BIG under the poster because poster graphics are unreadable for low-vision users.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
