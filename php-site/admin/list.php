<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/mailer.php';

$branch = $_GET['branch'] ?? null;
$status = $_GET['status'] ?? null;
$from = $_GET['from'] ?? null;
$to = $_GET['to'] ?? null;

$rows = db_list_submissions(
    $branch ?: null,
    $status ?: null,
    $from ?: null,
    $to ?: null
);

echo json_encode(['ok' => true, 'rows' => $rows, 'branchLabels' => mailer_branch_labels()]);
