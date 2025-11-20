// VXN CRM – Main JS
// - Page fade transitions
// - Mobile navigation drawer
// - Scroll reveal animations
// - Contact form validation

(function () {
  var transitionDurationMs = 380;
  // Generation token used to cancel in-flight typing animations
  var typingGeneration = 0;

  function onReady() {
    // Allow CSS transition to apply after initial render
    requestAnimationFrame(function () {
      document.body.classList.add('is-ready');
    });

    setupInternalLinkTransitions();
    setupMobileDrawer();
    setupScrollReveal();
    setupFormValidation();
    setupTypingEffect();
    setupHeaderScrollState();
    setupEnhancedContactForm();
    hideDuplicateHeroCtaOnHome();
    setupSeoMeta();
  }

  function isInternalLink(anchor) {
    try {
      var url = new URL(anchor.href);
      return url.origin === window.location.origin;
    } catch (e) {
      return false;
    }
  }

  // -----------------------------
  // SEO Meta Helper
  // -----------------------------
  function setupSeoMeta(){
    try {
      var head = document.head;
      var loc = window.location;
      var canonicalHref = loc.origin + loc.pathname.replace(/index\.html$/, '');
      // Canonical
      var link = head.querySelector('link[rel="canonical"]');
      if (!link){ link = document.createElement('link'); link.setAttribute('rel','canonical'); head.appendChild(link); }
      link.setAttribute('href', canonicalHref);

      // Basic OG/Twitter meta if missing
      function setMeta(name, content){
        if (!content) return;
        var m = head.querySelector('meta[name="'+name+'"], meta[property="'+name+'"]');
        if (!m){ m = document.createElement('meta'); if (name.indexOf(':')!==-1){ m.setAttribute('property', name);} else { m.setAttribute('name', name);} head.appendChild(m); }
        m.setAttribute('content', content);
      }

      var title = document.title || 'VXN VISION';
      var descMeta = head.querySelector('meta[name="description"]');
      var desc = descMeta ? (descMeta.getAttribute('content')||'') : '';
      setMeta('og:title', title);
      setMeta('og:description', desc);
      setMeta('og:url', canonicalHref);
      setMeta('og:type', 'website');
      setMeta('twitter:card', 'summary_large_image');
      setMeta('twitter:title', title);
      setMeta('twitter:description', desc);
    } catch(e) {}
  }

  // Hide duplicate CTA in homepage hero when both buttons link to same page
  function hideDuplicateHeroCtaOnHome(){
    try {
      var hero = document.querySelector('.hero');
      if (!hero) return;
      var ctas = Array.prototype.slice.call(hero.querySelectorAll('.hero-ctas .btn, .hero-ctas .btn-primary'));
      if (ctas.length < 2) return;
      var href1 = (ctas[0].getAttribute('href') || '').trim();
      var href2 = (ctas[1].getAttribute('href') || '').trim();
      if (href1 && href2 && href1 === href2) {
        // Keep the primary if present; otherwise keep the first
        var keep = hero.querySelector('.hero-ctas .btn-primary') || ctas[0];
        ctas.forEach(function(btn){ if (btn !== keep) btn.parentElement && btn.parentElement.removeChild(btn); });
      }
    } catch(e) {}
  }

  function setupHeaderScrollState(){
    var header = document.querySelector('.site-header');
    if (!header) return;
    function onScroll(){
      var y = window.scrollY || document.documentElement.scrollTop || 0;
      if (y > 6) header.classList.add('scrolled'); else header.classList.remove('scrolled');
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function setupInternalLinkTransitions() {
    document.addEventListener('click', function (e) {
      var anchor = e.target.closest('a');
      if (!anchor) return;
      var targetAttr = anchor.getAttribute('target');
      var downloadAttr = anchor.getAttribute('download');
      var skipTransition = anchor.hasAttribute('data-no-transition');

      if (skipTransition || targetAttr === '_blank' || downloadAttr !== null || !isInternalLink(anchor)) {
        return;
      }

      e.preventDefault();
      var href = anchor.getAttribute('href');
      if (!href || href.startsWith('#')) {
        // Anchor within the page
        if (href) {
          var id = href.slice(1);
          var el = document.getElementById(id);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
          }
        }
        return;
      }

      document.body.classList.add('fade-out');
      setTimeout(function () { window.location.assign(href); }, transitionDurationMs);
    });

    // Handle BFCache back-forward to remove fade-out quickly
    window.addEventListener('pageshow', function (event) {
      if (event.persisted) {
        document.body.classList.remove('fade-out');
        document.body.classList.add('is-ready');
      }
    });
  }

  function setupMobileDrawer() {
    // Ensure only a single nav toggle exists
    var allToggles = Array.prototype.slice.call(document.querySelectorAll('.nav-toggle'));
    if (allToggles.length > 1) {
      allToggles.slice(1).forEach(function (btn) {
        if (btn && btn.parentElement) btn.parentElement.removeChild(btn);
      });
    }

    var toggle = document.querySelector('.nav-toggle');
    var drawer = document.querySelector('.mobile-drawer');
    if (!toggle || !drawer) return;

    function closeDrawer() {
      drawer.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      drawer.hidden = true;
      // Prevent body scroll when drawer is open
      document.body.style.overflow = '';
      document.body.classList.remove('drawer-open');
    }

    function openDrawer() {
      drawer.classList.add('open');
      toggle.setAttribute('aria-expanded', 'true');
      drawer.hidden = false;
      // Prevent body scroll when drawer is open
      document.body.style.overflow = 'hidden';
      document.body.classList.add('drawer-open');
    }

    toggle.addEventListener('click', function () {
      var isOpen = drawer.classList.contains('open');
      if (isOpen) {
        closeDrawer();
      } else {
        openDrawer();
      }
    });

    drawer.addEventListener('click', function (e) {
      var anchor = e.target.closest('a');
      if (anchor) {
        closeDrawer();
        return;
      }
      var langBtn = e.target.closest('.lang-switch [data-lang]');
      if (langBtn) {
        // Let i18n handler run, then close the drawer to reveal changes
        setTimeout(closeDrawer, 0);
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeDrawer();
    });

    // Close drawer on window resize to prevent layout issues
    window.addEventListener('resize', function() {
      if (window.innerWidth > 860) {
        closeDrawer();
      }
    });
  }

  function setupScrollReveal() {
    var elements = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
    if (!('IntersectionObserver' in window) || elements.length === 0) {
      elements.forEach(function (el) { el.classList.add('reveal-visible'); });
      return;
    }

    var timers = new WeakMap();
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var el = entry.target;
        var revealOnce = el.hasAttribute('data-reveal-once');
        if (entry.isIntersecting) {
          if (el.classList.contains('metric')) {
            runCountUp(el);
          }
          var delay = parseInt(el.getAttribute('data-reveal-delay') || '0', 10);
          if (timers.has(el)) { clearTimeout(timers.get(el)); }
          var id = setTimeout(function () { el.classList.add('reveal-visible'); }, isNaN(delay) ? 0 : delay);
          timers.set(el, id);
          if (revealOnce) observer.unobserve(el);
        } else {
          if (!revealOnce) {
            if (timers.has(el)) { clearTimeout(timers.get(el)); timers.delete(el); }
            el.classList.remove('reveal-visible');
          }
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.15 });

    elements.forEach(function (el) { observer.observe(el); });
  }

  // Count-up animation for metrics
  function runCountUp(metricEl){
    try {
      var strong = metricEl.querySelector('strong');
      if (!strong) return;
      if (strong.getAttribute('data-countup')) return; // already run
      var text = strong.textContent.trim();
      var isPercent = text.indexOf('%') !== -1;
      var isPlus = text.indexOf('+') !== -1;
      var hasX = /x$/i.test(text);
      var clean = text.replace(/[^0-9.]/g, '');
      var target = parseFloat(clean);
      if (isNaN(target)) return;
      strong.setAttribute('data-countup', '1');
      var duration = 1200;
      var start = null;
      function step(ts){
        if (!start) start = ts;
        var p = Math.min(1, (ts - start) / duration);
        var val = Math.floor(target * p * 100) / 100;
        var prefix = isPlus ? '+' : '';
        var suffix = (isPercent ? '%' : '') + (hasX ? 'x' : '');
        strong.textContent = prefix + (val.toFixed(val % 1 === 0 ? 0 : 1)) + suffix;
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    } catch(e) {}
  }

  function setupFormValidation() {
    var form = document.querySelector('form[data-validate="contact"]');
    if (!form) return;

    var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    var topAlert;

    function showError(field, message) {
      var container = field.closest('.field') || field.parentElement;
      if (!container) return;
      var error = container.querySelector('.error');
      if (!error) {
        error = document.createElement('div');
        error.className = 'error';
        error.setAttribute('role', 'alert');
        container.appendChild(error);
      }
      error.textContent = message;
      field.setAttribute('aria-invalid', 'true');
    }

    function clearError(field) {
      var container = field.closest('.field') || field.parentElement;
      if (!container) return;
      var error = container.querySelector('.error');
      if (error) error.textContent = '';
      field.removeAttribute('aria-invalid');
    }

    function getRequiredFields(){
      return [
        form.querySelector('input[name="name"]'),
        form.querySelector('input[name="email"]'),
        form.querySelector('input[name="company"]'),
        form.querySelector('input[name="team_size"]'),
        form.querySelector('textarea[name="message"]')
      ].filter(function(f){ return !!f; });
    }

    function updateTopAlert(count){
      if (!topAlert){
        topAlert = document.createElement('div');
        topAlert.className = 'form-alert error';
        topAlert.setAttribute('role', 'alert');
        // insert after progress bar for visibility
        var progress = form.querySelector('.form-progress');
        if (progress && progress.parentElement){
          progress.parentElement.insertBefore(topAlert, progress.nextSibling);
        } else {
          form.insertBefore(topAlert, form.firstChild);
        }
      }
      if (count > 0){
        topAlert.textContent = count + (count === 1 ? ' required field is missing.' : ' required fields are missing.');
        topAlert.hidden = false;
      } else {
        topAlert.hidden = true;
      }
    }

    function validateField(field){
      if (!field) return true;
      var value = (field.value || '').trim();
      var ok = true;
      clearError(field);
      if (!value){
        ok = false;
        showError(field, 'This field is required.');
      } else if (field.name === 'email' && !emailPattern.test(value)){
        ok = false;
        showError(field, 'Enter a valid email address.');
      }
      field.classList.toggle('is-invalid', !ok);
      return ok;
    }

    // Live validation on blur and input for required fields
    var allFields = getRequiredFields();
    allFields.forEach(function(f){
      f.addEventListener('blur', function(){ validateField(f); });
      f.addEventListener('input', function(){
        validateField(f);
        var req = getRequiredFields();
        var missing = req.filter(function(el){ return !(el.value && el.value.trim()); }).length;
        updateTopAlert(missing);
      });
    });

    form.addEventListener('submit', function (e) {
      var isValid = true;
      var name = form.querySelector('input[name="name"]');
      var email = form.querySelector('input[name="email"]');
      var company = form.querySelector('input[name="company"]');
      var teamSize = form.querySelector('input[name="team_size"]');
      var message = form.querySelector('textarea[name="message"]');

      var fields = [name, email, company, teamSize, message];
      var firstInvalid = null;
      fields.forEach(function(field){
        if (!field) return;
        var ok = validateField(field);
        if (!ok && !firstInvalid) firstInvalid = field;
        isValid = isValid && ok;
      });

      if (email && email.value && !emailPattern.test(email.value)) {
        isValid = false;
        showError(email, 'Enter a valid email address.');
      }

      // Update top alert with count of missing required fields
      var req = getRequiredFields();
      var missing = req.filter(function(el){ return !(el.value && el.value.trim()); }).length;
      updateTopAlert(missing);

      // If invalid basic fields, stop here
      if (!isValid) {
        e.preventDefault();
        if (firstInvalid && typeof firstInvalid.focus === 'function') {
          firstInvalid.focus();
          try { firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (_) {}
        }
        return;
      }

      // Optional server-side reCAPTCHA verification path.
      // Only enabled if the form explicitly opts in via data-verify-recaptcha.
      var needsServerVerify = form.hasAttribute('data-verify-recaptcha');
      var recaptchaResponse = '';
      if (needsServerVerify) {
        try { recaptchaResponse = grecaptcha.getResponse(); } catch (_) { recaptchaResponse = ''; }
        if (!recaptchaResponse) {
          e.preventDefault();
          var captchaContainer = form.querySelector('.g-recaptcha');
          if (captchaContainer) {
            var fieldLike = captchaContainer.closest('.field') || captchaContainer.parentElement || form;
            var msgHost = fieldLike.querySelector('.error') || document.createElement('div');
            msgHost.className = 'error';
            msgHost.setAttribute('role', 'alert');
            msgHost.textContent = 'Please complete the reCAPTCHA.';
            if (!fieldLike.contains(msgHost)) fieldLike.appendChild(msgHost);
          }
          return;
        }

        // Block native submit while verifying on server
        e.preventDefault();
        var submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.setAttribute('data-loading', '1');
        }
        fetch('/.netlify/functions/verify-recaptcha', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: recaptchaResponse })
        })
          .then(function(res){ return res.json().catch(function(){ return {}; }); })
          .then(function(data){
            if (data && data.success) {
              if (submitBtn) { submitBtn.disabled = false; submitBtn.removeAttribute('data-loading'); }
              // Ensure hidden g-recaptcha-response field is present for backends that expect it
              try {
                var hidden = form.querySelector('input[name="g-recaptcha-response"]');
                if (!hidden) {
                  hidden = document.createElement('input');
                  hidden.type = 'hidden';
                  hidden.name = 'g-recaptcha-response';
                  form.appendChild(hidden);
                }
                hidden.value = recaptchaResponse;
              } catch (_) {}
              // Proceed with actual submission to Netlify Forms
              form.submit();
            } else {
              var captchaContainer = form.querySelector('.g-recaptcha');
              if (captchaContainer) {
                var fieldLike = captchaContainer.closest('.field') || captchaContainer.parentElement || form;
                var msgHost = fieldLike.querySelector('.error') || document.createElement('div');
                msgHost.className = 'error';
                msgHost.setAttribute('role', 'alert');
                // Map Google error codes to human-friendly messages
                var codes = (data && data.errorCodes) || [];
                var friendly = 'reCAPTCHA verification failed. Please try again.';
                if (codes && codes.length) {
                  var map = {
                    'missing-input-secret': 'Server is missing the reCAPTCHA secret. Contact site owner.',
                    'invalid-input-secret': 'Server reCAPTCHA secret is invalid. Contact site owner.',
                    'missing-input-response': 'Please complete the reCAPTCHA.',
                    'invalid-input-response': 'Invalid reCAPTCHA response. Please tick the checkbox again.',
                    'bad-request': 'Bad verification request. Please retry.',
                    'timeout-or-duplicate': 'reCAPTCHA expired or already used. Please check the box again.'
                  };
                  // Prefer the first code for messaging
                  friendly = map[codes[0]] || friendly;
                }
                msgHost.textContent = friendly;
                if (!fieldLike.contains(msgHost)) fieldLike.appendChild(msgHost);
              }
              if (submitBtn) { submitBtn.disabled = false; submitBtn.removeAttribute('data-loading'); }
              try { grecaptcha.reset(); } catch (_) {}
            }
          })
          .catch(function(){
            var captchaContainer = form.querySelector('.g-recaptcha');
            if (captchaContainer) {
              var fieldLike = captchaContainer.closest('.field') || captchaContainer.parentElement || form;
              var msgHost = fieldLike.querySelector('.error') || document.createElement('div');
              msgHost.className = 'error';
              msgHost.setAttribute('role', 'alert');
              msgHost.textContent = 'Verification service unavailable. Please retry in a moment.';
              if (!fieldLike.contains(msgHost)) fieldLike.appendChild(msgHost);
            }
            if (submitBtn) { submitBtn.disabled = false; submitBtn.removeAttribute('data-loading'); }
          });
      }
      // If no reCAPTCHA present, allow normal submission
    });
  }

  // -----------------------------
  // Enhanced Contact Form UX
  // -----------------------------
  function setupEnhancedContactForm(){
    var form = document.querySelector('form[data-validate="contact"][data-enhanced="true"]');
    if (!form) return;

    var inputs = Array.prototype.slice.call(form.querySelectorAll('input, textarea'));
    var progressBar = document.querySelector('.form-progress .bar');
    var message = form.querySelector('#message');
    var messageCount = form.querySelector('#message-count');
    var placeholders = [
      'Tell us about your goals…',
      'Which team will use this first?',
      'What’s the outcome you want in 90 days?'
    ];

    // Autosize textarea
    function autosize(el){
      if (!el) return;
      el.style.height = 'auto';
      el.style.height = Math.min(800, Math.max(120, el.scrollHeight)) + 'px';
    }
    if (message){
      autosize(message);
      message.addEventListener('input', function(){
        autosize(message);
        if (messageCount){
          var len = (message.value || '').length;
          if (len > 800) { message.value = message.value.slice(0,800); len = 800; autosize(message); }
          messageCount.textContent = len + ' / 800';
        }
      });
      // Rotating placeholder for inspiration
      var idx = 0;
      setInterval(function(){
        idx = (idx + 1) % placeholders.length;
        if (!message.value) message.setAttribute('placeholder', placeholders[idx]);
      }, 4000);
    }

    // Progress bar based on filled fields
    function updateProgress(){
      var required = inputs.filter(function(el){ return el.hasAttribute('required'); });
      var filled = required.filter(function(el){ return !!(el.value && el.value.trim()); }).length;
      var pct = Math.round((filled / Math.max(1, required.length)) * 100);
      if (progressBar){
        progressBar.style.width = pct + '%';
        progressBar.setAttribute('aria-valuenow', String(pct));
      }
    }
    inputs.forEach(function(el){ el.addEventListener('input', updateProgress); });
    updateProgress();

    // Submit micro-feedback
    form.addEventListener('submit', function(){
      if (progressBar){ progressBar.style.width = '100%'; }
    });
  }

  // -----------------------------
  // Typing Effect Utility
  // -----------------------------
  function setupTypingEffect(){
    // Feature detect: reduce motion
    var prefersReduced = false;
    try { prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch(e) {}

    // Helper to type a single element's textContent
    function typeElement(el, options){
      var text = el.textContent || '';
      var speed = options && options.speed != null ? options.speed : 35; // ms per char
      var startDelay = options && options.startDelay != null ? options.startDelay : 0;
      var showCursor = options && options.showCursor !== false;
      var cursorMuted = !!(options && options.cursorMuted);
      var myGeneration = typingGeneration;

      // Skip if no text or reduced motion
      if (!text || prefersReduced) return Promise.resolve(0);

      // Prepare element
      el.setAttribute('aria-live', 'polite');
      el.setAttribute('aria-atomic', 'true');
      var original = text;
      el.textContent = '';
      el.classList.add('typing-line');

      var cursor
      if (showCursor){
        cursor = document.createElement('span');
        cursor.className = 'typing-cursor' + (cursorMuted ? ' muted' : '');
        el.appendChild(cursor);
      }

      var i = 0;
      function step(){
        // If a new generation was issued (e.g., language switch), cancel typing
        if (myGeneration !== typingGeneration) {
          try { if (cursor && cursor.parentElement) cursor.parentElement.removeChild(cursor); } catch(e) {}
          return;
        }
        if (i < original.length){
          // Insert next char before cursor
          if (cursor){ cursor.remove(); }
          el.textContent += original.charAt(i);
          if (cursor){ el.appendChild(cursor); }
          i++;
          setTimeout(step, speed);
        } else {
          // Done: remove cursor after a short pause
          setTimeout(function(){ if (cursor && cursor.parentElement) cursor.parentElement.removeChild(cursor); }, 250);
        }
      }

      return new Promise(function(resolve){
        setTimeout(function(){ step(); resolve(original.length * speed + startDelay + 250); }, startDelay);
      });
    }

    // Auto-wire: find hero sections and type h1 lines and subtitle
    var hero = document.querySelector('.hero, .blog-hero, main > .section:first-of-type');
    if (!hero) return;

    // Strategy: type within the hero container for elements marked with data-typed
    var targets = Array.prototype.slice.call(hero.querySelectorAll('[data-typed]'));
    if (targets.length === 0){
      // Fallback heuristic: split .hero-title lines if present
      var title = hero.querySelector('.hero-title');
      if (title){
        var lines = Array.prototype.slice.call(title.querySelectorAll('.line'));
        if (lines.length){
          // Chain typing: line1 -> line2 -> lede
          var totalDelay = 0;
          lines.forEach(function(line, idx){
            typeElement(line, { startDelay: totalDelay, speed: 32, showCursor: true, cursorMuted: false });
            totalDelay += (line.textContent || '').length * 32 + 400;
          });
          var lede = hero.querySelector('.lede');
          if (lede){ typeElement(lede, { startDelay: totalDelay + 250, speed: 18, showCursor: true, cursorMuted: true }); }
        }
      } else {
        // Generic: try h1 and following p.lede
        var h1 = hero.querySelector('h1');
        if (h1){ typeElement(h1, { speed: 28, showCursor: true }); }
        var p = hero.querySelector('.lede');
        if (p){ typeElement(p, { startDelay: (h1 && (h1.textContent||'').length*28+300) || 300, speed: 18, showCursor: true, cursorMuted: true }); }
      }
      return;
    }

    // If explicit targets exist, sequence by DOM order
    var cumulativeDelay = 0;
    targets.forEach(function(el, idx){
      var speedAttr = parseInt(el.getAttribute('data-typed-speed') || '28', 10);
      var delayAttr = parseInt(el.getAttribute('data-typed-delay') || String(cumulativeDelay), 10);
      var muted = el.hasAttribute('data-typed-muted');
      typeElement(el, { speed: isNaN(speedAttr) ? 28 : speedAttr, startDelay: isNaN(delayAttr) ? cumulativeDelay : delayAttr, showCursor: true, cursorMuted: muted });
      cumulativeDelay = (isNaN(delayAttr) ? cumulativeDelay : delayAttr) + (el.textContent || '').length * (isNaN(speedAttr) ? 28 : speedAttr) + 350;
    });
  }

  // Expose a cancellation hook for language switches
  try {
    window.cancelTyping = function(){
      typingGeneration++;
      var cursors = Array.prototype.slice.call(document.querySelectorAll('.typing-cursor'));
      cursors.forEach(function(c){ if (c && c.parentElement) c.parentElement.removeChild(c); });
    };
  } catch(e) {}

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    onReady();
  }
})();


