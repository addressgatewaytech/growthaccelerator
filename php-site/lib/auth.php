<?php
// Session-based admin login guard, backed by the admin_users MySQL table.

function admin_start_session() {
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }
    $secure = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'httponly' => true,
        'samesite' => 'Lax',
        'secure' => $secure,
    ]);
    session_start();
}

function admin_is_logged_in() {
    admin_start_session();
    return !empty($_SESSION['admin_id']);
}

// $isApi = true -> respond 401 JSON (for list.php / update-status.php)
// $isApi = false -> redirect to the login page (for index.php)
function admin_require_login($isApi = false) {
    if (admin_is_logged_in()) {
        return;
    }
    if ($isApi) {
        header('Content-Type: application/json');
        http_response_code(401);
        echo json_encode(['ok' => false, 'error' => 'Not authenticated.']);
    } else {
        header('Location: login.php');
    }
    exit;
}
