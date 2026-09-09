<?php
header('Content-Type: application/json');

require_once __DIR__ . '/lib/db.php';
require_once __DIR__ . '/lib/mailer.php';
require_once __DIR__ . '/lib/sheets.php';

function json_error($message, $code = 400) {
    http_response_code($code);
    echo json_encode(['ok' => false, 'error' => $message]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_error('Method not allowed', 405);
}

$raw = file_get_contents('php://input');
$body = json_decode($raw, true);
if (!is_array($body)) {
    json_error('Invalid JSON body.');
}

$branch = $body['branch'] ?? null;
$fields = $body['fields'] ?? null;
$utm = $body['utm'] ?? [];
$website = $body['website'] ?? ''; // honeypot

// A real visitor never fills this hidden field in.
if (!empty($website)) {
    echo json_encode(['ok' => true]);
    exit;
}

$validBranches = ['team_track', 'founder_cofounder', 'affiliate_ambassador', 'service'];
if (!in_array($branch, $validBranches, true)) {
    json_error('Unknown application branch.');
}
if (!is_array($fields)) {
    json_error('Missing form fields.');
}

$requiredByBranch = [
    'team_track' => ['fullName', 'email', 'whatsapp', 'declaration'],
    'founder_cofounder' => ['name', 'contact', 'ideaDescription'],
    'affiliate_ambassador' => ['name', 'contact', 'howPromote'],
    'service' => ['name', 'contact', 'needHelp'],
];

$missing = [];
foreach ($requiredByBranch[$branch] as $key) {
    $v = $fields[$key] ?? null;
    if ($v === null || $v === '' || $v === false || (is_array($v) && count($v) === 0)) {
        $missing[] = $key;
    }
}
if (!empty($missing)) {
    json_error('Missing required fields: ' . implode(', ', $missing));
}

$record = db_add_submission($branch, $fields, $utm);

$config = require __DIR__ . '/config.php';
mailer_send_notification($record, $config);
sheets_push($record, $config);

echo json_encode(['ok' => true, 'id' => $record['id']]);
