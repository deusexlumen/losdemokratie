/* main.js v3.0 — interactions, scrolltelling, audio dock, share links */
document.addEventListener('DOMContentLoaded', () => {

  /* ---------- READ PROGRESS ---------- */
  const progress = document.getElementById('read-progress');
  const docH = () => document.documentElement.scrollHeight - window.innerHeight;
  window.addEventListener('scroll', () => {
    const pct = Math.min(100, Math.max(0, (window.scrollY / Math.max(1, docH())) * 100));
    if (progress) progress.style.width = pct + '%';
  }, { passive: true });

  /* ---------- THEME & ACCENT ---------- */
  const themeBtn = document.getElementById('theme-toggle');
  const accentBtn = document.getElementById('accent-toggle');
  const root = document.documentElement;
  if (localStorage.getItem('ld_theme') === 'light') document.body.classList.add('light');
  const accents = ['#d43f3a','#b54b8a','#3aa7ff','#27b27b'];
  let accentIndex = parseInt(localStorage.getItem('ld_accent')||'0',10);
  root.style.setProperty('--accent', accents[accentIndex]);
  themeBtn?.addEventListener('click', () => {
    document.body.classList.toggle('light');
    localStorage.setItem('ld_theme', document.body.classList.contains('light') ? 'light' : 'dark');
  });
  accentBtn?.addEventListener('click', () => {
    accentIndex = (accentIndex + 1) % accents.length;
    root.style.setProperty('--accent', accents[accentIndex]);
    localStorage.setItem('ld_accent', String(accentIndex));
  });

  /* ---------- SECTION ANIMATIONS & TOC ---------- */
  const sections = document.querySelectorAll('.section');
  const tocLinks = document.querySelectorAll('.toc a');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      const id = e.target.id;
      const link = document.querySelector(`.toc a[href="#${id}"]`);
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        if (link) link.classList.add('active');
      } else {
        if (link) link.classList.remove('active');
      }
    });
  }, { root: null, rootMargin: '0px 0px -28% 0px', threshold: 0.12 });
  sections.forEach(s => io.observe(s));

  // smooth jump for toc links while preserving animation
  tocLinks.forEach(a => a.addEventListener('click', (ev) => {
    ev.preventDefault();
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    target.focus({ preventScroll: true });
  }));

  /* ---------- COPY ANCHORS ---------- */
  document.querySelectorAll('.copy-anchor').forEach(btn => {
    btn.addEventListener('click', (ev) => {
      const sec = ev.target.closest('.section');
      if (!sec) return;
      const url = `${location.origin}${location.pathname}#${sec.id}`;
      navigator.clipboard?.writeText(url).then(() => {
        const old = ev.target.innerText;
        ev.target.innerText = '✅';
        setTimeout(() => ev.target.innerText = old, 1200);
      }).catch(() => prompt('Link kopieren:', url));
    });
  });

  /* ---------- AUDIO SINGLE-PLAY + DOCK ---------- */
  const audios = Array.from(document.querySelectorAll('audio'));
  const dock = createAudioDock();
  let currentAudio = null;

  function createAudioDock(){
    // create dock element if not present (we already have markup hidden via CSS in index)
    const dockEl = document.querySelector('.audio-dock') || (function(){
      const el = document.createElement('div');
      el.className = 'audio-dock';
      el.innerHTML = `<div class="dock-left"><strong id="dock-title">—</strong><span id="dock-state" class="muted">stopped</span></div><div class="dock-controls"><button id="dock-play" class="icon-btn">▶</button><a id="dock-download" class="download-link-small" href="#" download>Download</a></div>`;
      document.body.appendChild(el);
      return el;
    })();
    return dockEl;
  }

  const dockTitle = document.getElementById('dock-title');
  const dockState = document.getElementById('dock-state');
  const dockPlay = document.getElementById('dock-play');
  const dockDownload = document.getElementById('dock-download');

  audios.forEach(a => {
    a.preload = 'metadata';
    a.addEventListener('play', () => {
      audios.forEach(x => { if (x !== a) x.pause(); });
      currentAudio = a;
      const title = a.dataset.title || (a.querySelector('source')?.getAttribute('src') || '').split('/').pop();
      dockTitle.innerText = title || 'Audio';
      dockState.innerText = 'playing';
      dockDownload.href = a.querySelector('source')?.getAttribute('src') || '#';
      dockDownload.setAttribute('download', dockDownload.href.split('/').pop());
      if (dock) dock.classList.add('visible');
      if (dockPlay) dockPlay.innerText = '⏸';
    });
    a.addEventListener('pause', () => {
      if (currentAudio === a) {
        dockState.innerText = 'paused';
        if (dockPlay) dockPlay.innerText = '▶';
      }
    });
    a.addEventListener('ended', () => {
      dockState.innerText = 'stopped';
      if (dockPlay) dockPlay.innerText = '▶';
    });
  });

  dockPlay?.addEventListener('click', () => {
    if (!currentAudio) return;
    if (currentAudio.paused) currentAudio.play(); else currentAudio.pause();
  });

  // auto-hide dock after timeout when not interacting
  let dockTimer;
  document.addEventListener('mousemove', () => {
    if (!dock) return;
    if (dock.classList.contains('visible')) {
      clearTimeout(dockTimer);
      dockTimer = setTimeout(() => dock.classList.remove('visible'), 6000);
    }
  });

  /* ---------- small accessibility: show focus rings after tab usage ---------- */
  function handleFirstTab(e){ if (e.key === 'Tab') { document.body.classList.add('show-focus'); window.removeEventListener('keydown', handleFirstTab); } }
  window.addEventListener('keydown', handleFirstTab);

  /* ---------- SHARE LINKS SETUP ---------- */
  function setupShareLinks(){
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(document.title);
    const shareEmail = document.getElementById('share-email');
    const shareX = document.getElementById('share-x');
    const shareFacebook = document.getElementById('share-facebook');
    if (shareEmail) shareEmail.href = `mailto:?subject=${title}&body=Schau dir dieses Dossier zur Isonomie an: ${url}`;
    if (shareX) shareX.href = `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
    if (shareFacebook) shareFacebook.href = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
  }
  setupShareLinks();

  /* ---------- tiny parallax for hero on scroll ---------- */
  const hero = document.getElementById('hero');
  window.addEventListener('scroll', () => {
    if (!hero) return;
    const sc = window.scrollY;
    hero.querySelector('.hero-bg')?.style.setProperty('transform', `translateY(${sc * 0.08}px)`);
  }, { passive: true });

});
