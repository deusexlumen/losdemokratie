// main.js v10 — Refactored, Modular, and Observer-driven
(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const accentColors = ['#d43f3a', '#b54b8a', '#3aa7ff', '#27b27b', '#f39c12', '#7cc576'];

  // --- MODUL: AudioPlayer ---
  // Kapselt alle Audio-bezogenen Funktionen und Zustände
  const AudioPlayer = {
    audioContext: null,
    analyser: null,
    sourceNodeCache: new WeakMap(),
    currentAudio: null,
    isReady: false,
    dockHideTimer: null,

    init() {
      this.dock.el = document.querySelector('.audio-dock');
      this.dock.title = document.getElementById('dock-title');
      this.dock.state = document.getElementById('dock-state');
      this.dock.playBtn = document.getElementById('dock-play');
      this.dock.download = document.getElementById('dock-download');
      this.dock.canvas = document.getElementById('wave-canvas');
      if (this.dock.canvas) this.dock.ctx = this.dock.canvas.getContext('2d');

      this.bindDockEvents();
      this.bindAudioEvents();
      window.addEventListener('resize', () => this.resizeCanvas());
      this.resizeCanvas();
    },

    async setupContext() {
      if (this.isReady) return;
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext && !this.audioContext) {
        this.audioContext = new AudioContext();
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 2048;
        this.analyser.smoothingTimeConstant = 0.85;
      }
      if (this.audioContext && this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      this.isReady = true;
      console.log('Audio Context is ready.');
    },
    
    bindDockEvents() {
      this.dock.playBtn?.addEventListener('click', () => {
        if (this.currentAudio) {
          this.currentAudio.paused ? this.currentAudio.play() : this.currentAudio.pause();
        }
      });
      // Auto-hide Dock
      document.addEventListener('mousemove', () => this.resetHideTimer());
    },

    bindAudioEvents() {
      document.querySelectorAll('audio').forEach(audio => {
        audio.addEventListener('play', () => this.handlePlay(audio));
        audio.addEventListener('pause', () => this.handlePause(audio));
        audio.addEventListener('ended', () => this.handleEnded(audio));
      });
    },

    handlePlay(audio) {
      if (!this.isReady) {
        audio.pause();
        alert('Bitte klicken Sie zuerst auf "Erlebnis starten", um Audio zu aktivieren.');
        return;
      }
      if (this.currentAudio && this.currentAudio !== audio) this.currentAudio.pause();
      this.currentAudio = audio;

      if (this.analyser) {
        if (!this.sourceNodeCache.has(audio)) {
          const sourceNode = this.audioContext.createMediaElementSource(audio);
          this.sourceNodeCache.set(audio, sourceNode);
          sourceNode.connect(this.analyser);
          this.analyser.connect(this.audioContext.destination);
        }
        this.startVisualizer();
      }
      
      audio.closest('.panel')?.classList.add('playing');
      this.dock.update(audio);
      this.dock.setState('playing');
      this.dock.show(true);
      this.resetHideTimer();
    },

    handlePause(audio) {
      audio.closest('.panel')?.classList.remove('playing');
      if (audio === this.currentAudio) {
        this.dock.setState('paused');
        this.stopVisualizer();
      }
    },
    
    handleEnded(audio) {
      this.handlePause(audio); // Gleiches Verhalten wie bei Pause
      if (audio === this.currentAudio) this.dock.setState('ended');
    },

    dock: {
      show(visible) { this.el?.classList.toggle('visible', visible); },
      update(audio) {
        this.title.textContent = audio.dataset.title || 'Audio Track';
        const source = audio.querySelector('source')?.getAttribute('src') || '#';
        this.download.href = source;
        this.download.download = source.split('/').pop();
      },
      setState(newState) {
        this.state.textContent = newState;
        this.playBtn.textContent = newState === 'playing' ? '⏸' : '▶';
      }
    },
    
    resetHideTimer() {
        clearTimeout(this.dockHideTimer);
        if (this.dock.el?.classList.contains('visible') && this.currentAudio && !this.currentAudio.paused) {
            this.dockHideTimer = setTimeout(() => this.dock.show(false), 4000);
        }
    },

    resizeCanvas() {
        if (!this.dock.canvas) return;
        const ratio = window.devicePixelRatio || 1;
        this.dock.canvas.width = this.dock.canvas.clientWidth * ratio;
        this.dock.canvas.height = this.dock.canvas.clientHeight * ratio;
        this.dock.ctx?.scale(ratio, ratio);
    },

    startVisualizer() { this.stopVisualizer(); this.drawVisualizer(); },
    stopVisualizer() { cancelAnimationFrame(this.dock.rafId); },
    drawVisualizer() {
      if (!this.analyser || !this.dock.ctx) return;
      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      this.analyser.getByteTimeDomainData(dataArray);

      const { width, height } = this.dock.canvas;
      this.dock.ctx.clearRect(0, 0, width, height);

      const gradient = this.dock.ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, getComputedStyle(document.documentElement).getPropertyValue('--accent').trim());
      gradient.addColorStop(1, '#3aa7ff');
      this.dock.ctx.strokeStyle = gradient;
      this.dock.ctx.lineWidth = 2;

      this.dock.ctx.beginPath();
      const sliceWidth = width / bufferLength;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0; // normalize to -1..1
        const y = v * height / 2;
        i === 0 ? this.dock.ctx.moveTo(x, y) : this.dock.ctx.lineTo(x, y);
        x += sliceWidth;
      }
      this.dock.ctx.lineTo(width, height / 2);
      this.dock.ctx.stroke();
      this.dock.rafId = requestAnimationFrame(() => this.drawVisualizer());
    }
  };

  // --- Allgemeine Initialisierung ---
  document.addEventListener('DOMContentLoaded', () => {
    setupStartOverlay();
    setupReadingProgress();
    setupTOCInteraction();
    setupCopyAnchors();
    setupAccessibility();

    if (!prefersReducedMotion && window.gsap) {
        initAnimations();
    } else {
        document.querySelectorAll('.section').forEach(el => el.classList.add('is-visible'));
    }
  });

  function setupStartOverlay() {
    const overlay = document.getElementById('start-overlay');
    const startBtn = document.getElementById('start-button');
    startBtn?.addEventListener('click', () => {
      AudioPlayer.setupContext();
      AudioPlayer.init();
      gsap.to(overlay, { opacity: 0, duration: 0.5, onComplete: () => overlay.remove() });
      animateHero();
    }, { once: true });
  }

  function setupTOCInteraction() {
    const tocLinks = document.querySelectorAll('.toc a');
    const cardContainer = document.getElementById('chapter-card-container');
    if (!tocLinks.length || !cardContainer) return;
    
    // Erstelle die Karte einmal
    const card = document.createElement('div');
    card.className = 'chapter-card';
    cardContainer.appendChild(card);
    
    tocLinks.forEach(link => {
      link.addEventListener('mouseenter', () => {
        card.innerHTML = `<strong>${link.textContent}</strong><p>${link.dataset.preview}</p>`;
        card.style.top = `${link.offsetTop}px`;
        card.classList.add('visible');
      });
      link.addEventListener('mouseleave', () => card.classList.remove('visible'));
      link.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelector(link.getAttribute('href'))?.scrollIntoView({ behavior: 'smooth' });
      });
    });
  }
  
  // ... (andere Helferfunktionen wie setupReadingProgress etc. hier einfügen) ...
    function setupReadingProgress() {
    const progress = document.getElementById('read-progress');
    if (!progress) return;
    const updateProgress = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = `${(window.scrollY / Math.max(1, scrollHeight)) * 100}%`;
    };
    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();
  }
  
  function setupCopyAnchors() {
    document.querySelectorAll('.copy-anchor').forEach(btn => {
      btn.addEventListener('click', (ev) => {
        const url = `${location.href.split('#')[0]}#${ev.target.closest('.panel').id}`;
        navigator.clipboard.writeText(url).then(() => {
          btn.textContent = '✅';
          setTimeout(() => { btn.textContent = '🔗'; }, 1200);
        });
      });
    });
  }
  
  function setupAccessibility() {
    const handleFirstTab = (e) => {
      if (e.key === 'Tab') {
        document.body.classList.add('show-focus');
        window.removeEventListener('keydown', handleFirstTab);
      }
    };
    window.addEventListener('keydown', handleFirstTab);
  }

  // --- Animationen ---
  function animateHero() {
    gsap.timeline()
      .from('.title', { y: 20, opacity: 0, duration: 0.8, ease: 'power3.out' })
      .from('.lead', { y: 20, opacity: 0, duration: 0.8, ease: 'power3.out' }, '-=0.6');
    gsap.to('.hero-bg', { y: 100, scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true } });
  }
  
  function initAnimations() {
    // Section-Animationen mit IntersectionObserver
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const section = entry.target;
          section.classList.add('is-visible');
          
          // Akzentfarbe & TOC-Update
          const sectionId = section.id;
          const activeLink = document.querySelector(`.toc a[href="#${sectionId}"]`);
          document.querySelectorAll('.toc a').forEach(a => a.classList.remove('active'));
          activeLink?.classList.add('active');

          const sectionIndex = Array.from(section.parentElement.children).indexOf(section);
          gsap.to(':root', { '--accent': accentColors[sectionIndex % accentColors.length], duration: 0.5, ease: 'power2.out' });
        }
      });
    }, { rootMargin: "0px 0px -25% 0px" }); // Trigger bei 75% Sichtbarkeit von unten

    document.querySelectorAll('.section').forEach(section => observer.observe(section));

    // Cinematic Scene mit GSAP ScrollTrigger
    gsap.timeline({ scrollTrigger: { trigger: '#cinematic', start: 'top top', end: '+=250%', scrub: true, pin: true } })
      .to('.scene-title, .scene-sub', { opacity: 1, y: 0, duration: 1 })
      .to('#cinematic', { '--scene-accent': 'rgba(212, 63, 58, 0.2)', duration: 2 }, '<')
      .to('.scene-keywords span', { opacity: 1, scale: 1, stagger: 0.2, duration: 1.2, ease: 'back.out(1.7)' }, '-=0.5')
      .to('.scene-keywords span', { y: -20, opacity: 0, stagger: 0.15, duration: 1, ease: 'power2.in' }, '+=1')
      .to('.scene-title, .scene-sub', { opacity: 0, y: -20, duration: 1 }, '<');
  }

})();
