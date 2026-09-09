<?php
require_once __DIR__ . '/../lib/auth.php';
require_once __DIR__ . '/../lib/database.php';
admin_start_session();

if (admin_is_logged_in()) {
    header('Location: index.php');
    exit;
}

$config = require __DIR__ . '/../config.php';
$error = '';
$dbError = '';
$noAccountsYet = false;

try {
    $pdo = db_pdo($config);
    $count = (int) $pdo->query('SELECT COUNT(*) c FROM admin_users')->fetch()['c'];
    $noAccountsYet = $count === 0;
} catch (Exception $e) {
    $dbError = 'Could not connect to the database. Check db_host / db_name / db_user / db_pass in config.php.';
    error_log('[admin login] ' . $e->getMessage());
}

if (!$dbError && !$noAccountsYet && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';
    try {
        $stmt = $pdo->prepare('SELECT id, username, password_hash FROM admin_users WHERE username = ?');
        $stmt->execute([$username]);
        $user = $stmt->fetch();
        if ($user && password_verify($password, $user['password_hash'])) {
            session_regenerate_id(true);
            $_SESSION['admin_id'] = $user['id'];
            $_SESSION['admin_username'] = $user['username'];
            header('Location: index.php');
            exit;
        }
        $error = 'Invalid username or password.';
    } catch (Exception $e) {
        $error = 'Something went wrong. Please try again.';
        error_log('[admin login] ' . $e->getMessage());
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Admin Login — Address Gateway Opportunities Hub</title>
<link rel="icon" type="image/png" href="/assets/img/logo-mark.png">
<link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  :root { --navy-900:#051423; --cyan:#199fbd; --orange:#f08422; --ink:#364052; --ink-soft:#5b6478; --border:#e1e8f0; --white:#fff; }
  * { box-sizing: border-box; }
  body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center; font-family:'Barlow',Arial,sans-serif; background:var(--navy-900); color:var(--ink); }
  .card { background:var(--white); border-radius:14px; padding:40px; width:100%; max-width:380px; box-shadow:0 20px 45px -20px rgba(5,20,35,0.5); }
  .card img { height:30px; margin-bottom:22px; }
  h1 { font-size:20px; color:var(--navy-900); margin:0 0 24px; }
  label { display:block; font-weight:700; font-size:13.5px; color:var(--navy-900); margin-bottom:6px; }
  input { width:100%; padding:11px 13px; border:1.5px solid var(--border); border-radius:8px; font-family:inherit; font-size:15px; margin-bottom:16px; }
  input:focus { outline:none; border-color:var(--cyan); }
  button { width:100%; padding:13px; border:none; border-radius:999px; background:var(--orange); color:var(--navy-900); font-weight:700; font-size:15px; cursor:pointer; }
  button:hover { background:#d9720f; }
  .msg { padding:12px 14px; border-radius:8px; font-size:13.5px; margin-bottom:18px; }
  .msg.error { background:#fdecec; color:#a3271f; border:1px solid #f3c3c0; }
  .msg.info { background:#e6f4f8; color:#0b5a6b; border:1px solid #b9e2ea; }
  a { color:var(--cyan); text-decoration:none; font-size:13.5px; }
</style>
</head>
<body>
  <div class="card">
    <img src="/assets/img/logo-mark.png" alt="Address Gateway">
    <h1>Submissions Dashboard Login</h1>

    <?php if ($dbError): ?>
      <div class="msg error"><?= htmlspecialchars($dbError) ?></div>
    <?php elseif ($noAccountsYet): ?>
      <div class="msg info">No admin account exists yet. <a href="setup.php">Create the first one &rarr;</a></div>
    <?php else: ?>
      <?php if ($error): ?><div class="msg error"><?= htmlspecialchars($error) ?></div><?php endif; ?>
      <form method="POST">
        <label for="username">Username</label>
        <input type="text" id="username" name="username" required autofocus>
        <label for="password">Password</label>
        <input type="password" id="password" name="password" required>
        <button type="submit">Log in</button>
      </form>
    <?php endif; ?>
  </div>
</body>
</html>
