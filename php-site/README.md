# Address Gateway — Opportunities Hub (PHP version)

Plain-PHP version of the site for standard Hostinger shared hosting — no Node.js app slot needed, just upload via File Manager.

## What's here

```
index.html, css/, js/, assets/     The public site (same content/design as the Node version)
submit.php                          Handles form submissions -> data/submissions.json
admin/
  login.php                         Admin login form (MySQL-backed)
  setup.php                         One-time page to create the first admin account
  logout.php
  index.php                         The dashboard itself (requires login)
  list.php, update-status.php       Dashboard's API endpoints (require login)
lib/
  db.php                            JSON-file datastore for submissions
  database.php                      MySQL/PDO connection for admin login
  auth.php                          Session-based login guard
  mailer.php, sheets.php            Email notification + Google Sheets push
  PHPMailer.php, SMTP.php, Exception.php   Bundled PHPMailer (no Composer needed)
config.example.php / config.php     Settings — DB, SMTP, Google Sheets
schema.sql                          Run once in phpMyAdmin to create the admin_users table
```

## Deploying

1. Upload everything here to your hosting (File Manager → extract the zip into the subdomain's web root).
2. **Create a MySQL database** in hPanel → Databases → MySQL Databases. Note the host (usually `localhost`), database name, username, and password it gives you.
3. Open **phpMyAdmin** (linked from that same hPanel screen), select your new database, go to the **SQL** tab, and paste in the contents of `schema.sql`, then run it. This creates one table: `admin_users`.
4. Edit `config.php` and fill in:
   ```php
   'db_host' => 'localhost',
   'db_name' => 'u123456789_yourdbname',
   'db_user' => 'u123456789_yourdbuser',
   'db_pass' => 'the password hPanel gave you',
   ```
5. Visit `yourdomain.com/admin/` — since there's no admin account yet, it'll show a link to `setup.php`. Use that to create your first username/password (minimum 8 characters). **This page stops working the moment one admin account exists**, so nobody can use it later to plant a second account.
6. Log in at `/admin/login.php`. You're in.

## Why MySQL just for login?

Form submissions themselves still live in `data/submissions.json` (simple, no query language needed, works fine at this scale) — only the admin **login accounts** live in MySQL, using proper password hashing (`password_hash`/`password_verify`, bcrypt) and PHP sessions. This replaces the earlier plan of protecting `/admin` with hPanel's "Password Protected Directories" (.htaccess) — if you'd already set that up, you can remove it now, since the login page handles this instead and gives a nicer UI + logout button.

## Adding more admin users later

`setup.php` only works once. To add a second admin account afterwards, open phpMyAdmin and insert a row into `admin_users` manually — the `password_hash` column needs a bcrypt hash, which you can generate by temporarily running this in a throwaway PHP file on the server (delete it right after):

```php
<?php echo password_hash('the-new-password', PASSWORD_BCRYPT);
```

Paste the output into the `password_hash` column for the new row.

## Other setup docs

- [`GOOGLE_SHEETS_SETUP.md`](GOOGLE_SHEETS_SETUP.md) — push a copy of every submission into a Google Sheet.
- SMTP (email notifications) and the Google Sheets settings are both in `config.php` — see the comments there.
