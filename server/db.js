const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'submissions.json');

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]', 'utf8');
}

function readAll() {
  ensureStore();
  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  try {
    return JSON.parse(raw || '[]');
  } catch (e) {
    return [];
  }
}

function writeAll(rows) {
  ensureStore();
  const tmp = DATA_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(rows, null, 2), 'utf8');
  fs.renameSync(tmp, DATA_FILE);
}

function addSubmission(entry) {
  const rows = readAll();
  const record = {
    id: crypto.randomUUID(),
    status: 'New',
    createdAt: new Date().toISOString(),
    ...entry,
  };
  rows.push(record);
  writeAll(rows);
  return record;
}

function listSubmissions({ branch, status, from, to } = {}) {
  let rows = readAll();
  if (branch) rows = rows.filter((r) => r.branch === branch);
  if (status) rows = rows.filter((r) => r.status === status);
  if (from) rows = rows.filter((r) => r.createdAt >= from);
  if (to) rows = rows.filter((r) => r.createdAt <= to);
  return rows.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

function getSubmission(id) {
  return readAll().find((r) => r.id === id) || null;
}

function updateStatus(id, status) {
  const rows = readAll();
  const idx = rows.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  rows[idx].status = status;
  rows[idx].updatedAt = new Date().toISOString();
  writeAll(rows);
  return rows[idx];
}

module.exports = { addSubmission, listSubmissions, getSubmission, updateStatus };
