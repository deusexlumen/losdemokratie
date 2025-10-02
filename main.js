/* main.js v8 — stabile/robuste Version mit Debug-Logs und fixes */
(function () {
  const hasGSAP = (typeof window.gsap !== 'undefined');
  const hasScrollTrigger = (typeof window.ScrollTrigger !== 'undefined');

  document.addEventListener('DOMContentLoaded', () => {
    console.info('Dossier v8 initializing — GSAP:', !!hasGSAP, 'ScrollTrigger:', !!hasScrollTrigger, 'WebAudio:', !!(window.AudioContext || window.webkitAudioContext));

    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (hasGSAP && hasScrollTrigger) try { gsap.registerPlugin(ScrollTrigger); } catch (e) { console.warn('GSAP registerPlugin failed', e); }

    /* ---------- READ PROGRESS ---------- */
    const progress = document.getElementById('read-progress');
    function updateProgress() {
      try {
        const h = document.documentElement.scrollHeight - window.innerHeight;
        const pct = Math.min(100, Math.max(0, (window.scrollY / Math.max(1, h)) * 100));
        if (progress) progress.style.width = pct + '%';
      } catch (e) { /* ignore */ }
    }
    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();

    /* ---------- HERO entrance & subtle parallax ---------- */
    if (!prefersReduced && hasGSAP) {
      try {
        const tl = gsap.timeline();
        tl.from('.title', { y: 26, opacity: 0, duration: 0.9, ease: 'power3.out' })
          .from('.lead', { y: 16, opacity: 0, duration: 0.9, ease: 'power3.out' }, '-=0.45');
      } catch (e) { console.warn('Hero GSAP animation failed', e); }
    }
    const hero = document.getElementById('hero');
    window.addEventListener('scroll', () => {
      if (!hero) return;
      const y = Math.min(120, window.scrollY * 0.06);
      const bg = hero.querySelector('.hero-bg');
      if (bg) bg.style.transform = `translateY(${y}px)`;
    }, { passive: true });

    /* ---------- SECTION ANIMATIONS & TOC ---------- */
    const sections = Array.from(document.querySelectorAll('.section'));
    const tocLinks = Array.from(document.querySelectorAll('.toc a'));
    const root = document.documentElement;
    const accentSet = ['#d43f3a', '#b54b8a', '#3aa7ff', '#27b27b', '#f39c12', '#7cc576'];

    if (hasGSAP && hasScrollTrigger && !prefersReduced) {
      sections.forEach((sec, idx) => {
        try {
          gsap.fromTo(sec, { opacity: 0, y: 30, scale: 0.998 }, {
            opacity: 1, y: 0, scale: 1, duration: 0.9, ease: 'power3.out',
            scrollTrigger: {
              trigger: sec,
              start: 'top 72%',
              end: 'bottom 28%',
              toggleActions: 'play none none reverse',
              onEnter: () => {
                tocLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${sec.id}`));
                const c = accentSet[idx % accentSet.length];
                try { gsap.to(root, { duration: 0.7, ease: 'power2.out', css: { '--accent': c } }); } catch (e) { document.documentElement.style.setProperty('--accent', c); }
              },
              onEnterBack: () => {
                tocLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${sec.id}`));
              }
            }
          });
        } catch (e) {
          // fallback: simply reveal
          sec.classList.add('visible');
        }
      });
    } else {
      sections.forEach(s => s.classList.add('visible'));
    }

    // TOC smooth scrolling
    tocLinks.forEach(a => {
      a.addEventListener('click', (ev) => {
        ev.preventDefault();
        const target = document.querySelector(a.getAttribute('href'));
        if (!target) return;
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        target.focus({ preventScroll: true });
      });
    });

    /* ---------- CINEMATIC PINNED SCENE ---------- */
    if (hasGSAP && hasScrollTrigger && !prefersReduced) {
      try {
        const scene = gsap.timeline({
          scrollTrigger: {
            trigger: '#cinematic',
            start: 'top top',
            end: '+=200%',
            scrub: true,
            pin: true,
            anticipatePin: 1
          }
        });

        scene
          .to('.scene-title', { opacity: 1, y: -20, duration: 1 })
          .to('.scene-sub', { opacity: 1, y: -10, duration: 1 }, '-=0.5')
          .to('.scene-bg', { background: 'radial-gradient(circle at center, rgba(212,63,58,0.25), transparent 80%)', duration: 2 }, '-=0.5')
          .to('.scene-keywords span', { opacity: 1, scale: 1, stagger: 0.28, duration: 1.2, ease: 'back.out(1.7)' }, '-=0.5')
          .to('.scene-keywords span', { y: -30, opacity: 0, stagger: 0.2, duration: 1, ease: 'power2.in' })
          .to('.scene-title, .scene-sub', { opacity: 0, y: -40, duration: 1 }, '-=0.8');
      } catch (e) { console.warn('Cinematic scene failed to init', e); }
    }

    /* ---------- COPY-ANCHOR ---------- */
    document.querySelectorAll('.copy-anchor').forEach(btn => {
      btn.addEventListener('click', (ev) => {
        const sec = ev.target.closest('.panel');
        if (!sec || !sec.id) return;
        const url = `${location.origin}${location.pathname}#${sec.id}`;
        navigator.clipboard?.writeText(url).then(() => {
          const old = ev.target.innerText;
          ev.target.innerText = '✅';
          setTimeout(() => ev.target.innerText = old, 1100);
        }).catch(() => prompt('Link kopieren:', url));
      });
    });

    /* ---------- AUDIO VISUALIZER + DOCK (robust) ---------- */
    const audios = Array.from(document.querySelectorAll('audio'));
    let audioContext = null;
    let analyser = null;
    let dataArray = null;
    let rafId = null;
    let currentAudio = null;
    let audioToSource = new WeakMap();

    const dock = document.querySelector('.audio-dock');
    const dockTitle = document.getElementById('dock-title');
    const dockState = document.getElementById('dock-state');
    const dockPlay = document.getElementById('dock-play');
    const dockDownload = document.getElementById('dock-download');
    const canvas = document.getElementById('wave-canvas');
    const ctx = canvas ? canvas.getContext('2d') : null;
    let canvasWidth = 0, canvasHeight = 0;

    function initAudioContext() {
      if (audioContext) return audioContext;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      audioContext = new AC();
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      dataArray = new Uint8Array(analyser.fftSize);
      return audioContext;
    }

    function connectAnalyserToElement(el) {
      if (!el) return;
      if (!initAudioContext()) return;
      try {
        if (!audioToSource.has(el)) {
          // createMediaElementSource may fail if the element is already connected to another AudioContext or CORS flagged
          const srcNode = audioContext.createMediaElementSource(el);
          audioToSource.set(el, srcNode);
          srcNode.connect(analyser);
        } else {
          // ensure it's connected
          const srcNode = audioToSource.get(el);
          try { srcNode.connect(analyser); } catch (e) { /* ignore */ }
        }
        try { analyser.connect(audioContext.destination); } catch (e) { /* ignore */ }
      } catch (err) {
        console.warn('MediaElementSource failed (possible CORS/already-in-use). Visualizer disabled for this audio. Error:', err);
      }
    }

    function resizeCanvas() {
      if (!canvas || !ctx) return;
      const ratio = window.devicePixelRatio || 1;
      canvasWidth = canvas.clientWidth || 800;
      canvasHeight = canvas.clientHeight || 64;
      canvas.width = Math.floor(canvasWidth * ratio);
      canvas.height = Math.floor(canvasHeight * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    function drawVisualizer() {
      if (!analyser || !ctx) return;
      analyser.getByteTimeDomainData(dataArray);
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      // background gradient
      const grad = ctx.createLinearGradient(0, 0, canvasWidth, 0);
      grad.addColorStop(0, 'rgba(212,63,58,0.10)');
      grad.addColorStop(0.5, 'rgba(181,75,138,0.06)');
      grad.addColorStop(1, 'rgba(58,167,255,0.04)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // waveform path
      ctx.lineWidth = 2;
      let accent = getComputedStyle(document.documentElement).getPropertyValue('--accent') || '#d43f3a';
      accent = accent.trim() || '#d43f3a';
      ctx.strokeStyle = accent;
      ctx.beginPath();
      const len = dataArray.length;
      const sliceWidth = canvasWidth / len;
      let x = 0;
      const midY = canvasHeight / 2;
      for (let i = 0; i < len; i++) {
        const v = (dataArray[i] - 128) / 128.0; // -1 .. 1
        const y = midY + v * midY * 0.9; // scale down a bit
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
      }
      ctx.stroke();

      // fill under curve
      ctx.lineTo(canvasWidth, canvasHeight);
      ctx.lineTo(0, canvasHeight);
      ctx.closePath();
      ctx.globalAlpha = 0.06;
      ctx.fillStyle = accent;
      ctx.fill();
      ctx.globalAlpha = 1;

      rafId = requestAnimationFrame(drawVisualizer);
    }

    function stopVisualizer() {
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
      if (ctx) ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    }

    function showDock(show = true) {
      if (!dock) return;
      dock.classList.toggle('visible', show);
      dock.setAttribute('aria-hidden', show ? 'false' : 'true');
    }

    audios.forEach(a => {
      if (!a.dataset.title) {
        const src = a.querySelector('source')?.getAttribute('src') || '';
        a.dataset.title = decodeURIComponent(src.split('/').pop() || 'Audio');
      }

      a.addEventListener('play', async () => {
        // pause others
        audios.forEach(x => { if (x !== a) x.pause(); });
        currentAudio = a;

        // visual highlight
        document.querySelectorAll('.panel').forEach(p => p.classList.remove('playing'));
        const panel = a.closest('.panel');
        if (panel) panel.classList.add('playing');

        // init audio context and connect analyser
        if (!initAudioContext()) { console.warn('WebAudio not available — visualizer disabled'); }
        else {
          try { await audioContext.resume(); } catch (e) { /* ignore */ }
          connectAnalyserToElement(a);
        }

        // update dock
        if (dockTitle) dockTitle.innerText = a.dataset.title || 'Audio';
        if (dockState) dockState.innerText = 'playing';
        const src = a.querySelector('source')?.getAttribute('src') || '#';
        if (dockDownload) { dockDownload.href = encodeURI(src); dockDownload.setAttribute('download', src.split('/').pop()); }

        showDock(true);
        stopVisualizer();
        drawVisualizer();
        if (dockPlay) dockPlay.innerText = '⏸';
      });

      a.addEventListener('pause', () => {
        if (dockState) dockState.innerText = 'paused';
        const panel = a.closest('.panel');
        if (panel) panel.classList.remove('playing');
        if (dockPlay) dockPlay.innerText = '▶';
        stopVisualizer();
      });

      a.addEventListener('ended', () => {
        if (dockState) dockState.innerText = 'stopped';
        const panel = a.closest('.panel');
        if (panel) panel.classList.remove('playing');
        if (dockPlay) dockPlay.innerText = '▶';
        stopVisualizer();
      });
    });

    // dock play/pause
    dockPlay?.addEventListener('click', () => {
      if (!currentAudio) return;
      if (currentAudio.paused) currentAudio.play(); else currentAudio.pause();
    });

    // auto-hide dock after inactivity
    let dockTimer;
    document.addEventListener('mousemove', () => {
      if (!dock) return;
      if (dock.classList.contains('visible')) {
        clearTimeout(dockTimer);
        dockTimer = setTimeout(() => dock.classList.remove('visible'), 6000);
      }
    });

    // canvas initial sizing
    resizeCanvas();

    /* ---------- accessibility: focus rings after tab ---------- */
    function handleFirstTab(e) { if (e.key === 'Tab') { document.body.classList.add('show-focus'); window.removeEventListener('keydown', handleFirstTab); } }
    window.addEventListener('keydown', handleFirstTab);

    /* ---------- SHARE LINKS SETUP ---------- */
    function setupShareLinks() {
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

    /* ---------- respect reduced-motion ---------- */
    if (prefersReduced) {
      if (hasScrollTrigger) try { ScrollTrigger.getAll().forEach(st => st.disable()); } catch (e) {}
      stopVisualizer();
    }

    /* ---------- cleanup ---------- */
    window.addEventListener('pagehide', () => {
      stopVisualizer();
      // WeakMap will be garbage-collected; do not try to reassign consts
      if (analyser) try { analyser.disconnect(); } catch (e) {}
      if (audioContext && audioContext.state !== 'closed') try { audioContext.close().catch(()=>{}); } catch (e) {}
    });

  }); // DOMContentLoaded
})();
