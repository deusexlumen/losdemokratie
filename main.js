/* main.js v6 — GSAP + ScrollTrigger + Audio Visualizer + Dock + Share Links */
(function () {
  // Safeguard: if GSAP/ScrollTrigger missing, degrade gracefully
  const hasGSAP = (typeof window.gsap !== 'undefined');
  const hasScrollTrigger = (typeof window.ScrollTrigger !== 'undefined');

  document.addEventListener('DOMContentLoaded', () => {
    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (hasGSAP && hasScrollTrigger) gsap.registerPlugin(ScrollTrigger);

    /* ---------- READ PROGRESS ---------- */
    const progress = document.getElementById('read-progress');
    function updateProgress() {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      const pct = Math.min(100, Math.max(0, (window.scrollY / Math.max(1, h)) * 100));
      if (progress) progress.style.width = pct + '%';
    }
    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();

    /* ---------- HERO PARALLAX & ENTRANCE ---------- */
    if (!prefersReduced && hasGSAP) {
      const tl = gsap.timeline();
      tl.from('.eyebrow', { y: 18, opacity: 0, duration: 0.8, ease: 'power3.out' })
        .from('.title', { y: 28, opacity: 0, duration: 0.9, ease: 'power3.out' }, '-=0.5')
        .from('.lead', { y: 18, opacity: 0, duration: 0.9, ease: 'power3.out' }, '-=0.5')
        .from('.hero-cta .btn', { y: 12, opacity: 0, stagger: 0.12, duration: 0.6, ease: 'power3.out' }, '-=0.4');
    }
    const hero = document.getElementById('hero');
    window.addEventListener('scroll', () => {
      if (!hero) return;
      const y = Math.min(120, window.scrollY * 0.06);
      const bg = hero.querySelector('.hero-bg');
      if (bg) bg.style.transform = `translateY(${y}px)`;
    }, { passive: true });

    /* ---------- SECTION ENTRY ANIMATION & TOC ---------- */
    const sections = Array.from(document.querySelectorAll('.section'));
    const tocLinks = Array.from(document.querySelectorAll('.toc a'));
    const root = document.documentElement;
    const accentSet = ['#d43f3a', '#b54b8a', '#3aa7ff', '#27b27b', '#f39c12', '#7cc576'];

    if (hasGSAP && hasScrollTrigger && !prefersReduced) {
      // per-section animation and toc highlight handled by individual ScrollTriggers in the cinematic timeline below.
      sections.forEach((sec, idx) => {
        gsap.fromTo(sec, { opacity: 0, y: 30, scale: 0.998 }, {
          opacity: 1, y: 0, scale: 1, duration: 0.9, ease: 'power3.out',
          scrollTrigger: {
            trigger: sec,
            start: 'top 72%',
            end: 'bottom 28%',
            toggleActions: 'play none none reverse',
            onEnter: () => {
              tocLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${sec.id}`));
              // change accent color per section for subtle mood shift
              const c = accentSet[idx % accentSet.length];
              gsap.to(root, { duration: 0.7, ease: 'power2.out', css: { '--accent': c } });
            },
            onEnterBack: () => {
              tocLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${sec.id}`));
            }
          }
        });
      });
    } else {
      // fallback - reveal all
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

    /* ---------- CINEMATIC PINNED SCENE (Part 2 -> Part 3) ---------- */
    if (hasGSAP && hasScrollTrigger && !prefersReduced) {
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
        .to('.scene-keywords span', { opacity: 1, scale: 1, stagger: 0.3, duration: 1.2, ease: 'back.out(1.7)' }, '-=0.5')
        .to('.scene-keywords span', { y: -30, opacity: 0, stagger: 0.2, duration: 1, ease: 'power2.in' })
        .to('.scene-title, .scene-sub', { opacity: 0, y: -40, duration: 1 }, '-=0.8');
    }

    /* ---------- COPY-ANCHOR (per-section) ---------- */
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

    /* ---------- AUDIO VISUALIZER (Canvas) + DOCK ---------- */
    const audios = Array.from(document.querySelectorAll('audio'));
    let audioContext = null;
    let analyser = null;
    let sourceNode = null;
    let dataArray = null;
    let rafId = null;
    let currentAudio = null;

    const dock = document.querySelector('.audio-dock');
    const dockTitle = document.getElementById('dock-title');
    const dockState = document.getElementById('dock-state');
    const dockPlay = document.getElementById('dock-play');
    const dockDownload = document.getElementById('dock-download');
    const canvas = document.getElementById('wave-canvas');
    const ctx = canvas ? canvas.getContext('2d') : null;
    let canvasWidth = 0, canvasHeight = 0;

    function initAudioContext() {
      if (!audioContext) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        audioContext = new AC();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.8;
        dataArray = new Uint8Array(analyser.fftSize);
      }
      return audioContext;
    }

    function connectAnalyserToElement(el) {
      if (!el) return;
      initAudioContext();
      try {
        if (sourceNode) {
          try { sourceNode.disconnect(); } catch (e) { /* ignore */ }
        }
        // createMediaElementSource can throw if element is cross-origin without CORS; our files are local
        sourceNode = audioContext.createMediaElementSource(el);
        sourceNode.connect(analyser);
        analyser.connect(audioContext.destination);
      } catch (err) {
        console.warn('Could not create MediaElementSource:', err);
      }
    }

    function resizeCanvas() {
      if (!canvas || !ctx) return;
      const ratio = window.devicePixelRatio || 1;
      canvasWidth = canvas.clientWidth;
      canvasHeight = canvas.clientHeight;
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

      // background subtle gradient
      const grad = ctx.createLinearGradient(0, 0, canvasWidth, 0);
      grad.addColorStop(0, 'rgba(212,63,58,0.12)');
      grad.addColorStop(0.5, 'rgba(181,75,138,0.06)');
      grad.addColorStop(1, 'rgba(58,167,255,0.06)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // waveform line
      ctx.lineWidth = 2;
      ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent') || '#d43f3a';
      ctx.beginPath();
      const sliceWidth = canvasWidth / dataArray.length;
      let x = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const v = dataArray[i] / 128.0; // 0..2
        const y = (v * canvasHeight) / 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
      }
      ctx.lineTo(canvasWidth, canvasHeight / 2);
      ctx.stroke();

      // subtle fill under curve
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = ctx.strokeStyle;
      ctx.fill();
      ctx.globalAlpha = 1;

      rafId = requestAnimationFrame(drawVisualizer);
    }

    function stopVisualizer() {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      if (ctx) {
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      }
    }

    function showDock(show = true) {
      if (!dock) return;
      dock.classList.toggle('visible', show);
      dock.setAttribute('aria-hidden', show ? 'false' : 'true');
    }

    audios.forEach(a => {
      // ensure audio has data-title fallback
      if (!a.dataset.title) {
        const src = a.querySelector('source')?.getAttribute('src') || '';
        a.dataset.title = decodeURIComponent(src.split('/').pop() || 'Audio');
      }

      a.addEventListener('play', async () => {
        // Pause others
        audios.forEach(x => { if (x !== a) x.pause(); });

        currentAudio = a;
        // highlight panel visually
        document.querySelectorAll('.panel').forEach(p => p.classList.remove('playing'));
        const panel = a.closest('.panel');
        if (panel) panel.classList.add('playing');

        // start audio context and connect analyzer
        initAudioContext();
        try {
          await audioContext.resume();
        } catch (e) { /* ignore */ }

        try { connectAnalyserToElement(a); } catch (e) { console.warn(e); }

        // update dock info
        if (dockTitle) dockTitle.innerText = a.dataset.title || 'Audio';
        if (dockState) dockState.innerText = 'playing';
        const src = a.querySelector('source')?.getAttribute('src') || '#';
        if (dockDownload) { dockDownload.href = src; dockDownload.setAttribute('download', src.split('/').pop()); }

        showDock(true);
        stopVisualizer(); // ensure only one loop
        drawVisualizer();
      });

      a.addEventListener('pause', () => {
        if (dockState) dockState.innerText = 'paused';
        if (currentAudio === a) {
          // remove playing highlight
          const panel = a.closest('.panel');
          if (panel) panel.classList.remove('playing');
        }
        stopVisualizer();
      });

      a.addEventListener('ended', () => {
        if (dockState) dockState.innerText = 'stopped';
        const panel = a.closest('.panel');
        if (panel) panel.classList.remove('playing');
        stopVisualizer();
      });
    });

    // dock controls
    dockPlay?.addEventListener('click', () => {
      if (!currentAudio) return;
      if (currentAudio.paused) currentAudio.play();
      else currentAudio.pause();
    });

    // if user clicks audio element directly, ensure dock updates (play/pause handled by events above)
    // Hide dock after inactivity
    let dockHideTimer;
    document.addEventListener('mousemove', () => {
      if (!dock) return;
      if (dock.classList.contains('visible')) {
        clearTimeout(dockHideTimer);
        dockHideTimer = setTimeout(() => dock.classList.remove('visible'), 6000);
      }
    });

    // canvas sizing init & redraw
    resizeCanvas();

    /* ---------- small accessibility: first tab focus rings ---------- */
    function handleFirstTab(e) { if (e.key === 'Tab') { document.body.classList.add('show-focus'); window.removeEventListener('keydown', handleFirstTab); } }
    window.addEventListener('keydown', handleFirstTab);

    /* ---------- Share Links (as requested) ---------- */
    function setupShareLinks() {
      const url = encodeURIComponent(window.location.href);
      const title = encodeURIComponent(document.title);
      const shareEmail = document.getElementById('share-email') || document.getElementById('share-email');
      const shareX = document.getElementById('share-x') || document.getElementById('share-x');
      const shareFacebook = document.getElementById('share-facebook') || document.getElementById('share-facebook');
      if (shareEmail) shareEmail.href = `mailto:?subject=${title}&body=Schau dir dieses Dossier zur Isonomie an: ${url}`;
      if (shareX) shareX.href = `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
      if (shareFacebook) shareFacebook.href = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
    }
    setupShareLinks();

    /* ---------- Respect reduced-motion: stop heavy animations/visualizer if requested ---------- */
    if (prefersReduced) {
      // disable ScrollTriggers
      if (hasScrollTrigger) {
        ScrollTrigger.getAll().forEach(st => st.disable());
      }
      // stop any ongoing visualizer
      stopVisualizer();
    }

    /* ---------- window unload cleanup ---------- */
    window.addEventListener('pagehide', () => {
      stopVisualizer();
      if (sourceNode) try { sourceNode.disconnect(); } catch (e) {}
      if (analyser) try { analyser.disconnect(); } catch (e) {}
      if (audioContext && audioContext.state !== 'closed') try { audioContext.close(); } catch (e) {}
    });

  }); // DOMContentLoaded
})();
