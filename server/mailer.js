const nodemailer = require('nodemailer');

const BRANCH_LABELS = {
  team_track: 'Join a Team Track (Training & Internship Programme)',
  founder_cofounder: 'Pitch an Idea / Apply as Co-founder',
  affiliate_ambassador: 'Join as an Affiliate or Ambassador',
  service: 'Get a Service (Consulting / Training / Workshop)',
};

let transporter = null;
function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) return null;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || 'false') === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return transporter;
}

function fieldsToHtml(fields) {
  return Object.entries(fields || {})
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `<tr><td style="padding:4px 10px 4px 0;color:#5b6478;white-space:nowrap;vertical-align:top;">${escapeHtml(k)}</td><td style="padding:4px 0;color:#0b2340;">${escapeHtml(Array.isArray(v) ? v.join(', ') : String(v))}</td></tr>`)
    .join('');
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

async function sendNotification(submission) {
  const t = getTransporter();
  const branchLabel = BRANCH_LABELS[submission.branch] || submission.branch;
  const to = process.env.NOTIFY_EMAIL || 'cso@addressgateway.com';
  const siteUrl = process.env.SITE_URL || '';

  const subject = `New Opportunities Hub submission — ${branchLabel}`;
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;">
      <h2 style="color:#0b2340;margin-bottom:0;">New submission: ${escapeHtml(branchLabel)}</h2>
      <p style="color:#5b6478;margin-top:4px;">Received ${new Date(submission.createdAt).toLocaleString()}</p>
      <table style="border-collapse:collapse;width:100%;font-size:14px;">${fieldsToHtml(submission.fields)}</table>
      ${submission.utm && (submission.utm.utm_source || submission.utm.utm_medium || submission.utm.utm_campaign)
        ? `<p style="color:#8a93a6;font-size:12px;margin-top:16px;">UTM: ${escapeHtml(submission.utm.utm_source || '-')} / ${escapeHtml(submission.utm.utm_medium || '-')} / ${escapeHtml(submission.utm.utm_campaign || '-')}</p>`
        : ''}
      ${siteUrl ? `<p style="margin-top:16px;"><a href="${siteUrl.replace(/\/$/, '')}/admin/" style="color:#199fbd;">Open the admin dashboard →</a></p>` : ''}
    </div>`;

  if (!t) {
    console.warn('[mailer] SMTP not configured — skipping email send. Set SMTP_HOST/SMTP_USER/SMTP_PASS in .env.');
    console.warn(`[mailer] Would have sent to ${to}: ${subject}`);
    return { skipped: true };
  }

  return t.sendMail({
    from: process.env.SMTP_FROM || `"Address Gateway Opportunities Hub" <no-reply@addressgateway.com>`,
    to,
    subject,
    html,
  });
}

module.exports = { sendNotification, BRANCH_LABELS };
