<?php
// Pushes a copy of each submission to a Google Sheet via a Google Apps
// Script Web App — see google-apps-script/Code.gs and
// php-site/GOOGLE_SHEETS_SETUP.md. Failure here never blocks a submission;
// the JSON file + admin dashboard are always the source of truth.

function sheets_push($submission, $config) {
    $url = $config['google_sheet_webapp_url'] ?? '';
    if (empty($url)) {
        return false; // not configured — silently skip
    }

    $payload = json_encode([
        'secret' => $config['google_sheet_secret'] ?? '',
        'createdAt' => $submission['createdAt'],
        'branch' => $submission['branch'],
        'status' => $submission['status'],
        'fields' => $submission['fields'],
        'utm' => $submission['utm'],
    ]);

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $payload,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 8,
        // Google Apps Script web app URLs redirect once before serving the
        // response — follow that or you'll just get the redirect back.
        CURLOPT_FOLLOWLOCATION => true,
    ]);
    $response = curl_exec($ch);
    $err = curl_error($ch);
    curl_close($ch);

    if ($err) {
        error_log('[sheets] push failed: ' . $err);
        return false;
    }

    $data = json_decode($response, true);
    if (!is_array($data) || empty($data['ok'])) {
        error_log('[sheets] push rejected: ' . $response);
        return false;
    }

    return true;
}
