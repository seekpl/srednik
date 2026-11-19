/* Średnik by .dot – animacje i interakcje strony głównej */
(() => {
  'use strict';
  window.__sr = true;

  const d = document;
  const root = d.documentElement;
  const $ = (s, c = d) => c.querySelector(s);
  const $$ = (s, c = d) => [...c.querySelectorAll(s)];

  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const mqMobile = matchMedia('(max-width: 999px)');
  const G = window.gsap;
  const ST = window.ScrollTrigger;
  const ANIM = !RM && !!G && !!ST;

  if (!ANIM) root.classList.remove('anim', 'has-intro');
  if (ANIM) {
    G.registerPlugin(ST);
    ['SplitText', 'ScrambleTextPlugin', 'DrawSVGPlugin'].forEach((p) => window[p] && G.registerPlugin(window[p]));
    ST.config({ ignoreMobileResize: true });
  }

  /* ---------- Zdjęcie w makiecie: bez pliku zostaje zapasowa ilustracja ---------- */
  $$('.s-img img, .p-img img, .s-img__shot').forEach((img) => {
    if (img.complete && img.naturalWidth === 0) img.remove();
    else img.addEventListener('error', () => img.remove(), { once: true });
  });

  /* ---------- Płynne przewijanie ---------- */
  let lenis = null;
  if (ANIM && window.Lenis) {
    lenis = new window.Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    lenis.on('scroll', ST.update);
    G.ticker.add((t) => lenis.raf(t * 1000));
    G.ticker.lagSmoothing(0);
  }

  const hdrH = () => parseFloat(getComputedStyle(root).getPropertyValue('--hdr')) || 76;

  function scrollToTarget(el, hash) {
    let y = hash === '#top' ? 0 : el.getBoundingClientRect().top + scrollY - hdrH() + 1;
    if (el.classList.contains('step')) y = el.getBoundingClientRect().top + scrollY - innerHeight * (mqMobile.matches ? 0.55 : 0.3);
    if (lenis) lenis.scrollTo(y, { duration: 1.5 });
    else scrollTo({ top: y, behavior: RM ? 'auto' : 'smooth' });
    if (hash !== '#top') {
      if (!el.hasAttribute('tabindex') && !/^(A|BUTTON|INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) el.setAttribute('tabindex', '-1');
      el.focus({ preventScroll: true });
    }
  }

  d.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const hash = a.getAttribute('href');
    if (hash.length < 2) return;
    const el = hash === '#top' ? d.body : $(hash);
    if (!el) return;
    e.preventDefault();
    const wasOpen = menuOpen;
    closeMenu(false);
    setTimeout(() => scrollToTarget(el, hash), wasOpen ? 80 : 0);
    history.replaceState(null, '', hash === '#top' ? location.pathname + location.search : hash);
  });

  /* ---------- Menu mobilne ---------- */
  const burger = $('[data-burger]');
  const menu = $('[data-menu]');
  let menuOpen = false;

  function openMenu() {
    menuOpen = true;
    menu.hidden = false;
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Zamknij menu');
    root.classList.add('menu-open');
    hdr.classList.remove('is-hidden');
    lenis && lenis.stop();
    if (ANIM) {
      G.fromTo(menu, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 0.7, ease: 'expo.out' });
      G.fromTo($$('.menu__nav a span', menu), { yPercent: 110 }, { yPercent: 0, duration: 0.9, ease: 'expo.out', stagger: 0.05, delay: 0.1 });
      G.fromTo($$('.menu__cta, .menu__tag', menu), { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.6, delay: 0.35, stagger: 0.08 });
    }
    const first = $('a', menu);
    first && first.focus({ preventScroll: true });
  }

  function closeMenu(returnFocus = true) {
    if (!menuOpen) return;
    menuOpen = false;
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Otwórz menu');
    root.classList.remove('menu-open');
    lenis && lenis.start();
    const done = () => { menu.hidden = true; };
    if (ANIM) G.to(menu, { clipPath: 'inset(0 0 100% 0)', duration: 0.5, ease: 'expo.in', onComplete: done });
    else done();
    if (returnFocus) burger.focus();
  }

  burger.addEventListener('click', () => (menuOpen ? closeMenu() : openMenu()));
  d.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menuOpen) closeMenu(); });
  mqMobile.addEventListener('change', (e) => { if (!e.matches) closeMenu(false); });

  /* ---------- Nagłówek, pasek postępu, aktywne linki ---------- */
  const hdr = $('[data-hdr]');
  const progress = $('[data-progress]');
  const navLinks = $$('.hdr__nav a');
  const navTargets = navLinks.map((a) => $(a.getAttribute('href')));
  let lastY = scrollY;

  function onScroll() {
    const y = scrollY;
    const max = root.scrollHeight - innerHeight;
    hdr.classList.toggle('is-scrolled', y > 8);
    if (!menuOpen) {
      if (y > lastY + 6 && y > 480) hdr.classList.add('is-hidden');
      else if (y < lastY - 6 || y < 120) hdr.classList.remove('is-hidden');
    }
    lastY = y;
    progress.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;

    const mid = innerHeight * 0.4;
    navTargets.forEach((t, i) => {
      if (!t) return;
      const r = t.getBoundingClientRect();
      navLinks[i].classList.toggle('is-active', r.top < mid && r.bottom > mid);
    });

    updateStory();
  }

  let ticking = false;
  addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; onScroll(); });
  }, { passive: true });
  addEventListener('resize', () => onScroll());

  /* ---------- Modernizacja na żywo (scena z makietą) ---------- */
  const stage = $('[data-stage]');
  const steps = $$('.step');
  const stageLabel = $('[data-stage-label]');
  const stageFill = $('[data-stage-fill]');
  const stageCount = $('[data-stage-count]');
  const chipTxt = $('[data-chip]');
  const titleC = $('.n-title-c');
  const LABELS = ['Przed', 'Nagłówek', 'Telefon', 'Oferta', 'Nowy porządek', 'Wersja mobilna', 'Po'];
  const CHIP_OLD = 'tel. 600 000 000';
  const CHIP_NEW = 'Zadzwoń: 600 000 000';
  const TITLE_OLD = 'Witamy na naszej stronie!';
  const TITLE_NEW = titleC.dataset.scramble;
  let current = -1;

  function scramble(el, text, opts = {}) {
    if (ANIM && window.ScrambleTextPlugin) {
      G.to(el, { duration: opts.duration || 1, delay: opts.delay || 0, ease: 'none', overwrite: true,
        scrambleText: { text, chars: opts.chars || 'abcdefghijklmnoprstuwyząćęłńóśźż', speed: 0.6, revealDelay: 0.15 } });
    } else {
      el.textContent = text;
    }
  }

  function setStep(n) {
    if (n === current) return;
    const prev = current;
    current = n;
    for (let i = 1; i <= 6; i++) stage.classList.toggle('s' + i, i <= n);
    steps.forEach((s) => s.classList.toggle('is-active', +s.dataset.step === n));
    stageLabel.textContent = LABELS[n];
    stageCount.textContent = n;
    stageFill.style.transform = `scaleX(${n / 6})`;

    if (prev === -1) return;
    if (n >= 1 && prev < 1) {
      if (ANIM) G.killTweensOf(titleC);
      titleC.textContent = TITLE_OLD;
      scramble(titleC, TITLE_NEW, { duration: 1.2, delay: 0.45 });
    }
    if (n >= 2 && prev < 2) scramble(chipTxt, CHIP_NEW, { duration: 0.8, delay: 0.55, chars: '0123456789' });
    if (n < 2 && prev >= 2) { ANIM && G.killTweensOf(chipTxt); chipTxt.textContent = CHIP_OLD; }
  }

  const storyVisual = $('.story__visual');
  const stepTitles = steps.map((s) => $('.step__title', s));

  function updateStory() {
    // Makieta zmienia się, gdy tytuł kroku wjedzie w dolną część ekranu –
    // wtedy tekst poprzedniego kroku właśnie z niego znika, więc na ekranie
    // nigdy nie zostaje sam wyszarzony opis.
    let line = innerHeight * 0.67;
    if (mqMobile.matches) {
      const top = Math.max(0, storyVisual.getBoundingClientRect().bottom);
      line = top + (innerHeight - top) * 0.66;
    }
    let n = 0;
    stepTitles.forEach((t, i) => { if (t.getBoundingClientRect().top < line) n = +steps[i].dataset.step; });
    setStep(n);
  }

  // Pochylenie makiety za kursorem
  if (ANIM && FINE) {
    const tilt = $('[data-tilt]');
    const rx = G.quickTo(tilt, 'rotationX', { duration: 0.9, ease: 'power3.out' });
    const ry = G.quickTo(tilt, 'rotationY', { duration: 0.9, ease: 'power3.out' });
    const story = $('[data-story]');
    story.addEventListener('pointermove', (e) => {
      if (mqMobile.matches) return;
      rx((e.clientY / innerHeight - 0.5) * -6);
      ry((e.clientX / innerWidth - 0.5) * 8);
    });
    story.addEventListener('pointerleave', () => { rx(0); ry(0); });
  }

  /* ---------- Intro i wejście hero ---------- */
  function heroIn() {
    if (!ANIM) { root.classList.add('hero-in'); return; }

    const tl = G.timeline({ defaults: { ease: 'expo.out' } });
    const rings = $$('.audit__ring');
    const pins = $$('.pin');

    tl.from(hdr, { yPercent: -100, duration: 1.1 }, 0)
      .from('[data-hero="title"]', { y: 24, opacity: 0, duration: 1.2 }, 0.05)
      .from('[data-hero="lead"], [data-hero="ctas"], [data-hero="note"], [data-hero="cue"]', { opacity: 0, duration: 1 }, 0.5)
      .from('.stage__tilt', { opacity: 0, y: 90, rotationX: 24, rotationY: -16, scale: 0.9, duration: 1.8, transformOrigin: '50% 100%' }, 0.25)
      .from('.stage-ui', { opacity: 0, y: 12, duration: 0.8 }, 1.1)
      .from('.sticker', { opacity: 0, scale: 1.8, rotation: 14, duration: 0.7, ease: 'back.out(2.2)' }, 1.0);

    if (window.DrawSVGPlugin) {
      tl.from('.fix__ring', { drawSVG: '0%', duration: 0.7, ease: 'power2.inOut' }, 0.7)
        .from(rings, { drawSVG: '0%', duration: 0.8, stagger: 0.28, ease: 'power2.inOut' }, 0.95);
    }
    tl.from('.fix__semi', { opacity: 0, scale: 0.4, rotation: -12, transformOrigin: '50% 100%', duration: 0.6, ease: 'back.out(2.4)' }, 1.3);
    tl.from(pins, { scale: 0, duration: 0.7, stagger: 0.28, ease: 'back.out(2.4)', clearProps: 'transform' }, 1.15)
      .from($$('.pin__tag'), { opacity: 0, x: (i) => (i < 2 ? 10 : -10), duration: 0.6, stagger: 0.28, ease: 'power3.out', clearProps: 'opacity,transform' }, 1.35);

    // zdejmujemy ukrycie z CSS dopiero gdy stany początkowe są już ustawione
    root.classList.add('hero-in');
  }

  function intro(done) {
    const el = $('.intro');
    if (!ANIM || !root.classList.contains('has-intro')) { el && el.remove(); done(); return; }
    try { sessionStorage.setItem('srednik-intro', '1'); } catch (e) { /* tryb prywatny */ }
    lenis && lenis.stop();
    scrollTo(0, 0);

    let started = false;
    const start = () => { if (!started) { started = true; done(); } };
    const tl = G.timeline({
      onComplete() { el.remove(); root.classList.remove('has-intro'); lenis && lenis.start(); },
    });
    G.set('.intro__dot', { opacity: 1, y: -320 });
    G.set('.intro__comma', { opacity: 1, scale: 0, transformOrigin: '50% 0%' });
    G.set('.intro__clip', { attr: { x: 735, width: 0 } });

    tl.to('.intro__dot', { y: 0, duration: 0.75, ease: 'bounce.out' }, 0.1)
      .to('.intro__comma', { scale: 1, duration: 0.5, ease: 'back.out(3)' }, 0.62)
      .to('.intro__clip', { attr: { x: 0, width: 800 }, duration: 0.85, ease: 'power3.inOut' }, 0.8)
      .to('.intro__by', { opacity: 1, duration: 0.4 }, 1.3)
      .to('.intro__logo', { y: -60, opacity: 0, duration: 0.6, ease: 'expo.in' }, 1.7)
      .to(el, { clipPath: 'inset(0 0 100% 0)', duration: 1, ease: 'expo.inOut' }, 1.85)
      .add(start, 2.05);

    el.addEventListener('click', () => { tl.progress(1); start(); }, { once: true });
  }

  /* ---------- Odsłanianie przy przewijaniu ---------- */
  function setIndexes(selector) {
    $$(selector).forEach((list) => [...list.children].forEach((c, i) => c.style.setProperty('--i', i)));
  }
  setIndexes('.checks');
  setIndexes('.offer');
  setIndexes('.faq');
  $$('.checks .check').forEach((c, i) => c.style.setProperty('--i', i));

  function scrollAnimations() {
    if (!ANIM) return;

    if (window.SplitText) {
      // Cytat – słowa „zapalają się” w rytm przewijania
      const q = $('[data-scrub-words]');
      const qs = window.SplitText.create(q, { type: 'words' });
      G.fromTo(qs.words, { opacity: 0.12 }, {
        opacity: 1, ease: 'none', stagger: 0.1,
        scrollTrigger: { trigger: q, start: 'top 82%', end: 'bottom 48%', scrub: 0.6 },
      });
    }

    // Pasek z hasłami – reaguje na prędkość i kierunek przewijania
    const track = $('[data-marquee]');
    const loop = G.to(track, { xPercent: -50, duration: 32, ease: 'none', repeat: -1 });
    loop.totalTime(loop.duration() * 400);
    let dir = 1;
    // poza ekranem i pod kursorem pasek stoi
    const marquee = $('.marquee');
    marquee.addEventListener('pointerenter', () => loop.pause());
    marquee.addEventListener('pointerleave', () => loop.play());
    ST.create({
      trigger: marquee, start: 'top bottom', end: 'bottom top',
      onToggle: (self) => (self.isActive ? loop.play() : loop.pause()),
      onUpdate(self) {
        dir = self.direction;
        const boost = Math.min(Math.abs(self.getVelocity()) / 250, 7);
        G.to(loop, { timeScale: dir * (1 + boost), duration: 0.25, overwrite: true,
          onComplete: () => G.to(loop, { timeScale: dir, duration: 1.2, ease: 'power2.out' }) });
      },
    });

    // Proces – linia wypełnia się, kroki zapalają po kolei
    G.fromTo('[data-process-fill]', { scaleY: 0 }, {
      scaleY: 1, ease: 'none',
      scrollTrigger: { trigger: '[data-process]', start: 'top 62%', end: 'bottom 62%', scrub: 0.4 },
    });
    $$('.process__step').forEach((s) => {
      ST.create({ trigger: s, start: 'top 66%', onEnter: () => s.classList.add('is-on'), onLeaveBack: () => s.classList.remove('is-on') });
    });

    // Stopka – kropka zamienia się w średnik
    const clip = $('.foot__clip');
    G.set(clip, { attr: { height: 120 } });
    G.set('.foot__dot', { scale: 0 });
    G.timeline({ scrollTrigger: { trigger: '[data-foot-tag]', start: 'top 85%', once: true } })
      .from('[data-foot-tag]', { y: 40, opacity: 0, duration: 1, ease: 'expo.out' })
      .to('.foot__comma', { opacity: 0.25, duration: 0.18, repeat: 3, yoyo: true, ease: 'none' }, '+=0.15')
      .to('.foot__dot', { scale: 1, duration: 0.6, ease: 'back.out(3)' }, '+=0.1')
      .to(clip, { attr: { height: 190 }, duration: 0.5, ease: 'power3.out' }, '-=0.3');

    // Wielki znak w stopce wyjeżdża od dołu
    G.from('[data-giant]', { yPercent: 55, ease: 'none', scrollTrigger: { trigger: '.foot__giant', start: 'top bottom', end: 'bottom bottom', scrub: 0.5 } });

    // Ikony etapów i elementy listy, które rysują się same – obsługuje CSS + IntersectionObserver
    d.fonts && d.fonts.ready.then(() => ST.refresh());
  }

  /* ---------- Lista objawów ---------- */
  const checks = $$('[data-checks] input');
  const verdict = $('[data-verdict]');
  const verdictText = $('[data-verdict-text]');
  const meter = $$('.verdict__meter i');
  const leadHl = $('[data-hl="scroll"]');
  const VERDICTS = [
    'Zaznacz objawy, które widzisz u siebie.',
    'Jeden objaw. Warto mieć stronę na oku.',
    'Dwa objawy – to już sygnał. Strona potrzebuje przeglądu.',
    'Trzy objawy. Audyt pokaże, od czego zacząć.',
    'Cztery objawy. Strona wyraźnie prosi o pomoc.',
    'Pięć objawów. Czas działać – zacznijmy od audytu.',
    'Komplet. Dobra wiadomość: to wszystko da się naprawić.',
  ];
  checks.forEach((input) => {
    const label = input.closest('.check');
    input.addEventListener('change', () => {
      label.classList.toggle('is-checked', input.checked);
      const n = checks.filter((c) => c.checked).length;
      meter.forEach((m, i) => m.classList.toggle('is-on', i < n));
      verdictText.textContent = VERDICTS[n];
      verdict.dataset.level = n;
      const ready = n >= 2;
      if (ready && !verdict.classList.contains('is-ready') && leadHl) {
        leadHl.classList.remove('is-on');
        void leadHl.offsetWidth;
        leadHl.classList.add('is-on');
      }
      verdict.classList.toggle('is-ready', ready);
      if (ANIM) G.fromTo(label, { scale: 0.97 }, { scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.45)', clearProps: 'scale' });
    });
    input.addEventListener('focus', () => label.classList.toggle('has-focus', input.matches(':focus-visible')));
    input.addEventListener('blur', () => label.classList.remove('has-focus'));
  });

  /* ---------- FAQ – płynne rozwijanie ---------- */
  $$('[data-faq] details').forEach((det) => {
    const sum = $('summary', det);
    const body = $('.faq__a', det);
    let anim = null;
    sum.addEventListener('click', (e) => {
      if (RM || !body.animate) return;
      e.preventDefault();
      if (anim) anim.cancel();
      if (det.open) {
        det.classList.add('is-closing');
        anim = body.animate([{ height: `${body.offsetHeight}px`, opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 380, easing: 'cubic-bezier(.65,0,.35,1)' });
        anim.onfinish = () => { det.open = false; det.classList.remove('is-closing'); anim = null; };
      } else {
        det.classList.remove('is-closing');
        det.open = true;
        anim = body.animate([{ height: '0px', opacity: 0 }, { height: `${body.offsetHeight}px`, opacity: 1 }], { duration: 520, easing: 'cubic-bezier(.16,1,.3,1)' });
        anim.onfinish = () => { anim = null; };
      }
    });
  });

  /* ---------- Formularz ---------- */
  const form = $('[data-form]');
  const formErr = $('[data-form-error]');
  const formDone = $('[data-form-done]');
  const fUrl = $('#f-url');
  const fMail = $('#f-mail');

  function fieldError(input, bad) {
    input.closest('.field').classList.toggle('is-invalid', bad);
    input.setAttribute('aria-invalid', bad ? 'true' : 'false');
  }
  [fUrl, fMail].forEach((i) => i.addEventListener('input', () => fieldError(i, false)));

  // Przyciski z oferty podpowiadają treść wiadomości
  $$('[data-topic]').forEach((a) => a.addEventListener('click', () => {
    const msg = $('#f-msg');
    if (!msg.value.trim()) msg.value = a.dataset.topic;
  }));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const urlOk = /^(https?:\/\/)?[^\s/.]+(\.[^\s/.]+)+(\/\S*)?$/i.test(fUrl.value.trim());
    const mailOk = fMail.value.trim() !== '' && fMail.checkValidity();
    fieldError(fUrl, !urlOk);
    fieldError(fMail, !mailOk);
    if (!urlOk || !mailOk) {
      formErr.textContent = !urlOk && !mailOk ? 'Podaj adres strony i e-mail, na który odpiszemy.'
        : !urlOk ? 'Sprawdź adres strony – np. twojafirma.pl.' : 'Sprawdź adres e-mail.';
      form.classList.remove('shake'); void form.offsetWidth; form.classList.add('shake');
      (!urlOk ? fUrl : fMail).focus();
      return;
    }
    formErr.textContent = '';
    const btn = $('.form__submit', form);
    const btnLabel = $('.btn__label', btn);
    btn.classList.add('is-loading');
    btnLabel.textContent = 'Wysyłam…';

    const endpoint = form.getAttribute('action');
    const isBot = form.elements.firma_www && form.elements.firma_www.value;
    try {
      if (endpoint && !isBot) {
        const res = await fetch(endpoint, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error(res.status);
      } else {
        // Brak skonfigurowanego adresu wysyłki – tryb pokazowy (patrz README)
        await new Promise((r) => setTimeout(r, 900));
      }
      form.classList.add('is-done');
      formDone.focus();
    } catch (err) {
      formErr.innerHTML = 'Nie udało się wysłać formularza. Napisz na <a href="mailto:sebastian.biel@me.com">sebastian.biel@me.com</a> albo zadzwoń: <a href="tel:+48790700061">790&nbsp;700&nbsp;061</a>.';
    } finally {
      btn.classList.remove('is-loading');
      btnLabel.textContent = 'Wyślij do oceny';
    }
  });

  /* ---------- Start ---------- */
  onScroll();
  intro(heroIn);
  scrollAnimations();
})();
