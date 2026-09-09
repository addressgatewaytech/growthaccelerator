<?php
require_once __DIR__ . '/../lib/auth.php';
admin_require_login(true);

header('Content-Type: application/json');
require_once __DIR__ . '/../lib/db.php';

$method = $_SERVER['REQUEST_METHOD'];
if ($method !== 'PATCH' && $method !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

$id = $_GET['id'] ?? null;
$body = json_decode(file_get_contents('php://input'), true);
$status = $body['status'] ?? null;

$allowed = ['New', 'Reviewed', 'Shortlisted', 'Rejected'];
if (!$id || !in_array($status, $allowed, true)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Invalid id or status.']);
    exit;
}

$updated = db_update_status($id, $status);
if (!$updated) {
    http_response_code(404);
    echo json_encode(['ok' => false, 'error' => 'Not found.']);
    exit;
}

echo json_encode(['ok' => true, 'row' => $updated]);
