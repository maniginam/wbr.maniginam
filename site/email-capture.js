/* Email Capture Lead Magnet - WBR Local */
(function() {
  'use strict';

  var CONFIG = {
    siteName: 'WBR Local',
    leadMagnet: 'WBR Parish Resource Guide',
    ctaText: 'Get our free WBR Parish Resource Guide \u2014 emergency contacts, garbage schedules, utility setup, and everything newcomers need in one PDF.',
    buttonText: 'Send Me the Guide',
    popupDelay: 30000,
    scrollThreshold: 0.5,
    storageKey: 'wbr_local_email_capture',
    endpoint: 'https://4eu5pt6bu9.execute-api.us-west-2.amazonaws.com'
  };

  function hasDismissed(type) {
    try {
      var data = JSON.parse(localStorage.getItem(CONFIG.storageKey) || '{}');
      return data['dismissed_' + type] === true;
    } catch(e) { return false; }
  }

  function setDismissed(type) {
    try {
      var data = JSON.parse(localStorage.getItem(CONFIG.storageKey) || '{}');
      data['dismissed_' + type] = true;
      localStorage.setItem(CONFIG.storageKey, JSON.stringify(data));
    } catch(e) {}
  }

  function hasSubscribed() {
    try {
      var data = JSON.parse(localStorage.getItem(CONFIG.storageKey) || '{}');
      return data.subscribed === true;
    } catch(e) { return false; }
  }

  function storeSubmission(name, email) {
    try {
      var data = JSON.parse(localStorage.getItem(CONFIG.storageKey) || '{}');
      data.subscribed = true;
      data.name = name;
      data.email = email;
      data.timestamp = new Date().toISOString();
      if (!data.submissions) data.submissions = [];
      data.submissions.push({ name: name, email: email, ts: data.timestamp });
      localStorage.setItem(CONFIG.storageKey, JSON.stringify(data));
    } catch(e) {}
  }

  function createForm(id, extraClass, title, desc, btn) {
    var box = document.createElement('div');
    box.className = 'email-capture ' + extraClass;
    box.id = id;
    box.innerHTML =
      '<div class="email-capture-icon">\uD83C\uDFE1</div>' +
      '<h3 class="email-capture-title">' + (title || CONFIG.leadMagnet) + '</h3>' +
      '<p class="email-capture-desc">' + (desc || CONFIG.ctaText) + '</p>' +
      '<form class="email-capture-form" action="' + CONFIG.endpoint + '" method="POST">' +
        '<input type="text" name="company" class="email-capture-hp" tabindex="-1" autocomplete="off" aria-hidden="true">' +
        '<div class="email-capture-fields">' +
          '<input type="text" name="name" placeholder="First name" required class="email-capture-input">' +
          '<input type="email" name="email" placeholder="Email address" required class="email-capture-input">' +
        '</div>' +
        '<button type="submit" class="email-capture-btn">' + (btn || CONFIG.buttonText) + '</button>' +
        '<p class="email-capture-privacy">No spam, ever. Unsubscribe anytime.</p>' +
      '</form>' +
      '<div class="email-capture-success" style="display:none;">' +
        '<p class="email-capture-success-msg">Check your inbox! Your WBR resource guide is on the way.</p>' +
      '</div>';
    return box;
  }

  function createPopup() {
    var overlay = document.createElement('div');
    overlay.className = 'email-capture-overlay';
    overlay.id = 'email-capture-overlay';
    overlay.style.display = 'none';

    var popup = createForm('email-capture-popup-box', 'email-capture-popup');
    var closeBtn = document.createElement('button');
    closeBtn.className = 'email-capture-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.addEventListener('click', function() {
      overlay.style.display = 'none';
      document.body.style.overflow = '';
      setDismissed('popup');
    });
    popup.insertBefore(closeBtn, popup.firstChild);

    overlay.appendChild(popup);
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) {
        overlay.style.display = 'none';
        document.body.style.overflow = '';
        setDismissed('popup');
      }
    });

    document.body.appendChild(overlay);
    return overlay;
  }

  function showPopup(overlay) {
    if (hasSubscribed() || hasDismissed('popup')) return;
    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  function attachFormHandler(container) {
    var form = container.querySelector('.email-capture-form');
    var success = container.querySelector('.email-capture-success');
    if (!form) return;
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      var name = form.querySelector('input[name="name"]').value.trim();
      var email = form.querySelector('input[name="email"]').value.trim();
      var company = form.querySelector('input[name="company"]'); // honeypot
      if (!name || !email) return;

      // Honeypot: a real user never fills this. If it's filled, skip the backend
      // entirely (show the same success UI so a bot learns nothing).
      var isBot = company && company.value;

      // Persist to the backend (best-effort). UX never blocks on the network:
      // success shows immediately; a backend failure falls back to localStorage.
      if (!isBot) {
        try {
          fetch(CONFIG.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name, email: email, company: '', source: CONFIG.leadMagnet })
          }).catch(function() {});
        } catch (err) {}
      }

      storeSubmission(name, email);
      form.style.display = 'none';
      success.style.display = 'block';
      var allBoxes = document.querySelectorAll('.email-capture');
      for (var i = 0; i < allBoxes.length; i++) {
        var f = allBoxes[i].querySelector('.email-capture-form');
        var s = allBoxes[i].querySelector('.email-capture-success');
        if (f) f.style.display = 'none';
        if (s) s.style.display = 'block';
      }
    });
  }

  function init() {
    if (hasSubscribed()) return;

    // Homepage: a standalone "new articles" subscribe box.
    var homeTarget = document.getElementById('home-subscribe');
    if (homeTarget) {
      var homeForm = createForm(
        'email-capture-home', 'email-capture-inline',
        'Get New WBR Articles by Email',
        'New local guides and West Baton Rouge updates, straight to your inbox.',
        'Subscribe'
      );
      homeTarget.appendChild(homeForm);
      attachFormHandler(homeForm);
    }

    var content = document.querySelector('.article-content');
    if (!content) return;

    var h2s = content.querySelectorAll('h2');
    if (h2s.length >= 2) {
      var inlineForm = createForm('email-capture-inline', 'email-capture-inline');
      h2s[1].parentNode.insertBefore(inlineForm, h2s[1]);
      attachFormHandler(inlineForm);
    }

    var article = content.querySelector('article') || content;
    var bottomForm = createForm('email-capture-bottom', 'email-capture-bottom');
    article.appendChild(bottomForm);
    attachFormHandler(bottomForm);

    var overlay = createPopup();
    attachFormHandler(overlay);

    var popupTimer = setTimeout(function() {
      showPopup(overlay);
    }, CONFIG.popupDelay);

    var scrollTriggered = false;
    window.addEventListener('scroll', function() {
      if (scrollTriggered) return;
      var scrollPct = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
      if (scrollPct >= CONFIG.scrollThreshold) {
        scrollTriggered = true;
        clearTimeout(popupTimer);
        showPopup(overlay);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
