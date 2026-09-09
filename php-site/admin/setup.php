<?php
require_once __DIR__ . '/../lib/database.php';
$config = require __DIR__ . '/../config.php';

$dbError = '';
$pdo = null;
try {
    $pdo = db_pdo($config);
    $existingCount = (int) $pdo->query('SELECT COUNT(*) c FROM admin_users')->fetch()['c'];
} catch (Exception $e) {
    $dbError = 'Could not connect to the database. Check db_host / db_name / db_user / db_pass in config.php, and make sure schema.sql has been run.';
    error_log('[admin setup] ' . $e->getMessage());
    $existingCount = 0;
}

// Only usable when no admin account exists yet — prevents this page being
// used later to plant a second, rogue admin account.
if (!$dbError && $existingCount > 0) {
    header('Location: login.php');
    exit;
}

$error = '';
$success = false;

if (!$dbError && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';
    $confirm = $_POST['confirm'] ?? '';

    if (strlen($username) < 3) {
        $error = 'Username must be at least 3 characters.';
    } elseif (strlen($password) < 8) {
        $error = 'Password must be at least 8 characters.';
    } elseif ($password !== $confirm) {
        $error = 'Passwords do not match.';
    } else {
        try {
            $hash = password_hash($password, PASSWORD_BCRYPT);
            $stmt = $pdo->prepare('INSERT INTO admin_users (username, password_hash) VALUES (?, ?)');
            $stmt->execute([$username, $hash]);
            $success = true;
        } catch (Exception $e) {
            $error = 'Could not create the account (username may already be taken).';
            error_log('[admin setup] ' . $e->getMessage());
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Create Admin Account — Address Gateway Opportunities Hub</title>
<link rel="icon" type="image/png" href="/assets/img/logo-mark.png">
<link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  :root { --navy-900:#051423; --cyan:#199fbd; --orange:#f08422; --ink:#364052; --ink-soft:#5b6478; --bg:#f4f7f9; --border:#e1e8f0; --white:#fff; }
  * { box-sizing: border-box; }
  body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center; font-family:'Barlow',Arial,sans-serif; background:var(--navy-900); color:var(--ink); }
  .card { background:var(--white); border-radius:14px; padding:40px; width:100%; max-width:420px; box-shadow:0 20px 45px -20px rgba(5,20,35,0.5); }
  .card img { height:30px; margin-bottom:22px; }
  h1 { font-size:20px; color:var(--navy-900); margin:0 0 6px; }
  p.sub { color:var(--ink-soft); font-size:13.5px; margin:0 0 24px; }
  label { display:block; font-weight:700; font-size:13.5px; color:var(--navy-900); margin-bottom:6px; }
  input { width:100%; padding:11px 13px; border:1.5px solid var(--border); border-radius:8px; font-family:inherit; font-size:15px; margin-bottom:16px; }
  input:focus { outline:none; border-color:var(--cyan); }
  button { width:100%; padding:13px; border:none; border-radius:999px; background:var(--orange); color:var(--navy-900); font-weight:700; font-size:15px; cursor:pointer; }
  button:hover { background:#d9720f; }
  .msg { padding:12px 14px; border-radius:8px; font-size:13.5px; margin-bottom:18px; }
  .msg.error { background:#fdecec; color:#a3271f; border:1px solid #f3c3c0; }
  .msg.success { background:#e6f7ea; color:#1c6b34; border:1px solid #b7e3c2; }
  a { color:var(--cyan); text-decoration:none; font-size:13.5px; }
</style>
</head>
<body>
  <div class="card">
    <img src="/assets/img/logo-mark.png" alt="Address Gateway">
    <h1>Create the first admin account</h1>
    <p class="sub">This page only works while no admin account exists yet.</p>

    <?php if ($dbError): ?>
      <div class="msg error"><?= htmlspecialchars($dbError) ?></div>
    <?php elseif ($success): ?>
      <div class="msg success">Account created. <a href="login.php">Go to login &rarr;</a></div>
    <?php else: ?>
      <?php if ($error): ?><div class="msg error"><?= htmlspecialchars($error) ?></div><?php endif; ?>
      <form method="POST">
        <label for="username">Username</label>
        <input type="text" id="username" name="username" required minlength="3" value="<?= htmlspecialchars($_POST['username'] ?? '') ?>">
        <label for="password">Password</label>
        <input type="password" id="password" name="password" required minlength="8">
        <label for="confirm">Confirm password</label>
        <input type="password" id="confirm" name="confirm" required minlength="8">
        <button type="submit">Create account</button>
      </form>
    <?php endif; ?>
  </div>
</body>
</html>
