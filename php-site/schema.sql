-- Run this once in phpMyAdmin (hPanel → Databases → phpMyAdmin) against the
-- MySQL database you create for this site. It only creates the table that
-- holds admin login accounts — form submissions still live in
-- data/submissions.json, this is just for the dashboard's login.

CREATE TABLE IF NOT EXISTS admin_users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
