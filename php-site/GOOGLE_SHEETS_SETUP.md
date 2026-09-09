# Pushing submissions to Google Sheets

Every form submission already lands in `data/submissions.json` and shows up in `/admin`. This adds a **second copy** of each submission as a row in a Google Sheet — handy for sharing with people who shouldn't have admin dashboard access, or for quick filtering/sorting in a spreadsheet.

This uses a Google Apps Script "Web App" — no API keys, no Google Cloud project, no billing. It runs entirely under your own Google account.

## 1. Create the sheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a new blank spreadsheet. Name it something like "Address Gateway — Opportunities Hub Submissions".
2. In the menu, go to **Extensions → Apps Script**. A new tab opens with a code editor.
3. Delete whatever's in the default `Code.gs` file, and paste in the contents of [`google-apps-script/Code.gs`](../google-apps-script/Code.gs) from this project instead.
4. In that pasted code, find this line near the top:
   ```js
   var SHARED_SECRET = 'change-this-to-a-random-string';
   ```
   Replace `'change-this-to-a-random-string'` with any random string of your choosing (e.g. `'ag-hub-9f3k2m8x'`). This is a shared password between the script and your site — write it down, you'll need it in step 3 below.
5. Save the project (Ctrl+S / the disk icon). Give it a name like "Opportunities Hub Receiver" when prompted.

## 2. Deploy it as a Web App

1. Click **Deploy → New deployment** (top right).
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Fill in:
   - **Description**: anything, e.g. "v1"
   - **Execute as**: **Me** (your account)
   - **Who has access**: **Anyone** — this sounds alarming, but the shared secret from step 1.4 is what actually protects it; without the correct secret, the script rejects the request and writes nothing.
4. Click **Deploy**. Google will ask you to authorize the script — click through the "Google hasn't verified this app" warning (it's your own script, this is expected for personal Apps Script projects) and allow access.
5. Copy the **Web app URL** it gives you — looks like `https://script.google.com/macros/s/AKfycb.../exec`.

## 3. Connect it to the site

Open `config.php` (in File Manager, or wherever you deployed the PHP site) and fill in:

```php
'google_sheet_webapp_url' => 'https://script.google.com/macros/s/AKfycb.../exec', // from step 2.5
'google_sheet_secret' => 'ag-hub-9f3k2m8x', // exactly what you put in SHARED_SECRET, step 1.4
```

Save the file. That's it — the next form submission will show up as a new row in a "Submissions" tab in your sheet (the script creates that tab automatically the first time it runs).

## Updating the script later

If you ever edit `Code.gs` again (e.g. to add a column), you need to redeploy: **Deploy → Manage deployments → edit (pencil icon) → New version → Deploy**. Just saving the code isn't enough — Apps Script Web Apps only pick up changes on a new deployment version.

## Troubleshooting

- **Nothing shows up in the sheet, but the form submission succeeded on the site**: check `config.php` has the exact URL and secret, with no extra spaces. The site never fails a submission because of this — it just silently skips the Sheets push and logs a warning, so check your host's PHP error log for `[sheets]` lines.
- **"Invalid secret" logged**: the secret in `config.php` doesn't match `SHARED_SECRET` in the script. They must be identical strings.
- **Wrong data types in the sheet**: dates/status can look like plain text — that's expected, Apps Script writes what it's given.
