/* New Mecca Cafe - shared script: language toggle, announcements, photo carousel */
(function () {
  'use strict';

  var root = document.documentElement;
  var LANG_KEY = 'meccaLang';

  /* ---------- Language toggle (remembered across pages) ---------- */
  window.toggleLanguage = function () {
    var next = root.classList.contains('es') ? 'en' : 'es';
    root.classList.toggle('es', next === 'es');
    root.lang = next;
    try { localStorage.setItem(LANG_KEY, next); } catch (e) { /* private mode: just don't remember */ }
  };

  /* ---------- Announcements ---------- */
  // Dates in announcements.json are treated as calendar dates in the
  // visitor's own time zone: a banner runs from the start date through the
  // end of the expire date.
  function parseDate(str) {
    var p = String(str).split('-');
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }

  function loadAnnouncements() {
    var banner = document.getElementById('announcement-banner');
    if (!banner) { return Promise.resolve(); }

    return fetch('announcements.json', { cache: 'no-cache' })
      .then(function (r) {
        if (!r.ok) { throw new Error('HTTP ' + r.status); }
        return r.json();
      })
      .then(function (data) {
        var today = new Date();
        today.setHours(0, 0, 0, 0);

        var active = (data.announcements || []).filter(function (a) {
          var start = parseDate(a.startDate);
          var end = parseDate(a.expireDate);
          return today >= start && today <= end;
        });

        if (active.length) {
          var en = '', es = '';
          active.forEach(function (a) {
            en += '<p>' + a.message_en + '</p>';
            es += '<p>' + a.message_es + '</p>';
          });
          banner.innerHTML =
            '<div class="english-content">' + en + '</div>' +
            '<div class="spanish-content">' + es + '</div>';
          banner.hidden = false;
        }
      })
      .catch(function () { /* no banner if the file is missing or invalid */ });
  }

  /* ---------- Photo carousel (home page only) ---------- */
  function initCarousel() {
    var slides = document.querySelectorAll('.carousel-image');
    if (!slides.length) { return; }

    var current = 0;
    var timer = null;
    var reduceMotion = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function show(n) {
      slides[current].classList.remove('active');
      current = (n + slides.length) % slides.length;
      slides[current].classList.add('active');
    }
    function start() {
      if (timer) { clearInterval(timer); }
      if (!reduceMotion) {
        timer = setInterval(function () { show(current + 1); }, 4000);
      }
    }

    document.querySelectorAll('.carousel-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        show(current + (btn.classList.contains('next') ? 1 : -1));
        start();   // restart the 4-second timer after a manual click
      });
    });
    start();
  }

  /* ---------- Go ---------- */
  function reveal() { root.classList.add('ready'); }

  initCarousel();
  loadAnnouncements().then(reveal, reveal);
})();
