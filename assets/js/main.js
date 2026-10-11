/* ==========================================================================
   Northbound — site behaviour
   No dependencies. Everything degrades gracefully without JS.
   ========================================================================== */
(function () {
  "use strict";

  var CFG = window.SITE_CONFIG || {};
  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var DESKTOP = window.matchMedia("(min-width: 1000px)");

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  /* ------------------------------------------------------------------------
     Config-driven links: booking + email
     ------------------------------------------------------------------------ */
  function emailAddress() {
    if (!CFG.emailUser || !CFG.emailDomain) return "";
    return CFG.emailUser + "@" + CFG.emailDomain;
  }

  function wireConfigLinks() {
    var booking = (CFG.bookingUrl || "").trim();

    $$("[data-book]").forEach(function (el) {
      if (booking) {
        el.setAttribute("href", booking);
        if (CFG.bookingNewTab) {
          el.setAttribute("target", "_blank");
          el.setAttribute("rel", "noopener");
        }
      }
      // No booking URL configured: leave the authored href (the contact form)
      // in place so the button always does something sensible.
    });

    var addr = emailAddress();
    if (!addr) return;

    $$("[data-mail]").forEach(function (el) {
      var subject = el.getAttribute("data-mail-subject");
      el.setAttribute("href", "mailto:" + addr + (subject ? "?subject=" + encodeURIComponent(subject) : ""));
      if (el.hasAttribute("data-mail-text")) el.textContent = addr;
    });
  }

  /* ------------------------------------------------------------------------
     Sticky header state
     ------------------------------------------------------------------------ */
  function initHeader() {
    var header = $(".header");
    if (!header) return;
    var ticking = false;

    function update() {
      header.classList.toggle("is-stuck", window.scrollY > 8);
      ticking = false;
    }
    update();
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }, { passive: true });
  }

  /* ------------------------------------------------------------------------
     Mobile drawer
     ------------------------------------------------------------------------ */
  function initDrawer() {
    var toggle = $("[data-drawer-toggle]");
    var drawer = $("[data-drawer]");
    if (!toggle || !drawer) return;

    function setOpen(open) {
      toggle.setAttribute("aria-expanded", String(open));
      drawer.classList.toggle("is-open", open);
      drawer.toggleAttribute("inert", !open);
      document.body.classList.toggle("is-locked", open);
      if (!open) {
        $$("[data-drawer-group]", drawer).forEach(function (g) {
          g.classList.remove("is-open");
          var b = $("[data-drawer-top]", g);
          if (b) b.setAttribute("aria-expanded", "false");
        });
      }
    }

    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    drawer.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        toggle.focus();
      }
    });

    // Collapsible groups inside the drawer
    $$("[data-drawer-top]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var group = btn.closest("[data-drawer-group]");
        var open = !group.classList.contains("is-open");
        group.classList.toggle("is-open", open);
        btn.setAttribute("aria-expanded", String(open));
      });
    });

    DESKTOP.addEventListener("change", function (e) { if (e.matches) setOpen(false); });
    setOpen(false);
  }

  /* ------------------------------------------------------------------------
     Desktop mega menu
     ------------------------------------------------------------------------ */
  function initMega() {
    var items = $$("[data-mega-item]");
    if (!items.length) return;

    function close(item) {
      item.classList.remove("is-open");
      delete item.dataset.openedBy;
      var btn = $("[data-mega-btn]", item);
      if (btn) btn.setAttribute("aria-expanded", "false");
    }

    function open(item, source) {
      items.forEach(function (other) { if (other !== item) close(other); });
      item.classList.add("is-open");
      item.dataset.openedBy = source;
      var btn = $("[data-mega-btn]", item);
      if (btn) btn.setAttribute("aria-expanded", "true");
    }

    function closeAll() { items.forEach(close); }

    items.forEach(function (item) {
      var btn = $("[data-mega-btn]", item);
      var panel = $("[data-mega-panel]", item);
      if (!btn || !panel) return;
      var hoverTimer;

      btn.addEventListener("click", function (e) {
        e.preventDefault();
        if (!item.classList.contains("is-open")) {
          open(item, "click");
        } else if (item.dataset.openedBy === "hover") {
          // Pointer already opened it on hover — a click pins it rather than
          // immediately closing what the user just revealed.
          item.dataset.openedBy = "click";
        } else {
          close(item);
        }
      });

      item.addEventListener("mouseenter", function () {
        if (!DESKTOP.matches) return;
        window.clearTimeout(hoverTimer);
        if (!item.classList.contains("is-open")) open(item, "hover");
      });

      item.addEventListener("mouseleave", function () {
        if (!DESKTOP.matches) return;
        // A pinned (clicked) menu stays until Escape, a click elsewhere, or blur.
        if (item.dataset.openedBy !== "hover") return;
        hoverTimer = window.setTimeout(function () { close(item); }, 160);
      });

      item.addEventListener("focusout", function (e) {
        if (!item.contains(e.relatedTarget)) close(item);
      });
    });

    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      var openItem = items.filter(function (i) { return i.classList.contains("is-open"); })[0];
      if (!openItem) return;
      closeAll();
      var btn = $("[data-mega-btn]", openItem);
      if (btn) btn.focus();
    });

    document.addEventListener("click", function (e) {
      if (!e.target.closest("[data-mega-item]")) closeAll();
    });

    DESKTOP.addEventListener("change", closeAll);
  }

  /* ------------------------------------------------------------------------
     Accordions (FAQ and anywhere else)
     ------------------------------------------------------------------------ */
  function initAccordions() {
    $$("[data-acc-btn]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var open = btn.getAttribute("aria-expanded") !== "true";
        var group = btn.closest("[data-acc-exclusive]");
        if (group && open) {
          $$("[data-acc-btn]", group).forEach(function (other) {
            if (other !== btn) other.setAttribute("aria-expanded", "false");
          });
        }
        btn.setAttribute("aria-expanded", String(open));
      });
    });
  }

  /* ------------------------------------------------------------------------
     Reveal on scroll
     ------------------------------------------------------------------------ */
  function initReveal() {
    var nodes = $$("[data-reveal]");
    if (!nodes.length) return;

    if (REDUCED || !("IntersectionObserver" in window)) {
      nodes.forEach(function (n) { n.classList.add("is-in"); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var i = Number(el.getAttribute("data-reveal-i") || 0);
        el.style.setProperty("--reveal-delay", Math.min(i, 8) * 70 + "ms");
        el.classList.add("is-in");
        io.unobserve(el);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

    // Auto-index siblings so grids cascade rather than popping in together
    var groups = {};
    nodes.forEach(function (el) {
      if (!el.hasAttribute("data-reveal-i")) {
        var key = el.parentNode;
        var list = groups[key] || (groups[key] = []);
        el.setAttribute("data-reveal-i", String(list.length));
        list.push(el);
      }
      io.observe(el);
    });
  }

  /* ------------------------------------------------------------------------
     Count-up for stat figures
     ------------------------------------------------------------------------ */
  function initCounters() {
    var nodes = $$("[data-count]");
    if (!nodes.length) return;

    if (REDUCED || !("IntersectionObserver" in window)) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        io.unobserve(el);

        var target = parseFloat(el.getAttribute("data-count"));
        if (isNaN(target)) return;
        var prefix = el.getAttribute("data-count-prefix") || "";
        var suffix = el.getAttribute("data-count-suffix") || "";
        var dur = 900;
        var t0 = null;

        function frame(ts) {
          if (t0 === null) t0 = ts;
          var p = Math.min((ts - t0) / dur, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = prefix + Math.round(target * eased) + suffix;
          if (p < 1) window.requestAnimationFrame(frame);
        }
        window.requestAnimationFrame(frame);
      });
    }, { threshold: 0.5 });

    nodes.forEach(function (el) { io.observe(el); });
  }

  /* ------------------------------------------------------------------------
     Contact form (Web3Forms)
     ------------------------------------------------------------------------ */
  var ICON_OK = '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M3.5 10.5l4 4 9-9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var ICON_ERR = '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.6"/><path d="M10 6v5m0 3h.01" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';

  function initForm() {
    var form = $("[data-form]");
    if (!form) return;

    var status = $("[data-form-status]", form);
    var submit = $("[data-form-submit]", form);
    var submitLabel = submit ? submit.querySelector("[data-form-submit-label]") : null;
    var defaultLabel = submitLabel ? submitLabel.textContent : "";

    function say(kind, html) {
      if (!status) return;
      status.className = "form__status is-shown " + (kind === "ok" ? "is-ok" : "is-err");
      status.innerHTML = (kind === "ok" ? ICON_OK : ICON_ERR) + "<div>" + html + "</div>";
      status.scrollIntoView({ block: "nearest", behavior: REDUCED ? "auto" : "smooth" });
    }

    function clearFieldError(field) {
      field.removeAttribute("aria-invalid");
      var box = field.closest(".field");
      var err = box ? $("[data-field-error]", box) : null;
      if (err) err.textContent = "";
    }

    function setFieldError(field, msg) {
      field.setAttribute("aria-invalid", "true");
      var box = field.closest(".field");
      var err = box ? $("[data-field-error]", box) : null;
      if (err) err.textContent = msg;
    }

    // Clear the error as soon as the visitor starts fixing it
    $$("input, textarea, select", form).forEach(function (field) {
      field.addEventListener("input", function () { clearFieldError(field); });
      field.addEventListener("change", function () { clearFieldError(field); });
    });

    function validate() {
      var firstBad = null;

      $$("[required]", form).forEach(function (field) {
        clearFieldError(field);
        var val = (field.value || "").trim();
        var bad = "";

        if (field.type === "checkbox") {
          // A checkbox always reports a value, checked or not — test .checked.
          if (!field.checked) bad = "Please tick this to continue.";
        } else if (!val) {
          bad = "This one's needed.";
        } else if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val)) {
          bad = "That email address doesn't look right.";
        } else if (field.tagName === "TEXTAREA" && val.length < 12) {
          bad = "A sentence or two helps us prepare.";
        }

        if (bad) {
          setFieldError(field, bad);
          if (!firstBad) firstBad = field;
        }
      });

      if (firstBad) {
        say("err", "Please check the highlighted fields and try again.");
        firstBad.focus();
        return false;
      }
      return true;
    }

    function mailtoFallback(data) {
      var addr = emailAddress();
      if (!addr) {
        say("err", "The form isn't connected yet. Please get in touch by email.");
        return;
      }
      var lines = [
        "Name: " + (data.name || ""),
        "Email: " + (data.email || ""),
        "Business: " + (data.company || "—"),
        "Interested in: " + (data.service || "—"),
        "",
        data.message || ""
      ].join("\n");

      var href = "mailto:" + addr +
        "?subject=" + encodeURIComponent("Website enquiry — " + (data.name || "")) +
        "&body=" + encodeURIComponent(lines);

      say("ok",
        "<strong>Almost there.</strong> The form backend isn't connected yet, so we've " +
        'prepared the message in your email app instead — <a class="tlink" href="' + href + '">open it and hit send</a>.');
      window.location.href = href;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      // Honeypot: silently accept and discard anything that fills the hidden field
      var hp = $("[data-hp]", form);
      if (hp && hp.value) { say("ok", "Thanks — your message is on its way."); form.reset(); return; }

      if (!validate()) return;

      var fd = new FormData(form);
      var data = {};
      fd.forEach(function (v, k) { if (k.charAt(0) !== "_" && k !== "botcheck") data[k] = v; });

      var key = (CFG.web3formsKey || "").trim();
      if (!key) { mailtoFallback(data); return; }

      if (submit) {
        submit.setAttribute("data-loading", "true");
        submit.setAttribute("aria-busy", "true");
        if (submitLabel) submitLabel.textContent = "Sending…";
      }
      if (status) status.className = "form__status";

      var payload = Object.assign({}, data, {
        access_key: key,
        subject: CFG.formSubject || "New website enquiry",
        from_name: "Northbound website",
        page: window.location.href
      });

      fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload)
      })
        .then(function (res) { return res.json().catch(function () { return { success: res.ok }; }); })
        .then(function (res) {
          if (res && res.success) {
            form.reset();
            say("ok",
              "<strong>Message received.</strong> We read everything that comes in and reply " +
              (CFG.responseTime || "shortly") + ". If it's urgent, say so in a follow-up and we'll jump the queue.");
          } else {
            say("err",
              "<strong>That didn't go through.</strong> " +
              ((res && res.message) ? res.message + " " : "") +
              'You can <a class="tlink" href="#" data-mail data-mail-subject="Website enquiry">email us directly</a> instead.');
            wireConfigLinks();
          }
        })
        .catch(function () {
          say("err",
            "<strong>Couldn't reach the server.</strong> Check your connection, or " +
            '<a class="tlink" href="#" data-mail data-mail-subject="Website enquiry">email us directly</a>.');
          wireConfigLinks();
        })
        .finally(function () {
          if (submit) {
            submit.removeAttribute("data-loading");
            submit.removeAttribute("aria-busy");
            if (submitLabel) submitLabel.textContent = defaultLabel;
          }
        });
    });
  }

  /* ------------------------------------------------------------------------
     Pre-select the service dropdown from ?service= in the URL
     (used by the "Start a project" buttons on the service pages)
     ------------------------------------------------------------------------ */
  function initPrefill() {
    var select = $("[data-service-select]");
    if (!select) return;

    var params = new URLSearchParams(window.location.search);
    var want = (params.get("service") || "").toLowerCase();
    if (!want) return;

    var match = $$("option", select).filter(function (o) {
      return o.value.toLowerCase() === want;
    })[0];
    if (match) select.value = match.value;
  }

  /* ------------------------------------------------------------------------
     Footer year
     ------------------------------------------------------------------------ */
  function initYear() {
    $$("[data-year]").forEach(function (el) { el.textContent = String(new Date().getFullYear()); });
  }

  /* ------------------------------------------------------------------------
     Response-time copy driven by config
     ------------------------------------------------------------------------ */
  function initResponseTime() {
    if (!CFG.responseTime) return;
    $$("[data-response-time]").forEach(function (el) { el.textContent = CFG.responseTime; });
  }

  /* ------------------------------------------------------------------------
     Optional social links — hidden unless a URL is configured
     ------------------------------------------------------------------------ */
  function initSocial() {
    [["linkedin", CFG.linkedinUrl], ["github", CFG.githubUrl]].forEach(function (pair) {
      $$('[data-social="' + pair[0] + '"]').forEach(function (el) {
        var url = (pair[1] || "").trim();
        if (url) {
          el.setAttribute("href", url);
          el.hidden = false;
        } else {
          el.hidden = true;
        }
      });
    });
  }

  /* ------------------------------------------------------------------------
     Boot
     ------------------------------------------------------------------------ */
  function boot() {
    document.documentElement.classList.remove("no-js");
    wireConfigLinks();
    initHeader();
    initDrawer();
    initMega();
    initAccordions();
    initReveal();
    initCounters();
    initForm();
    initPrefill();
    initYear();
    initResponseTime();
    initSocial();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
