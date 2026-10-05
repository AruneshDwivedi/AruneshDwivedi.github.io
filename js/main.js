/* =========================================================
   main.js – interactions and animation for the portfolio.
   No dependencies. Sections:
   0. Helpers            6. Hero canvas background
   1. Theme + menu       7. Projects (render, filter, modal)
   2. Scroll effects     8. Blog (render, reader, transitions)
   3. Reveal on scroll   9. Overlay engine (focus, Esc, trap)
   4. Count-up numbers   10. Contact form
   5. Terminal typing
   11. Extra motion: letter reveal, portrait tilt, cursor glow,
       card spotlight, magnetic buttons
   PERFORMANCE NOTES
   - Scroll work is batched with requestAnimationFrame.
   - Observers replace scroll listeners wherever possible.
   - The canvas pauses when off-screen or the tab is hidden.
   - Everything animated is transform/opacity (GPU friendly).
   ========================================================= */
(function () {
  "use strict";

  /* 0. HELPERS ---------------------------------------------------- */
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function fmtDate(iso) {
    var d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("en", { year: "numeric", month: "short", day: "numeric" });
  }

  /* 1. THEME + MENU ------------------------------------------------ */
  var root = document.documentElement;
  var savedTheme = store("theme");
  if (savedTheme) root.setAttribute("data-theme", savedTheme);
  $("#themeBtn").addEventListener("click", function () {
    var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    store("theme", next);
    readColors(); // canvas picks up new accent colour
  });

  var menuBtn = $("#menuBtn"), navLinks = $("#navLinks");
  function setMenu(open) {
    navLinks.classList.toggle("open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
  }
  menuBtn.addEventListener("click", function () { setMenu(!navLinks.classList.contains("open")); });
  $$("a", navLinks).forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });

  /* 2. SCROLL EFFECTS: progress bar, back-to-top, active nav link --- */
  var progress = $("#progress"), toTop = $("#toTop");
  var sections = $$("main section[id]");
  var linkFor = {};
  $$("a", navLinks).forEach(function (a) { linkFor[a.getAttribute("href").slice(1)] = a; });
  var ticking = false;
  function onScroll() {
    var h = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = "scaleX(" + (h > 0 ? window.scrollY / h : 0) + ")";
    toTop.classList.toggle("show", window.scrollY > 700);
    ticking = false;
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  toTop.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }); });
  onScroll();

  // Active section highlight via IntersectionObserver (cheaper than measuring on scroll)
  var navObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting && linkFor[e.target.id]) {
        Object.keys(linkFor).forEach(function (k) { linkFor[k].classList.remove("active"); });
        linkFor[e.target.id].classList.add("active");
      }
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  sections.forEach(function (s) { navObs.observe(s); });

  /* 3. REVEAL ON SCROLL --------------------------------------------
     Elements with .reveal fade/slide in once. Re-run observeReveals()
     after injecting new content (projects, posts). */
  var revealObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add("in"); revealObs.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  function observeReveals(scope) { $$(".reveal:not(.in)", scope).forEach(function (el) { revealObs.observe(el); }); }
  observeReveals();

  /* 4. COUNT-UP NUMBERS (run once when visible) ------------------- */
  var countObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      countObs.unobserve(e.target);
      var el = e.target, end = +el.dataset.count, suf = el.dataset.suffix || "";
      if (reduceMotion) { el.textContent = end + suf; return; }
      var t0 = performance.now(), dur = 1200;
      (function step(t) {
        var p = Math.min((t - t0) / dur, 1);
        el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))) + suf; // ease-out cubic
        if (p < 1) requestAnimationFrame(step);
      })(t0);
    });
  }, { threshold: 0.6 });
  $$("[data-count]").forEach(function (el) { countObs.observe(el); });

  /* 5. TERMINAL TYPING ---------------------------------------------- */
  var TERM_LINES = [
    { c: "whoami", o: "arunesh: devops & platform engineer" },
    { c: "./pipeline status", o: "28 PRs merged upstream | human review: required" },
    { c: "terraform plan", o: "Plan: reusable modules, per-environment state" },
    { c: "systemctl status runbook.target", o: "active: every incident becomes a runbook step" },
    { c: "cat now.txt", o: "running prod infra | shipping upstream fixes | open to remote roles" }
  ];
  (function terminal() {
    var el = $("#termBody");
    if (!el) return;
    var html = "";
    function render(extra) { el.innerHTML = html + (extra || "") + '<span class="caret"></span>'; }
    if (reduceMotion) {
      TERM_LINES.forEach(function (l) { html += '<span class="p">$ </span><span class="c">' + esc(l.c) + '</span>\n<span class="o">' + esc(l.o) + "</span>\n"; });
      render(); return;
    }
    var li = 0;
    function typeLine() {
      if (li >= TERM_LINES.length) { return; }
      var l = TERM_LINES[li], i = 0, prefix = '<span class="p">$ </span>';
      (function typeChar() {
        render(prefix + '<span class="c">' + esc(l.c.slice(0, i)) + "</span>");
        if (i++ < l.c.length) { setTimeout(typeChar, 28 + Math.random() * 30); }
        else {
          html += prefix + '<span class="c">' + esc(l.c) + '</span>\n<span class="o">' + esc(l.o) + "</span>\n";
          render(); li++; setTimeout(typeLine, 450);
        }
      })();
    }
    setTimeout(typeLine, 700);
  })();

  /* 6. HERO CANVAS BACKGROUND ----------------------------------------
     A light "network graph": drifting nodes joined by faint lines when
     near each other. Capped node count + devicePixelRatio for speed. */
  var colors = { dot: "99,210,255" };
  function readColors() {
    var a = getComputedStyle(root).getPropertyValue("--accent").trim();
    var m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(a);
    if (m) colors.dot = parseInt(m[1], 16) + "," + parseInt(m[2], 16) + "," + parseInt(m[3], 16);
  }
  readColors();
  (function background() {
    var cv = $("#bg");
    if (!cv || reduceMotion) { if (cv) cv.style.display = "none"; return; }
    var ctx = cv.getContext("2d"), w = 0, h = 0, nodes = [], running = false, raf = 0;
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    function resize() {
      var r = cv.getBoundingClientRect();
      w = r.width; h = r.height;
      cv.width = w * dpr; cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = w < 700 ? 22 : 46; // fewer nodes on phones
      nodes = [];
      for (var i = 0; i < n; i++) nodes.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35 });
    }
    function frame() {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < nodes.length; i++) {
        var a = nodes[i];
        a.x += a.vx; a.y += a.vy;
        if (a.x < 0 || a.x > w) a.vx *= -1;
        if (a.y < 0 || a.y > h) a.vy *= -1;
        ctx.fillStyle = "rgba(" + colors.dot + ",0.8)";
        ctx.beginPath(); ctx.arc(a.x, a.y, 1.6, 0, 6.283); ctx.fill();
        for (var j = i + 1; j < nodes.length; j++) {
          var b = nodes[j], dx = a.x - b.x, dy = a.y - b.y, d = dx * dx + dy * dy;
          if (d < 16900) { // 130px
            ctx.strokeStyle = "rgba(" + colors.dot + "," + (0.22 * (1 - d / 16900)) + ")";
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      raf = running ? requestAnimationFrame(frame) : 0;
    }
    function start() { if (!running) { running = true; raf = requestAnimationFrame(frame); } }
    function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }
    resize();
    var rt; window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(resize, 200); });
    // Only animate while the hero is visible and the tab is active
    var visible = true;
    new IntersectionObserver(function (e) { visible = e[0].isIntersecting; visible && !document.hidden ? start() : stop(); }).observe(cv);
    document.addEventListener("visibilitychange", function () { document.hidden ? stop() : (visible && start()); });
    start();
  })();

  /* 7. PROJECTS ---------------------------------------------------------- */
  var PROJECTS = window.PROJECTS || [];
  var grid = $("#projectsGrid"), filters = $("#filters");
  var cats = ["All"].concat(PROJECTS.map(function (p) { return p.cat; }).filter(function (c, i, a) { return a.indexOf(c) === i; }));

  filters.innerHTML = cats.map(function (c, i) {
    return '<button class="chip" type="button" aria-pressed="' + (i === 0) + '" data-cat="' + esc(c) + '">' + esc(c) + "</button>";
  }).join("");

  grid.innerHTML = PROJECTS.map(function (p, i) {
    return '<button class="project reveal" type="button" data-id="' + esc(p.id) + '" data-cat="' + esc(p.cat) + '" style="--d:' + (i % 3) * 70 + 'ms" aria-haspopup="dialog">' +
      '<div class="thumb"><img src="' + esc(p.img) + '" alt="Architecture diagram: ' + esc(p.title) + '" loading="lazy" width="800" height="450" /></div>' +
      '<div class="p-body"><div class="p-cat">' + esc(p.cat) + '</div><h3 class="p-title">' + esc(p.title) + '</h3>' +
      '<p class="p-desc">' + esc(p.summary) + '</p>' +
      '<div class="tags">' + p.stack.slice(0, 4).map(function (t) { return '<span class="tag g">' + esc(t) + "</span>"; }).join("") + "</div>" +
      '<span class="p-more">View details →</span></div></button>';
  }).join("");
  observeReveals(grid);

  // Filter: hide non-matching cards, "pop in" the matching ones
  filters.addEventListener("click", function (e) {
    var chip = e.target.closest(".chip");
    if (!chip) return;
    $$(".chip", filters).forEach(function (c) { c.setAttribute("aria-pressed", String(c === chip)); });
    var cat = chip.dataset.cat;
    $$(".project", grid).forEach(function (card) {
      var show = cat === "All" || card.dataset.cat === cat;
      card.classList.toggle("hide", !show);
      card.classList.add("in");
      if (show && !reduceMotion) { card.classList.remove("pop-in"); void card.offsetWidth; card.classList.add("pop-in"); }
    });
  });

  var projectBody = $("#projectBody");
  function openProject(id, trigger) {
    var p = PROJECTS.filter(function (x) { return x.id === id; })[0];
    if (!p) return;
    var media = p.video
      ? '<div class="m-media"><video controls preload="metadata" poster="' + esc(p.img) + '" src="' + esc(p.video) + '"></video></div>'
      : '<div class="m-media"><img src="' + esc(p.img) + '" alt="Architecture diagram: ' + esc(p.title) + '" /></div>';
    var shots = (p.shots || []).length
      ? '<div class="m-gallery">' + p.shots.map(function (s) {
          return '<figure><img src="' + esc(s.src) + '" alt="' + esc(s.caption) + '" loading="lazy" onerror="this.closest(\'figure\').remove()" /><figcaption>' + esc(s.caption) + "</figcaption></figure>";
        }).join("") + "</div>" : "";
    var links = (p.links || []).map(function (l) {
      return '<a class="btn btn-primary" href="' + esc(l.url) + '" target="_blank" rel="noopener">' + esc(l.label) + " ↗</a>";
    }).join("");
    projectBody.innerHTML = media + shots +
      '<div class="p-cat">' + esc(p.cat) + '</div><h3 class="m-title" id="pm-title">' + esc(p.title) + "</h3>" +
      '<div class="m-grid"><div><h4>The problem</h4><p>' + esc(p.problem) + "</p><h4>What I built</h4><ul>" +
      p.highlights.map(function (h) { return "<li>" + esc(h) + "</li>"; }).join("") + "</ul></div>" +
      '<div><h4>Stack</h4><div class="tags">' + p.stack.map(function (t) { return '<span class="tag">' + esc(t) + "</span>"; }).join("") + "</div>" +
      (p.note ? "<h4>Note</h4><p>" + esc(p.note) + "</p>" : "") + "</div></div>" +
      (links ? '<div class="links">' + links + "</div>" : "");
    openOverlay($("#projectOverlay"), trigger);
  }
  grid.addEventListener("click", function (e) {
    var card = e.target.closest(".project");
    if (card) openProject(card.dataset.id, card);
  });

  /* 8. BLOG --------------------------------------------------------------- */
  var POSTS = window.POSTS || [];
  var blogGrid = $("#blogGrid"), blogBody = $("#blogBody"), currentPost = -1;
  blogGrid.innerHTML = POSTS.map(function (p, i) {
    return '<button class="post-card reveal" type="button" data-id="' + esc(p.id) + '" style="--d:' + i * 70 + 'ms" aria-haspopup="dialog">' +
      '<div class="post-meta">' + esc(p.tag) + " · " + fmtDate(p.date) + " · " + esc(p.read) + "</div>" +
      "<h3>" + esc(p.title) + "</h3><p>" + esc(p.excerpt) + "</p></button>";
  }).join("");
  observeReveals(blogGrid);

  function postHTML(i) {
    var p = POSTS[i], prev = POSTS[i - 1], next = POSTS[i + 1];
    return '<article class="article"><div class="post-meta">' + esc(p.tag) + " · " + fmtDate(p.date) + " · " + esc(p.read) + " read</div>" +
      "<h2>" + esc(p.title) + "</h2>" + p.body +
      '<div class="post-nav">' +
      (prev ? '<button class="btn btn-ghost" data-go="' + (i - 1) + '">← ' + esc(prev.title.slice(0, 32)) + "…</button>" : "<span></span>") +
      (next ? '<button class="btn btn-ghost" data-go="' + (i + 1) + '">' + esc(next.title.slice(0, 32)) + "… →</button>" : "") +
      "</div></article>";
  }
  function showPost(i, animate, trigger) {
    currentPost = i;
    var overlay = $("#blogOverlay");
    function swapIn() {
      blogBody.innerHTML = postHTML(i);
      overlay.scrollTop = 0;
      blogBody.classList.remove("swap");
    }
    if (overlay.classList.contains("open") && animate && !reduceMotion) {
      // Fade/slide current post out, replace content, fade/slide in
      blogBody.classList.add("swap");
      setTimeout(swapIn, 280);
    } else {
      swapIn(); openOverlay(overlay, trigger);
    }
    history.replaceState(null, "", "#post/" + POSTS[i].id);
  }
  blogGrid.addEventListener("click", function (e) {
    var c = e.target.closest(".post-card");
    if (!c) return;
    showPost(POSTS.findIndex(function (p) { return p.id === c.dataset.id; }), false, c);
  });
  blogBody.addEventListener("click", function (e) {
    var b = e.target.closest("[data-go]");
    if (b) showPost(+b.dataset.go, true);
  });

  /* 9. OVERLAY ENGINE ------------------------------------------------------
     Opens/closes the project modal and blog reader. Handles: body scroll
     lock, Esc, backdrop click, focus move-in, Tab trap, focus return. */
  var activeOverlay = null, lastTrigger = null;
  function openOverlay(ov, trigger) {
    lastTrigger = trigger || document.activeElement;
    activeOverlay = ov;
    ov.setAttribute("aria-hidden", "false");
    // next frame so the CSS transition runs from the hidden state
    requestAnimationFrame(function () { ov.classList.add("open"); });
    document.body.classList.add("no-scroll");
    setTimeout(function () { var c = $("[data-close]", ov); c && c.focus(); }, 60);
  }
  function closeOverlay() {
    if (!activeOverlay) return;
    var ov = activeOverlay;
    ov.classList.remove("open");
    ov.setAttribute("aria-hidden", "true");
    document.body.classList.remove("no-scroll");
    $$("video", ov).forEach(function (v) { v.pause(); });
    activeOverlay = null;
    if (/^#post\//.test(location.hash)) history.replaceState(null, "", location.pathname + location.search + "#blog");
    if (lastTrigger && lastTrigger.focus) lastTrigger.focus();
  }
  $$(".overlay").forEach(function (ov) {
    ov.addEventListener("mousedown", function (e) { if (e.target === ov) closeOverlay(); });
    $("[data-close]", ov).addEventListener("click", closeOverlay);
  });
  document.addEventListener("keydown", function (e) {
    if (!activeOverlay) return;
    if (e.key === "Escape") { closeOverlay(); return; }
    if (e.key === "Tab") { // keep focus inside the dialog
      var f = $$('button, a[href], video[controls], input, select, textarea', activeOverlay).filter(function (x) { return x.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  // Deep link: index.html#post/<id> opens that post directly
  var m = /^#post\/(.+)$/.exec(location.hash);
  if (m) {
    var idx = POSTS.findIndex(function (p) { return p.id === m[1]; });
    if (idx > -1) setTimeout(function () { showPost(idx, false); }, 400);
  }

  /* 10. CONTACT FORM --------------------------------------------------------- */
  var form = $("#contactForm"), statusEl = $("#formStatus"), sendBtn = $("#sendBtn");
  function setStatus(msg, kind) {
    statusEl.textContent = msg;
    statusEl.className = "form-status show " + kind;
  }
  function validate() {
    var ok = true;
    [["name", function (v) { return v.trim().length > 1; }, "Please enter your name."],
     ["email", function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }, "Please enter a valid email."],
     ["message", function (v) { return v.trim().length >= 20; }, "Please write at least 20 characters."]
    ].forEach(function (r) {
      var input = form.elements[r[0]], field = input.closest(".field");
      var good = r[1](input.value);
      field.classList.toggle("invalid", !good);
      $(".err", field).textContent = good ? "" : r[2];
      input.setAttribute("aria-invalid", String(!good));
      if (!good) ok = false;
    });
    return ok;
  }
  form.addEventListener("input", function (e) {
    var f = e.target.closest(".field");
    if (f && f.classList.contains("invalid")) validate();
  });
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!validate()) { var bad = $(".invalid input, .invalid textarea", form); bad && bad.focus(); return; }
    var d = {};
    new FormData(form).forEach(function (v, k) { d[k] = v; });
    if (d.website) { setStatus("Thanks! Your message was sent.", "ok"); form.reset(); return; } // honeypot tripped: silently ignore

    var cfg = window.SITE || {};
    var subject = "Portfolio contact: " + d.topic + " (" + d.name + ")";
    var body = d.message + "\n\n— " + d.name + (d.company ? ", " + d.company : "") + "\n" + d.email;

    // Fallback when no form backend is configured: open email client
    if (!cfg.formEndpoint) {
      window.location.href = "mailto:" + cfg.email + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
      setStatus("Opening your email app with the message pre-filled. If nothing opens, email " + cfg.email + " directly.", "ok");
      return;
    }
    sendBtn.disabled = true; sendBtn.textContent = "Sending…";
    var payload = { name: d.name, email: d.email, company: d.company, topic: d.topic, message: d.message, subject: subject };
    if (cfg.accessKey) payload.access_key = cfg.accessKey;
    fetch(cfg.formEndpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(payload) })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json().catch(function () { return {}; }); })
      .then(function () { setStatus("Thanks, " + d.name.split(" ")[0] + "! Your message was sent. I'll reply by email.", "ok"); form.reset(); })
      .catch(function () { setStatus("Couldn't send right now. Please email " + cfg.email + " directly.", "bad"); })
      .then(function () { sendBtn.disabled = false; sendBtn.textContent = "Send message →"; });
  });

  /* 11. EXTRA MOTION ---------------------------------------------------------
     All of this is skipped when the user prefers reduced motion. Pointer
     effects also need a fine pointer (mouse/trackpad), so touch devices
     pay no cost. Every handler is throttled through requestAnimationFrame. */
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  // 11a. Hero name: wrap every letter in a span; CSS staggers them via --i.
  (function () {
    var h1 = $(".hero h1");
    if (!h1 || reduceMotion) return;
    h1.setAttribute("aria-label", h1.textContent);          // screen readers read the name once
    var i = 0;
    function split(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          var word = document.createElement("span");          // .w keeps a word from breaking mid-letter
          word.className = "w"; word.setAttribute("aria-hidden", "true");
          n.textContent.split("").forEach(function (ch) {
            var s = document.createElement("span");
            s.className = "ch";
            s.style.setProperty("--i", i++); s.textContent = ch;
            word.appendChild(s);
          });
          frag.appendChild(word);
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1) split(n);
      });
    }
    split(h1);
  })();

  if (!reduceMotion && finePointer) {
    // 11b. Cursor glow follows the pointer (position set with transform only)
    var glow = $("#cursorGlow"), gx = 0, gy = 0, gTick = false;
    if (glow) {
      window.addEventListener("pointermove", function (e) {
        gx = e.clientX; gy = e.clientY;
        glow.classList.add("on");
        if (!gTick) { gTick = true; requestAnimationFrame(function () { glow.style.transform = "translate(" + gx + "px," + gy + "px)"; gTick = false; }); }
      }, { passive: true });
      document.addEventListener("pointerleave", function () { glow.classList.remove("on"); });
    }

    // 11c. Portrait tilts toward the pointer (max ~8 degrees)
    var portrait = $("#portrait"), tilt = portrait && $(".portrait-tilt", portrait);
    if (tilt) {
      portrait.addEventListener("pointermove", function (e) {
        var r = portrait.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        requestAnimationFrame(function () { tilt.style.transform = "rotateY(" + (px * 14).toFixed(2) + "deg) rotateX(" + (-py * 14).toFixed(2) + "deg)"; });
      });
      portrait.addEventListener("pointerleave", function () { tilt.style.transform = ""; });
    }

    // 11d. Spotlight on cards: write pointer position into --mx/--my.
    // Event delegation, so project cards rendered later are covered too.
    var SPOT = ".skill, .project, .stat, .cert, .post-card";
    document.addEventListener("pointermove", function (e) {
      var card = e.target.closest && e.target.closest(SPOT);
      if (!card) return;
      var r = card.getBoundingClientRect();
      card.classList.add("spot");
      card.style.setProperty("--mx", (e.clientX - r.left) + "px");
      card.style.setProperty("--my", (e.clientY - r.top) + "px");
    }, { passive: true });

    // 11e. Magnetic buttons: nudge toward the pointer, spring back on leave
    $$(".hero-actions .btn, #sendBtn").forEach(function (b) {
      b.classList.add("mag");
      b.addEventListener("pointermove", function (e) {
        var r = b.getBoundingClientRect();
        var x = (e.clientX - (r.left + r.width / 2)) * 0.25, y = (e.clientY - (r.top + r.height / 2)) * 0.35;
        b.style.translate = x.toFixed(1) + "px " + y.toFixed(1) + "px";
      });
      b.addEventListener("pointerleave", function () { b.style.translate = ""; });
    });
  }
})();
