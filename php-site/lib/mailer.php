<?php
require_once __DIR__ . '/PHPMailer.php';
require_once __DIR__ . '/SMTP.php';
require_once __DIR__ . '/Exception.php';

use PHPMailer\PHPMailer\PHPMailer;

function mailer_branch_labels() {
    return [
        'team_track' => 'Join a Team Track (Training & Internship Programme)',
        'founder_cofounder' => 'Pitch an Idea / Apply as Co-founder',
        'affiliate_ambassador' => 'Join as an Affiliate or Ambassador',
        'service' => 'Get a Service (Consulting / Training / Workshop)',
    ];
}

function mailer_fields_to_html($fields) {
    $out = '';
    foreach ($fields as $key => $value) {
        if ($value === null || $value === '' || $value === []) continue;
        $display = is_array($value) ? implode(', ', $value) : (string) $value;
        $out .= '<tr><td style="padding:4px 10px 4px 0;color:#5b6478;white-space:nowrap;vertical-align:top;">'
            . htmlspecialchars($key) . '</td><td style="padding:4px 0;color:#0b2340;">'
            . htmlspecialchars($display) . '</td></tr>';
    }
    return $out;
}

function mailer_send_notification($submission, $config) {
    if (empty($config['smtp_host'])) {
        error_log('[mailer] SMTP not configured — skipping email for submission ' . $submission['id']);
        return false;
    }

    $labels = mailer_branch_labels();
    $branchLabel = $labels[$submission['branch']] ?? $submission['branch'];
    $to = $config['notify_email'] ?: 'cso@addressgateway.com';
    $siteUrl = rtrim($config['site_url'] ?? '', '/');

    $subject = 'New Opportunities Hub submission — ' . $branchLabel;
    $html = '<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;">'
        . '<h2 style="color:#0b2340;margin-bottom:0;">New submission: ' . htmlspecialchars($branchLabel) . '</h2>'
        . '<p style="color:#5b6478;margin-top:4px;">Received ' . htmlspecialchars($submission['createdAt']) . '</p>'
        . '<table style="border-collapse:collapse;width:100%;font-size:14px;">' . mailer_fields_to_html($submission['fields']) . '</table>';
    if ($siteUrl) {
        $html .= '<p style="margin-top:16px;"><a href="' . htmlspecialchars($siteUrl) . '/admin/" style="color:#199fbd;">Open the admin dashboard &rarr;</a></p>';
    }
    $html .= '</div>';

    $mail = new PHPMailer(true);
    try {
        $mail->isSMTP();
        $mail->Host = $config['smtp_host'];
        $mail->Port = (int) $config['smtp_port'];
        $mail->SMTPAuth = !empty($config['smtp_user']);
        if ($mail->SMTPAuth) {
            $mail->Username = $config['smtp_user'];
            $mail->Password = $config['smtp_pass'];
        }
        if (!empty($config['smtp_secure'])) {
            $mail->SMTPSecure = $config['smtp_secure'];
        }
        $mail->setFrom($config['smtp_from_email'], $config['smtp_from_name']);
        $mail->addAddress($to);
        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body = $html;
        $mail->send();
        return true;
    } catch (Exception $e) {
        error_log('[mailer] failed to send notification: ' . $mail->ErrorInfo);
        return false;
    }
}
