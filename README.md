# Address Gateway — Opportunities Hub

A single landing page ("Join the Team" / "Work With Us") with one application form that routes to four branches, a JSON-backed backend, email notifications, and an admin dashboard — built from the four brief documents in `GROWTH PARTNER/shaan/TRAINING LANDING PAGE/`.

## What's here

```
public/                 The public site (served as static files)
  index.html            The one-page Opportunities Hub (hero, fork, tiers, services, FAQ, form, footer)
  css/style.css          Theme matched to addressgateway.com (navy/cyan/orange, Barlow font)
  js/main.js             Branch switching, WhatsApp links, UTM capture, form submission
  assets/img/            Logo files pulled from the live site
  admin/                 Submissions dashboard (Basic Auth protected)
server/
  index.js               Express app: static hosting + API routes
  db.js                  Lightweight JSON-file datastore (data/submissions.json)
  mailer.js               Nodemailer wrapper for the notification email
  auth.js                 HTTP Basic Auth middleware for /admin and /api/admin/*
data/submissions.json    Where every application lands (created automatically)
```

## Running it

```bash
npm install
cp .env.example .env     # then edit .env — see "Before launch" below
npm start
```

Site: http://localhost:3000
Admin dashboard: http://localhost:3000/admin (your browser will prompt for the `ADMIN_USER` / `ADMIN_PASS` you set in `.env`)

Use `npm run dev` instead of `npm start` while developing — it restarts on file changes.

## How the form works

One `<form>` on the page (`#apply`) with a 4-way branch selector at the top:

- **Join a Team Track** → the full 10-section accelerator questionnaire from `selection process form.docx` (this is the "already built" full questionnaire the brief refers to — the shorter `Address_Gateway_Accelerator_Application_Form_Fields.docx` looks like an earlier draft of the same form, so the fuller one was used).
- **Pitch an Idea / Apply as Co-founder**
- **Join as an Affiliate or Ambassador**
- **Get a Service** (Consulting / Training / Workshop)

Only the active branch's `<fieldset>` is enabled; the other three are `disabled`, which both hides them from validation and keeps their fields out of the submitted payload automatically (no hidden-required-field bugs).

Every branch posts to the same endpoint: `POST /api/submit` with `{ branch, fields, utm }`. The server:

1. Validates a minimal set of required fields per branch (see `server/index.js`).
2. Stores the submission in `data/submissions.json` with `status: "New"`, a timestamp, and whatever UTM parameters were on the URL.
3. Emails `NOTIFY_EMAIL` (defaults to `cso@addressgateway.com`) via whatever SMTP account you put in `.env`. If SMTP isn't configured, it logs a warning instead of crashing — so the site still works and captures leads even before email is wired up.

"Apply for This Track" / "Pitch Your Idea" / "Join as an Affiliate" etc. buttons throughout the page pre-select the right branch and scroll to the form.

## Admin dashboard

`/admin` lists every submission, filterable by branch, status, and date, with a status dropdown per row (New → Reviewed → Shortlisted → Rejected) that saves immediately via `PATCH /api/admin/submissions/:id/status`. "View all fields" expands the full answer set for that row. It auto-refreshes every 60 seconds.

It's a static page + a tiny bit of JS calling the same Express server — no separate login system, just HTTP Basic Auth, so there's nothing extra to deploy.

## WhatsApp

Every WhatsApp CTA (hero secondary button, the three Work With Us cards, and the floating button) uses `https://wa.me/97450494933` — the number already published on addressgateway.com — with the pre-filled messages specified in the brief. Update `WA_NUMBER` in `public/js/main.js` if this ever changes.

## Before launch — things to double check

The brief listed a few open items; here's what's resolved and what's still yours to confirm:

- ✅ **WhatsApp number** — pulled from the live site's footer (+974 5049 4933).
- ✅ **Email domain** — `cso@addressgateway.com` (`.com` confirmed live on addressgateway.com).
- ✅ **Brand colours / logo** — matched to addressgateway.com (navy `#051423`, cyan `#199fbd`, orange `#f08422`, Barlow font); logo files copied into `public/assets/img/`.
- ✅ **"Why Address Gateway" stats** — filled from the live About page (10+ years, 1,000+ clients).
- ✅ **Hosting path** — `growthaccelerator.addressgateway.com`, set in `<link rel="canonical">`, the `og:url`/`twitter` tags in `public/index.html`, and `SITE_URL` in `.env`.
- ⬜ **SMTP credentials** — pick a transactional provider (SendGrid, Resend, Zoho, etc.) and fill in `.env`. Until then, submissions are still captured and visible in `/admin`, just not emailed.
- ⬜ **ADMIN_USER / ADMIN_PASS** — change these from the defaults before this goes anywhere near the internet.
- ⬜ **Google Analytics / Meta Pixel** — `public/js/main.js` already fires a `generate_lead` GA4 event and a `Lead` Meta Pixel event on successful submit (guarded so nothing breaks if the scripts aren't loaded). Add the actual `gtag.js` / Pixel `<script>` snippets with your real IDs to `public/index.html` `<head>` to activate them.
- ⬜ **Social preview image** — `og:image`/`twitter:image` currently point at the logo mark as a placeholder. Swap in a real 1200×630 social card before heavy social promotion.

## Data & backups

`data/submissions.json` is the entire database. It's plain JSON — back it up like any other file (copy it, commit it somewhere private, whatever fits your workflow). If lead volume grows enough that a flat file feels limiting, the `db.js` module is the only place that would need to change to move to a real database — nothing else in the app talks to storage directly.
