<?php
require_once __DIR__ . '/../lib/auth.php';
admin_require_login(false); // a failed export attempt should land on the login page, not a bare 401 body

require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/mailer.php';

$branch = $_GET['branch'] ?? null;
$status = $_GET['status'] ?? null;
$from = $_GET['from'] ?? null;
$to = $_GET['to'] ?? null;

$rows = db_list_submissions($branch ?: null, $status ?: null, $from ?: null, $to ?: null);
$labels = mailer_branch_labels();

$filenameBits = ['submissions'];
if ($branch) $filenameBits[] = $branch;
if ($status) $filenameBits[] = strtolower($status);
$filename = implode('-', $filenameBits) . '-' . gmdate('Y-m-d') . '.csv';

header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename="' . $filename . '"');

$out = fopen('php://output', 'w');

// UTF-8 BOM so Excel (including Arabic text in fields) opens this correctly
// instead of guessing the wrong encoding.
fwrite($out, "\xEF\xBB\xBF");

fputcsv($out, ['Date', 'Branch', 'Status', 'Name', 'Contact', 'WhatsApp', 'UTM Source', 'UTM Medium', 'UTM Campaign', 'All Fields']);

foreach ($rows as $row) {
    $fields = $row['fields'] ?? [];
    $utm = $row['utm'] ?? [];

    $name = $fields['fullName'] ?? $fields['name'] ?? $fields['confirmName'] ?? '';
    $contact = $fields['email'] ?? $fields['contact'] ?? '';
    $whatsapp = $fields['whatsapp'] ?? '';

    $detailsParts = [];
    foreach ($fields as $key => $value) {
        if ($value === null || $value === '' || $value === []) continue;
        $display = is_array($value) ? implode(', ', $value) : (string) $value;
        $detailsParts[] = "$key: $display";
    }

    fputcsv($out, [
        $row['createdAt'] ?? '',
        $labels[$row['branch']] ?? $row['branch'] ?? '',
        $row['status'] ?? '',
        $name,
        $contact,
        $whatsapp,
        $utm['utm_source'] ?? '',
        $utm['utm_medium'] ?? '',
        $utm['utm_campaign'] ?? '',
        implode('; ', $detailsParts),
    ]);
}

fclose($out);
