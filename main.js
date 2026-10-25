/* Portfolio rendering logic.
   Architecture: data (data.js) -> pure render functions -> DOM.
   All user-provided text is inserted with textContent / escape() to prevent XSS. */
(function () {
  "use strict";
  var D = window.PORTFOLIO;
  var $ = function (s, r) { return (r || document).querySelector(s); };

  function escapeHTML(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function safeUrl(u) {
    return /^(https?:|mailto:|#|assets\/)/i.test(u) ? u : "#";
  }

  /* ---------- Theme ---------- */
  var root = document.documentElement;
  var saved = null;
  try { saved = localStorage.getItem("theme"); } catch (e) {}
  var prefersDark = window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches;
  root.setAttribute("data-theme", saved || (prefersDark ? "dark" : "light"));
  $("#themeBtn").addEventListener("click", function () {
    var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch (e) {}
  });

  /* ---------- Mobile menu ---------- */
  var menuBtn = $("#menuBtn"), nav = $("#nav");
  menuBtn.addEventListener("click", function () {
    var open = nav.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", String(open));
  });
  nav.addEventListener("click", function (e) {
    if (e.target.tagName === "A") { nav.classList.remove("open"); menuBtn.setAttribute("aria-expanded", "false"); }
  });

  /* ---------- Profile ---------- */
  var p = D.profile;
  document.title = p.name + " | " + p.title + " Portfolio";
  $("#brand").textContent = p.name;
  $("#heroTitle").textContent = p.title;
  $("#heroName").textContent = p.name;
  $("#heroTagline").textContent = p.tagline;
  $("#bio").textContent = p.bio;
  $("#availability").textContent = D.availability;
  $("#resumeBtn").setAttribute("href", safeUrl(p.resumeUrl));
  $("#year").textContent = "© " + new Date().getFullYear() + " " + p.name;

  $("#stats").innerHTML = p.stats.map(function (s) {
    return '<div class="stat"><b data-count="' + Number(s.value) + '">0</b>' + escapeHTML(s.label) + "</div>";
  }).join("");

  /* ---------- Skills ---------- */
  $("#skillGrid").innerHTML = D.skills.map(function (g) {
    return '<div class="skill-card reveal"><h3>' + escapeHTML(g.group) + "</h3>" +
      g.items.map(function (i) {
        var lvl = Math.max(0, Math.min(100, Number(i.level)));
        return '<div class="skill"><div><span>' + escapeHTML(i.name) + "</span><span>" + lvl +
          '%</span></div><div class="bar" role="progressbar" aria-valuenow="' + lvl +
          '" aria-valuemin="0" aria-valuemax="100" aria-label="' + escapeHTML(i.name) +
          '"><i data-w="' + lvl + '"></i></div></div>';
      }).join("") + "</div>";
  }).join("");

  /* ---------- Projects: filter + search ---------- */
  var state = { cat: "All", q: "" };
  var cats = ["All"].concat(D.projects.map(function (x) { return x.category; })
    .filter(function (v, i, a) { return a.indexOf(v) === i; }));

  function renderFilters() {
    $("#filters").innerHTML = cats.map(function (c) {
      return '<button class="chip" data-cat="' + escapeHTML(c) + '" aria-pressed="' + (c === state.cat) + '">' + escapeHTML(c) + "</button>";
    }).join("");
  }
  function matches(pr) {
    var inCat = state.cat === "All" || pr.category === state.cat;
    var hay = (pr.title + " " + pr.summary + " " + pr.tags.join(" ")).toLowerCase();
    return inCat && hay.indexOf(state.q) !== -1;
  }
  function renderProjects() {
    var list = D.projects.filter(matches);
    $("#noResults").hidden = list.length > 0;
    $("#projectGrid").innerHTML = list.map(function (x) {
      return '<article class="card reveal in"><h3>' + escapeHTML(x.title) + '</h3><div class="meta">' +
        escapeHTML(x.category) + " · " + escapeHTML(x.year) + "</div><p>" + escapeHTML(x.summary) + "</p><dl>" +
        "<dt>Problem: </dt><dd>" + escapeHTML(x.problem) + "</dd>" +
        "<dt>Outcome: </dt><dd>" + escapeHTML(x.outcome) + "</dd></dl>" +
        '<div class="tags">' + x.tags.map(function (t) { return '<span class="tag">' + escapeHTML(t) + "</span>"; }).join("") + "</div>" +
        '<div class="links"><a href="' + safeUrl(x.live) + '" target="_blank" rel="noopener">Live demo</a>' +
        '<a href="' + safeUrl(x.repo) + '" target="_blank" rel="noopener">Source</a></div></article>';
    }).join("");
  }
  $("#filters").addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    state.cat = b.getAttribute("data-cat"); renderFilters(); renderProjects();
  });
  $("#search").addEventListener("input", function (e) {
    state.q = e.target.value.trim().toLowerCase(); renderProjects();
  });
  renderFilters(); renderProjects();

  /* ---------- Timeline, posts, network ---------- */
  $("#timeline").innerHTML = D.timeline.map(function (t) {
    return '<li class="reveal"><span class="date">' + escapeHTML(t.date) + '</span><span class="badge">' + escapeHTML(t.type) +
      "</span><h3>" + escapeHTML(t.title) + " — " + escapeHTML(t.org) + "</h3><p>" + escapeHTML(t.text) + "</p></li>";
  }).join("");

  $("#posts").innerHTML = D.posts.map(function (b) {
    return '<a class="post reveal" href="' + safeUrl(b.url) + '"><time datetime="' + escapeHTML(b.date) + '">' +
      escapeHTML(b.date) + "</time><h3>" + escapeHTML(b.title) + "</h3><p class='muted'>" + escapeHTML(b.summary) + "</p></a>";
  }).join("");

  $("#quotes").innerHTML = D.testimonials.map(function (q) {
    return "<blockquote class='reveal'><p>“" + escapeHTML(q.quote) + "”</p><footer>— " + escapeHTML(q.by) + "</footer></blockquote>";
  }).join("");
  $("#social").innerHTML = D.social.map(function (s) {
    return '<a class="btn" href="' + safeUrl(s.url) + '" target="_blank" rel="noopener me">' + escapeHTML(s.label) + "</a>";
  }).join("");

  /* ---------- Contact form (client validation + mailto fallback) ---------- */
  $("#contactForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var f = e.target, msg = $("#formMsg");
    if (f.website.value) return; // honeypot caught a bot
    var name = f.name.value.trim(), email = f.email.value.trim(), text = f.message.value.trim();
    if (!name || !text || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      msg.textContent = "Please enter your name, a valid email and a message."; return;
    }
    var body = text + "\n\n— " + name + " (" + email + ")";
    window.location.href = "mailto:" + encodeURIComponent(p.email).replace("%40", "@") +
      "?subject=" + encodeURIComponent("Portfolio enquiry from " + name) + "&body=" + encodeURIComponent(body);
    msg.textContent = "Opening your email app… (to receive messages without email, connect Formspree — see README).";
  });

  /* ---------- Animations (IntersectionObserver) ---------- */
  function animateCount(el) {
    var target = Number(el.getAttribute("data-count")), n = 0, step = Math.max(1, Math.round(target / 40));
    var t = setInterval(function () { n = Math.min(target, n + step); el.textContent = n + "+"; if (n >= target) clearInterval(t); }, 30);
  }
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add("in");
        en.target.querySelectorAll("[data-w]").forEach(function (i) { i.style.width = i.getAttribute("data-w") + "%"; });
        io.unobserve(en.target);
      });
    }, { threshold: 0.15 });
    document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });
    var so = new IntersectionObserver(function (en) {
      en.forEach(function (x) { if (x.isIntersecting) { animateCount(x.target); so.unobserve(x.target); } });
    });
    document.querySelectorAll("[data-count]").forEach(function (el) { so.observe(el); });
  } else {
    document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("in"); });
    document.querySelectorAll("[data-w]").forEach(function (i) { i.style.width = i.getAttribute("data-w") + "%"; });
    document.querySelectorAll("[data-count]").forEach(function (el) { el.textContent = el.getAttribute("data-count") + "+"; });
  }

  /* ---------- Active nav link on scroll ---------- */
  var links = Array.prototype.slice.call(document.querySelectorAll("nav a"));
  window.addEventListener("scroll", function () {
    var y = window.scrollY + 120, cur = null;
    links.forEach(function (a) {
      var s = document.querySelector(a.getAttribute("href"));
      if (s && s.offsetTop <= y) cur = a;
    });
    links.forEach(function (a) { a.classList.toggle("active", a === cur); });
  }, { passive: true });
})();
