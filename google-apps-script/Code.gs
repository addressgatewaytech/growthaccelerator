// Address Gateway Opportunities Hub — Google Sheets receiver
//
// Paste this into Extensions > Apps Script on the target Google Sheet,
// then deploy it as a Web App (see php-site/GOOGLE_SHEETS_SETUP.md for the
// full walkthrough). Every form submission gets appended as one row here,
// in addition to being saved in data/submissions.json and shown in /admin —
// this is just a second, easily-shared copy of the same data.

var SHEET_NAME = 'Submissions';

// A shared secret so random internet traffic can't write junk rows into
// your sheet. Set this to any string you like, then put the SAME string
// in config.php's `google_sheet_secret`.
var SHARED_SECRET = 'change-this-to-a-random-string';

var HEADERS = [
  'Timestamp', 'Branch', 'Status', 'Name', 'Contact', 'WhatsApp',
  'UTM Source', 'UTM Medium', 'UTM Campaign', 'All Fields'
];

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);

    if (body.secret !== SHARED_SECRET) {
      return jsonResponse({ ok: false, error: 'Invalid secret' });
    }

    var sheet = getOrCreateSheet();
    var fields = body.fields || {};
    var utm = body.utm || {};

    var name = fields.fullName || fields.name || fields.confirmName || '';
    var contact = fields.email || fields.contact || '';
    var whatsapp = fields.whatsapp || '';

    var detailsLines = [];
    for (var key in fields) {
      var val = fields[key];
      if (val === undefined || val === null || val === '') continue;
      if (Array.isArray(val)) val = val.join(', ');
      detailsLines.push(key + ': ' + val);
    }

    sheet.appendRow([
      body.createdAt || new Date().toISOString(),
      body.branch || '',
      body.status || 'New',
      name,
      contact,
      whatsapp,
      utm.utm_source || '',
      utm.utm_medium || '',
      utm.utm_campaign || '',
      detailsLines.join('\n'),
    ]);

    return jsonResponse({ ok: true });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) });
  }
}

function getOrCreateSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// Run this once manually from the Apps Script editor (select doGet from the
// function dropdown, click Run) if you want to sanity-check permissions —
// it just confirms the script can reach the spreadsheet.
function doGet() {
  return jsonResponse({ ok: true, message: 'Address Gateway Opportunities Hub sheet receiver is alive.' });
}
