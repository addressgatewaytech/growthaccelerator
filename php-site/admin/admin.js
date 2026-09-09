(function () {
  'use strict';

  var BRANCH_LABELS = {
    team_track: 'Team Track',
    founder_cofounder: 'Founder / Co-founder',
    affiliate_ambassador: 'Affiliate / Ambassador',
    service: 'Service',
  };

  var rowsEl = document.getElementById('rows');
  var emptyMsg = document.getElementById('emptyMsg');
  var statBar = document.getElementById('statBar');
  var filterBranch = document.getElementById('filterBranch');
  var filterStatus = document.getElementById('filterStatus');
  var filterFrom = document.getElementById('filterFrom');
  var filterTo = document.getElementById('filterTo');

  function nameFor(row) {
    var f = row.fields || {};
    return f.fullName || f.name || f.confirmName || '(no name given)';
  }

  function contactFor(row) {
    var f = row.fields || {};
    var parts = [];
    if (f.email) parts.push(f.email);
    if (f.whatsapp) parts.push(f.whatsapp);
    if (f.contact) parts.push(f.contact);
    return parts.join(' / ') || '—';
  }

  function keyInfoFor(row) {
    var f = row.fields || {};
    if (row.branch === 'team_track') return f.currentStatus || '';
    if (row.branch === 'founder_cofounder') return f.stage || '';
    if (row.branch === 'affiliate_ambassador') return f.programType || '';
    if (row.branch === 'service') return f.serviceType || f.businessName || '';
    return '';
  }

  function sourceFor(row) {
    var u = row.utm || {};
    var parts = [u.utm_source, u.utm_medium, u.utm_campaign].filter(Boolean);
    return parts.length ? parts.join(' / ') : 'Direct';
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function fieldsDetailHtml(fields) {
    var out = '';
    Object.keys(fields || {}).forEach(function (k) {
      var v = fields[k];
      if (v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)) return;
      out += '<dt>' + escapeHtml(k) + '</dt><dd>' + escapeHtml(Array.isArray(v) ? v.join(', ') : String(v)) + '</dd>';
    });
    return out || '<em>No additional fields.</em>';
  }

  function render(rows) {
    rowsEl.innerHTML = '';
    emptyMsg.style.display = rows.length ? 'none' : 'block';

    var counts = { New: 0, Reviewed: 0, Shortlisted: 0, Rejected: 0 };
    rows.forEach(function (r) { if (counts[r.status] !== undefined) counts[r.status]++; });
    statBar.innerHTML = Object.keys(counts).map(function (k) {
      return '<div><strong>' + counts[k] + '</strong><span>' + k + '</span></div>';
    }).join('') + '<div><strong>' + rows.length + '</strong><span>Total</span></div>';

    rows.forEach(function (row) {
      var tr = document.createElement('tr');
      var date = new Date(row.createdAt);
      var keyInfo = keyInfoFor(row);
      tr.innerHTML =
        '<td>' + date.toLocaleDateString() + '<br><span style="color:#8a93a6;">' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + '</span></td>' +
        '<td><span class="badge badge-' + row.branch + '">' + (BRANCH_LABELS[row.branch] || row.branch) + '</span></td>' +
        '<td>' + escapeHtml(nameFor(row)) + (keyInfo ? '<br><span style="color:#8a93a6;">' + escapeHtml(keyInfo) + '</span>' : '') +
          '<br><button class="fields-toggle" data-id="' + row.id + '">View all fields</button>' +
          '<dl class="fields-detail" id="detail-' + row.id + '">' + fieldsDetailHtml(row.fields) + '</dl>' +
        '</td>' +
        '<td>' + escapeHtml(contactFor(row)) + '</td>' +
        '<td>' + escapeHtml(sourceFor(row)) + '</td>' +
        '<td><select class="status status-' + row.status + '" data-id="' + row.id + '">' +
          ['New', 'Reviewed', 'Shortlisted', 'Rejected'].map(function (s) {
            return '<option value="' + s + '"' + (s === row.status ? ' selected' : '') + '>' + s + '</option>';
          }).join('') +
        '</select></td>';
      rowsEl.appendChild(tr);
    });

    rowsEl.querySelectorAll('.fields-toggle').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.getElementById('detail-' + btn.getAttribute('data-id')).classList.toggle('open');
      });
    });

    rowsEl.querySelectorAll('select.status').forEach(function (sel) {
      sel.addEventListener('change', function () {
        var id = sel.getAttribute('data-id');
        var newStatus = sel.value;
        sel.className = 'status status-' + newStatus;
        fetch('/admin/update-status.php?id=' + encodeURIComponent(id), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        }).catch(function () { /* leave the UI change in place; refresh will resync */ });
      });
    });
  }

  function load() {
    var qs = new URLSearchParams();
    if (filterBranch.value) qs.set('branch', filterBranch.value);
    if (filterStatus.value) qs.set('status', filterStatus.value);
    if (filterFrom.value) qs.set('from', filterFrom.value + 'T00:00:00.000Z');
    if (filterTo.value) qs.set('to', filterTo.value + 'T23:59:59.999Z');

    fetch('/admin/list.php?' + qs.toString())
      .then(function (res) { return res.json(); })
      .then(function (data) { render(data.rows || []); })
      .catch(function () { rowsEl.innerHTML = ''; emptyMsg.textContent = 'Could not load submissions.'; emptyMsg.style.display = 'block'; });
  }

  [filterBranch, filterStatus, filterFrom, filterTo].forEach(function (el) {
    el.addEventListener('change', load);
  });

  load();
  setInterval(load, 60000); // keep the dashboard fresh without a manual refresh
})();
