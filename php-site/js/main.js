(function () {
  'use strict';

  var WA_NUMBER = '97450494933';

  function waLink(message) {
    return 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(message);
  }

  // ---------- Mobile nav ----------
  var navToggle = document.getElementById('navToggle');
  var siteNav = document.getElementById('siteNav');
  if (navToggle && siteNav) {
    navToggle.addEventListener('click', function () {
      var open = siteNav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    siteNav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        siteNav.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ---------- Hero WhatsApp CTA ----------
  var heroWa = document.getElementById('heroWa');
  if (heroWa) heroWa.href = waLink('Hi, I’m interested in the Address Gateway Opportunities page.');

  // ---------- Work With Us WhatsApp CTAs ----------
  document.querySelectorAll('.wa-cta').forEach(function (el) {
    el.href = waLink(el.getAttribute('data-msg') || 'Hi, I’d like to talk to Address Gateway.');
    el.target = '_blank';
    el.rel = 'noopener';
  });

  // ---------- UTM capture ----------
  var utm = { utm_source: '', utm_medium: '', utm_campaign: '' };
  try {
    var params = new URLSearchParams(window.location.search);
    utm.utm_source = params.get('utm_source') || '';
    utm.utm_medium = params.get('utm_medium') || '';
    utm.utm_campaign = params.get('utm_campaign') || '';
    if (utm.utm_source || utm.utm_medium || utm.utm_campaign) {
      sessionStorage.setItem('ag_utm', JSON.stringify(utm));
    } else {
      var stored = sessionStorage.getItem('ag_utm');
      if (stored) utm = JSON.parse(stored);
    }
  } catch (e) { /* ignore */ }

  // ---------- Application form: branch switching ----------
  var form = document.getElementById('applyForm');
  var branchRadios = document.querySelectorAll('input[name="branchSelect"]');
  var branchFieldsets = document.querySelectorAll('.form-branch');

  function setBranch(branch) {
    branchFieldsets.forEach(function (fs) {
      var isActive = fs.getAttribute('data-branch') === branch;
      fs.classList.toggle('active', isActive);
      fs.disabled = !isActive;
    });
    var radio = document.querySelector('input[name="branchSelect"][value="' + branch + '"]');
    if (radio) radio.checked = true;
  }

  branchRadios.forEach(function (r) {
    r.addEventListener('change', function () {
      setBranch(r.value);
    });
  });

  // "Apply" trigger buttons throughout the page
  document.querySelectorAll('.js-apply').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var branch = btn.getAttribute('data-branch');
      setBranch(branch);

      // Pre-fill helper fields where the CTA already tells us the intent.
      if (branch === 'founder_cofounder' && btn.getAttribute('data-stage')) {
        var stageVal = btn.getAttribute('data-stage') === 'founder'
          ? 'Founder — I have a startup idea'
          : 'Co-founder — I want to join an existing venture';
        var stageInput = document.querySelector('input[name="stage"][value="' + stageVal + '"]');
        if (stageInput) stageInput.checked = true;
      }
      if (branch === 'affiliate_ambassador' && btn.getAttribute('data-program')) {
        var progVal = btn.getAttribute('data-program') === 'affiliate' ? 'Affiliate' : 'Ambassador';
        var progInput = document.querySelector('input[name="programType"][value="' + progVal + '"]');
        if (progInput) progInput.checked = true;
      }

      document.getElementById('apply').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // "Other — please specify" reveal: nothing hidden by default (kept simple/always visible)
  // to stay crawlable and avoid extra JS-only logic; inputs are optional unless "Other" is picked.

  // ---------- Form submission ----------
  var formMsg = document.getElementById('formMsg');

  function showMsg(text, type) {
    formMsg.textContent = text;
    formMsg.className = 'form-msg show ' + type;
  }

  function trackConversion(branch) {
    try {
      if (typeof gtag === 'function') {
        gtag('event', 'generate_lead', { branch: branch });
      }
    } catch (e) { /* ignore */ }
    try {
      if (typeof fbq === 'function') {
        fbq('track', 'Lead', { branch: branch });
      }
    } catch (e) { /* ignore */ }
  }

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var activeFieldset = document.querySelector('.form-branch.active');
      var branch = activeFieldset.getAttribute('data-branch');

      // A <fieldset> is always "valid" per spec regardless of its children —
      // checkValidity() must be called on the <form> itself. That's still
      // safe here because disabled controls (the inactive branches) are
      // excluded from constraint validation, so only the active branch's
      // required fields are actually checked.
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      // FormData requires an actual <form>, not a <fieldset> — the inactive
      // branches are `disabled`, so their controls are excluded automatically
      // per the HTML spec, giving us just the active branch's fields anyway.
      var formData = new FormData(form);
      var fields = {};
      formData.forEach(function (value, key) {
        if (key.endsWith('[]')) {
          var cleanKey = key.slice(0, -2);
          if (!fields[cleanKey]) fields[cleanKey] = [];
          fields[cleanKey].push(value);
        } else if (key === 'declaration') {
          fields[key] = true;
        } else {
          fields[key] = value;
        }
      });
      delete fields.website; // honeypot — read separately below
      delete fields.branchSelect; // already captured as `branch`

      var websiteField = form.querySelector('input[name="website"]');
      var payload = {
        branch: branch,
        fields: fields,
        utm: utm,
        website: websiteField ? websiteField.value : '',
      };

      var submitBtn = activeFieldset.querySelector('button[type="submit"]');
      var originalLabel = submitBtn ? submitBtn.innerHTML : '';
      if (submitBtn) { submitBtn.disabled = true; submitBtn.innerHTML = 'Submitting&hellip;'; }
      formMsg.className = 'form-msg';

      fetch('/submit.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
        .then(function (res) { return res.json().then(function (data) { return { ok: res.ok, data: data }; }); })
        .then(function (result) {
          if (result.ok && result.data.ok) {
            showMsg('Thank you — your submission has been received. Our team will be in touch.', 'success');
            trackConversion(branch);
            form.reset(); // .reset() only exists on <form>, not the fieldset
            setBranch(branch); // reset() reverts the radios to their default; keep the branch the user was on visible
          } else {
            showMsg(result.data.error || 'Something went wrong. Please try again or reach us on WhatsApp.', 'error');
          }
        })
        .catch(function (err) {
          console.error('Application form submission failed:', err);
          showMsg('Network error — please check your connection and try again.', 'error');
        })
        .finally(function () {
          if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = originalLabel; }
        });
    });
  }

  // ---------- Footer year ----------
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
