require('dotenv').config();
const path = require('path');
const express = require('express');
const { basicAuth } = require('./auth');
const db = require('./db');
const { sendNotification, BRANCH_LABELS } = require('./mailer');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

const VALID_BRANCHES = Object.keys(BRANCH_LABELS);

// Minimal required-field check per branch — enough to block empty/garbage
// submissions without duplicating the full client-side validation here.
const REQUIRED_FIELDS = {
  team_track: ['fullName', 'email', 'whatsapp', 'declaration'],
  founder_cofounder: ['name', 'contact', 'ideaDescription'],
  affiliate_ambassador: ['name', 'contact', 'howPromote'],
  service: ['name', 'contact', 'needHelp'],
};

app.post('/api/submit', async (req, res) => {
  const { branch, fields, utm, website } = req.body || {};

  // Honeypot — a hidden field real users never fill in.
  if (website) {
    return res.status(200).json({ ok: true });
  }

  if (!VALID_BRANCHES.includes(branch)) {
    return res.status(400).json({ ok: false, error: 'Unknown application branch.' });
  }
  if (!fields || typeof fields !== 'object') {
    return res.status(400).json({ ok: false, error: 'Missing form fields.' });
  }

  const missing = (REQUIRED_FIELDS[branch] || []).filter((key) => {
    const v = fields[key];
    return v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0) || v === false;
  });
  if (missing.length) {
    return res.status(400).json({ ok: false, error: `Missing required fields: ${missing.join(', ')}` });
  }

  const record = db.addSubmission({
    branch,
    fields,
    utm: utm || {},
  });

  try {
    await sendNotification(record);
  } catch (err) {
    console.error('[mailer] failed to send notification:', err.message);
  }

  res.json({ ok: true, id: record.id });
});

// --- Admin (Basic Auth protected) ---
// Served from a directory OUTSIDE public/ on purpose: if it lived under
// public/admin, the earlier express.static(public) mount above would match
// /admin/* first and serve the dashboard with no auth check at all.
app.use('/admin', basicAuth, express.static(path.join(__dirname, '..', 'admin')));

app.get('/api/admin/submissions', basicAuth, (req, res) => {
  const { branch, status, from, to } = req.query;
  const rows = db.listSubmissions({ branch, status, from, to });
  res.json({ ok: true, rows, branchLabels: BRANCH_LABELS });
});

app.patch('/api/admin/submissions/:id/status', basicAuth, (req, res) => {
  const { status } = req.body || {};
  const allowed = ['New', 'Reviewed', 'Shortlisted', 'Rejected'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ ok: false, error: 'Invalid status.' });
  }
  const updated = db.updateStatus(req.params.id, status);
  if (!updated) return res.status(404).json({ ok: false, error: 'Not found.' });
  res.json({ ok: true, row: updated });
});

app.listen(PORT, () => {
  console.log(`Address Gateway Opportunities Hub running at http://localhost:${PORT}`);
  console.log(`Admin dashboard at http://localhost:${PORT}/admin  (Basic Auth: ${process.env.ADMIN_USER || 'admin'} / ${process.env.ADMIN_PASS ? '********' : 'changeme (default — set ADMIN_PASS!)'})`);
});
