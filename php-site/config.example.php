<?php
// Copy this file to config.php and fill in real values before going live.
// config.php is the one file this app reads settings from — keep it out of
// version control / never share it publicly, since it holds your SMTP password.

return [
    // MySQL connection for the admin dashboard's login (see schema.sql).
    // Create the database + user in hPanel → Databases → MySQL Databases.
    'db_host' => 'localhost',
    'db_name' => '',
    'db_user' => '',
    'db_pass' => '',

    // Where every submission notification email is sent
    'notify_email' => 'cso@addressgateway.com',

    // Public URL of the site (used in the notification email's admin link)
    'site_url' => 'https://growthaccelerator.addressgateway.com',

    // SMTP settings for sending the notification email.
    // Leave smtp_host empty to skip sending email (submissions are still
    // captured and visible in /admin either way).
    'smtp_host' => '',
    'smtp_port' => 587,
    'smtp_secure' => 'tls', // 'tls', 'ssl', or '' for none
    'smtp_user' => '',
    'smtp_pass' => '',
    'smtp_from_email' => 'no-reply@addressgateway.com',
    'smtp_from_name' => 'Address Gateway Opportunities Hub',

    // Google Sheets push — see google-apps-script/Code.gs and
    // GOOGLE_SHEETS_SETUP.md for how to get these two values. Leave
    // google_sheet_webapp_url empty to skip the Sheets push entirely.
    'google_sheet_webapp_url' => '',
    'google_sheet_secret' => '',
];
