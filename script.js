/* ==========================================================
   Gartenpflege Angeloff – Interaktionen & Animationen
   Lenis · GSAP ScrollTrigger
   ========================================================== */
(function () {
  'use strict';

  const hasGSAP = typeof window.gsap !== 'undefined';
  const hasST = typeof window.ScrollTrigger !== 'undefined';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  document.getElementById('year').textContent = new Date().getFullYear();

  // Ohne GSAP oder bei reduzierter Bewegung: alles sofort sichtbar, kein Preloader
  if (!hasGSAP || !hasST || reduce) {
    const pre = $('#preloader');
    if (pre) pre.remove();
    document.body.classList.remove('is-loading');
    initNavBasic();
    initFab();
    return;
  }

  document.documentElement.classList.add('js');
  document.body.classList.add('is-loading');
  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Smooth Scroll (Lenis) ---------- */
  let lenis = null;
  if (typeof window.Lenis !== 'undefined') {
    lenis = new Lenis({ duration: 1.15, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
    $$('a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        const id = a.getAttribute('href');
        if (id.length < 2) return;
        const target = $(id);
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: -60, duration: 1.6 });
      });
    });
  }

  /* ---------- Text in Zeilen / Wörter splitten ---------- */
  function splitLines(el) {
    // Wörter in Spans wickeln, danach nach offsetTop zu Zeilen gruppieren
    if (el.dataset.split) return $$('.line-in', el);
    const html = el.innerHTML.replace(/<br\s*\/?>/gi, ' <br> ');
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    const tokens = [];
    (function walk(node, wrapTag) {
      node.childNodes.forEach(n => {
        if (n.nodeType === 3) {
          n.textContent.split(/\s+/).filter(Boolean).forEach(w => tokens.push({ w, tag: wrapTag }));
        } else if (n.nodeName === 'BR') {
          tokens.push({ br: true });
        } else {
          walk(n, n.nodeName.toLowerCase());
        }
      });
    })(tmp, null);
    el.innerHTML = '';
    const spans = tokens.map(t => {
      if (t.br) { const b = document.createElement('br'); el.appendChild(b); return null; }
      const s = document.createElement('span');
      s.className = 'w'; s.style.display = 'inline-block';
      s.innerHTML = t.tag ? `<${t.tag}>${t.w}</${t.tag}>` : t.w;
      el.appendChild(s); el.appendChild(document.createTextNode(' '));
      return s;
    });
    const words = spans.filter(Boolean);
    const rows = [];
    let lastTop = null;
    words.forEach(w => {
      const top = w.offsetTop;
      if (lastTop === null || Math.abs(top - lastTop) > 4) { rows.push([]); lastTop = top; }
      rows[rows.length - 1].push(w);
    });
    el.innerHTML = '';
    rows.forEach(r => {
      const line = document.createElement('span'); line.className = 'line';
      const inner = document.createElement('span'); inner.className = 'line-in';
      inner.innerHTML = r.map(w => w.innerHTML).join(' ');
      line.appendChild(inner); el.appendChild(line);
    });
    el.dataset.split = '1';
    return $$('.line-in', el);
  }

  /* ---------- Preloader ---------- */
  const pre = $('#preloader');
  const preNum = $('#preNum');
  let loadedDone = false;

  function runPreloader() {
    const tl = gsap.timeline({ onComplete: finishPreloader });
    const counter = { v: 0 };
    tl.to('.ps', { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut', stagger: .15 }, 0)
      .to('.pre-bar i', { scaleX: 1, duration: 1.5, ease: 'power2.inOut' }, 0)
      .to(counter, { v: 100, duration: 1.5, ease: 'power2.inOut', onUpdate: () => { preNum.textContent = Math.round(counter.v); } }, 0)
      .from('.pre-name', { y: 20, opacity: 0, duration: .8, ease: 'power3.out' }, .2)
      .to('.pre-center', { opacity: 0, y: -20, duration: .5, ease: 'power2.in' }, 1.7)
      .to('.pre-top', { yPercent: -100, duration: 1.1, ease: 'power4.inOut' }, 2.0)
      .to('.pre-bottom', { yPercent: 100, duration: 1.1, ease: 'power4.inOut' }, 2.0)
      .add(startSite, 2.25);
  }
  function finishPreloader() {
    if (pre) pre.remove();
    document.body.classList.remove('is-loading');
    if (lenis) lenis.start();
  }

  /* ---------- Site starten (Hero-Intro) ---------- */
  let started = false;
  function startSite() {
    if (started) return; started = true;
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(run);
  }
  function run() {
    initAll();
    const hero = splitLines($('#heroTitle'));
    gsap.set(hero, { yPercent: 115 });
    gsap.fromTo('.hero-bg img', { scale: 1.2 }, { scale: 1.05, duration: 2.8, ease: 'power2.out' });
    gsap.timeline({ defaults: { ease: 'power4.out' } })
      .to(hero, { yPercent: 0, duration: 1.4, stagger: .12 }, 0)
      .to('.hero .reveal-fade', { opacity: 1, y: 0, duration: 1.1, stagger: .12 }, .35)
      .fromTo('#nav', { yPercent: -110 }, { yPercent: 0, duration: 1, ease: 'power3.out' }, .5);
    gsap.set('.hero .reveal-fade', { y: 24 });
  }

  // Failsafe: falls etwas hängt, Seite trotzdem freigeben
  setTimeout(() => { if (!started) { startSite(); } if (pre && document.body.classList.contains('is-loading')) finishPreloader(); }, 7000);

  window.addEventListener('load', () => { loadedDone = true; });
  runPreloader();

  /* ==========================================================
     Alles Weitere wird erst nach dem Preloader initialisiert
     ========================================================== */
  function initAll() {
    initNavBasic();
    initFab();
    initCursor();
    initMagnetic();
    initReveals();
    initParallax();
    initTilt();
    initSteps();
    initStoneImages();
    // Layout nach dem Splitten neu berechnen
    setTimeout(() => ScrollTrigger.refresh(), 300);
    window.addEventListener('load', () => ScrollTrigger.refresh());
  }

  /* ---------- Navigation: Hintergrund + Auto-Hide ---------- */
  function initNavBasic() {
    const nav = $('#nav'); if (!nav) return;
    let last = 0, hidden = false;
    const onScroll = () => {
      const y = window.scrollY;
      nav.classList.toggle('scrolled', y > 40);
      const hide = y > last && y > 500;
      if (hide !== hidden) {
        hidden = hide;
        if (window.gsap) gsap.to(nav, { yPercent: hide ? -110 : 0, duration: .5, ease: 'power3.out', overwrite: 'auto' });
        else nav.classList.toggle('hide', hide);
      }
      last = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Mobiler Anruf-Button ---------- */
  function initFab() {
    const fab = $('.call-fab'); if (!fab) return;
    const hero = $('.hero'); const final = $('#kontakt');
    const update = () => {
      const y = window.scrollY, h = hero.offsetHeight;
      const finalTop = final.getBoundingClientRect().top;
      fab.classList.toggle('show', y > 80 && finalTop > window.innerHeight * .7);
    };
    window.addEventListener('scroll', update, { passive: true }); update();
  }

  /* ---------- Custom Cursor ---------- */
  function initCursor() {
    if (!finePointer) return;
    const c = $('#cursor'); if (!c) return;
    document.body.classList.add('has-cursor');
    const dot = $('.cursor-dot', c), ring = $('.cursor-ring', c), label = $('span', ring);
    gsap.set([dot, ring], { xPercent: -50, yPercent: -50 });
    const dx = gsap.quickTo(dot, 'x', { duration: .1, ease: 'power3' });
    const dy = gsap.quickTo(dot, 'y', { duration: .1, ease: 'power3' });
    const rx = gsap.quickTo(ring, 'x', { duration: .45, ease: 'power3' });
    const ry = gsap.quickTo(ring, 'y', { duration: .45, ease: 'power3' });
    window.addEventListener('mousemove', e => {
      c.classList.add('on');
      dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY);
    }, { passive: true });
    document.addEventListener('mouseleave', () => c.classList.remove('on'));
    const bind = (sel, cls, text) => {
      $$(sel).forEach(el => {
        el.addEventListener('mouseenter', () => { c.classList.add(cls); if (text) label.textContent = text; });
        el.addEventListener('mouseleave', () => c.classList.remove(cls));
      });
    };
    bind('a[href^="tel:"]', 'call', 'Anrufen');
    bind('a:not([href^="tel:"]), summary, .card', 'hover');
  }

  /* ---------- Magnetische Buttons ---------- */
  function initMagnetic() {
    if (!finePointer) return;
    $$('.magnetic').forEach(el => {
      const strength = el.classList.contains('phone-mega') ? .25 : .35;
      const mx = gsap.quickTo(el, 'x', { duration: .6, ease: 'elastic.out(1, .5)' });
      const my = gsap.quickTo(el, 'y', { duration: .6, ease: 'elastic.out(1, .5)' });
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        mx((e.clientX - (r.left + r.width / 2)) * strength);
        my((e.clientY - (r.top + r.height / 2)) * strength);
      });
      el.addEventListener('mouseleave', () => { mx(0); my(0); });
    });
  }

  /* ---------- Scroll-Reveals ---------- */
  function initReveals() {
    // Überschriften zeilenweise
    $$('.split-lines').forEach(h => {
      const lines = splitLines(h);
      gsap.set(lines, { yPercent: 115 });
      gsap.to(lines, {
        yPercent: 0, duration: 1.2, ease: 'power4.out', stagger: .1,
        scrollTrigger: { trigger: h, start: 'top 86%', once: true }
      });
    });

    // Einzelne Elemente
    const groups = new Map();
    $$('[data-reveal]').forEach(el => {
      const p = el.parentElement;
      if (!groups.has(p)) groups.set(p, []);
      groups.get(p).push(el);
    });
    groups.forEach(els => {
      gsap.set(els, { y: 40, opacity: 0 });
      ScrollTrigger.batch(els, {
        start: 'top 90%', once: true,
        onEnter: b => gsap.to(b, { y: 0, opacity: 1, duration: 1, ease: 'power3.out', stagger: .1, overwrite: true })
      });
    });

    // Buchstaben-Reveal für die Telefonnummer
    const num = $('.phone-num');
    if (num) {
      const txt = num.textContent; num.innerHTML = '';
      txt.split('').forEach(ch => {
        const s = document.createElement('span');
        s.textContent = ch === ' ' ? ' ' : ch; s.style.display = 'inline-block'; num.appendChild(s);
      });
      const chars = $$('span', num);
      gsap.from(chars, { yPercent: 100, opacity: 0, rotate: 8, duration: .9, ease: 'back.out(1.6)', stagger: .04, scrollTrigger: { trigger: num, start: 'top 90%', once: true } });
    }
  }

  /* ---------- Parallax ---------- */
  function initParallax() {
    $$('[data-parallax]').forEach(el => {
      const f = parseFloat(el.dataset.parallax);
      const isHero = el.classList.contains('hero-bg');
      gsap.to(el, {
        y: () => f * (isHero ? window.innerHeight : 300) * (isHero ? 1 : -1) * (isHero ? 1 : 1),
        ease: 'none',
        scrollTrigger: { trigger: isHero ? '.hero' : el, start: isHero ? 'top top' : 'top bottom', end: isHero ? 'bottom top' : 'bottom top', scrub: true, invalidateOnRefresh: true }
      });
    });
    // Team-Ringe drehen
    gsap.to('.team-ring', { rotate: 40, ease: 'none', scrollTrigger: { trigger: '.team', start: 'top bottom', end: 'bottom top', scrub: true } });
    // Services-Glow wandert
    gsap.to('.services-glow', { yPercent: 60, xPercent: -20, ease: 'none', scrollTrigger: { trigger: '.services', start: 'top bottom', end: 'bottom top', scrub: true } });
    // Hero-Inhalt blendet beim Scrollen weg
    gsap.to('.hero-inner', { opacity: 0, y: -60, ease: 'none', scrollTrigger: { trigger: '.hero', start: '35% top', end: 'bottom top', scrub: true } });
  }

  /* ---------- Steinbilder: Maske + Zoom ---------- */
  function initStoneImages() {
    $$('.img-mask').forEach(m => {
      const img = $('img', m);
      gsap.fromTo(m, { clipPath: 'inset(100% 0% 0% 0% round 22px)' }, { clipPath: 'inset(0% 0% 0% 0% round 22px)', duration: 1.5, ease: 'power4.inOut', scrollTrigger: { trigger: m, start: 'top 88%', once: true } });
      gsap.to(img, { scale: 1, yPercent: -6, ease: 'none', scrollTrigger: { trigger: m, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    gsap.from('.stone-badge', { scale: 0, rotate: -120, duration: 1.2, ease: 'back.out(1.6)', scrollTrigger: { trigger: '.stone-media', start: 'top 60%', once: true } });
  }

  /* ---------- Karten: 3D-Tilt + Spotlight ---------- */
  function initTilt() {
    if (!finePointer) return;
    $$('[data-tilt]').forEach(card => {
      const rx = gsap.quickTo(card, 'rotationX', { duration: .5, ease: 'power3' });
      const ry = gsap.quickTo(card, 'rotationY', { duration: .5, ease: 'power3' });
      gsap.set(card, { transformPerspective: 900 });
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        card.style.setProperty('--mx', (px * 100) + '%');
        card.style.setProperty('--my', (py * 100) + '%');
        ry((px - .5) * 8); rx(-(py - .5) * 8);
      });
      card.addEventListener('mouseleave', () => { rx(0); ry(0); });
    });
  }

  /* ---------- Ablauf: Linie füllt sich ---------- */
  function initSteps() {
    const line = $('.steps-line i'); if (!line) return;
    gsap.to(line, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: '.steps-list', start: 'top 80%', end: 'top 35%', scrub: true } });
  }
})();
