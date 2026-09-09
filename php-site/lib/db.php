<?php
// Tiny JSON-file datastore — no MySQL needed. Safe for the lead volumes a
// page like this sees; every read/write is guarded with flock() so two
// simultaneous submissions can't corrupt the file.

define('DATA_FILE', __DIR__ . '/../data/submissions.json');

function db_ensure_store() {
    $dir = dirname(DATA_FILE);
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
    if (!file_exists(DATA_FILE)) {
        file_put_contents(DATA_FILE, '[]');
    }
}

function db_read_all() {
    db_ensure_store();
    $fp = fopen(DATA_FILE, 'r');
    flock($fp, LOCK_SH);
    $raw = stream_get_contents($fp);
    flock($fp, LOCK_UN);
    fclose($fp);
    $rows = json_decode($raw, true);
    return is_array($rows) ? $rows : [];
}

function db_write_all($rows) {
    db_ensure_store();
    $fp = fopen(DATA_FILE, 'c');
    flock($fp, LOCK_EX);
    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, json_encode($rows, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);
}

function db_uuid() {
    $data = random_bytes(16);
    $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
    $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}

function db_add_submission($branch, $fields, $utm) {
    $rows = db_read_all();
    $record = [
        'id' => db_uuid(),
        'status' => 'New',
        'createdAt' => gmdate('Y-m-d\TH:i:s.v\Z'),
        'branch' => $branch,
        'fields' => $fields,
        'utm' => $utm,
    ];
    $rows[] = $record;
    db_write_all($rows);
    return $record;
}

function db_list_submissions($branch = null, $status = null, $from = null, $to = null) {
    $rows = db_read_all();
    if ($branch) {
        $rows = array_values(array_filter($rows, fn($r) => $r['branch'] === $branch));
    }
    if ($status) {
        $rows = array_values(array_filter($rows, fn($r) => $r['status'] === $status));
    }
    if ($from) {
        $rows = array_values(array_filter($rows, fn($r) => $r['createdAt'] >= $from));
    }
    if ($to) {
        $rows = array_values(array_filter($rows, fn($r) => $r['createdAt'] <= $to));
    }
    usort($rows, fn($a, $b) => strcmp($b['createdAt'], $a['createdAt']));
    return $rows;
}

function db_update_status($id, $status) {
    $rows = db_read_all();
    foreach ($rows as $i => $row) {
        if ($row['id'] === $id) {
            $rows[$i]['status'] = $status;
            $rows[$i]['updatedAt'] = gmdate('Y-m-d\TH:i:s.v\Z');
            db_write_all($rows);
            return $rows[$i];
        }
    }
    return null;
}
