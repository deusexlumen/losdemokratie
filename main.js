// main.js v12 — Sprint 1 Implementation
(function () {
  'use strict';

  // --- Globale Helfer & Konfigurationen ---
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const accentColors = ['#22d3ee', '#a78bfa', '#f87171', '#4ade80', '#facc15', '#34d399'];
  const transcriptData = new Map(); // Speichert Zeitstempel für alle Audios

  // --- MODULE: AudioPlayer (erweitert für Transkripte) ---
  const AudioPlayer = {
    // ... (alte Eigenschaften bleiben gleich) ...
    transcriptUpdaterId: null,

    // ... (init, setupContext etc. bleiben gleich) ...
    
    handlePlay(audio) {
      // ... (alter Code bleibt gleich) ...
      this.startTranscriptUpdater(audio); // NEU
    },
    handlePause(audio) {
      // ... (alter Code bleibt gleich) ...
      this.stopTranscriptUpdater(); // NEU
    },
    handleEnded(audio) {
      // ... (alter Code bleibt gleich) ...
      this.stopTranscriptUpdater(); // NEU
    },

    startTranscriptUpdater(audio) {
      this.stopTranscriptUpdater();
      const key = audio.querySelector('source').src;
      const timestamps = transcriptData.get(key);
      if (!timestamps || timestamps.length === 0) return;

      const update = () => {
        const currentTime = audio.currentTime;
        let activeP = null;
        for (const ts of timestamps) {
          if (currentTime >= ts.start) {
            activeP = ts.element;
          } else {
            break;
          }
        }
        
        timestamps.forEach(ts => ts.element.classList.toggle('is-speaking', ts.element === activeP));
        
        if (activeP && !this.isElementInView(activeP)) {
            activeP.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        this.transcriptUpdaterId = requestAnimationFrame(update);
      };
      this.transcriptUpdaterId = requestAnimationFrame(update);
    },

    stopTranscriptUpdater() {
      cancelAnimationFrame(this.transcriptUpdaterId);
    },
    
    isElementInView(el) {
        const rect = el.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight)
        );
    }
    // ... (Rest des AudioPlayer-Moduls bleibt gleich) ...
  };

  // --- Initialisierungs-Workflow ---
  document.addEventListener('DOMContentLoaded', () => {
    // ... (Start-Overlay, Reading-Progress etc. bleiben gleich) ...
    setupGlossar(); // NEU
    setupTranscripts(); // NEU
    // ...
  });
  
  // --- NEUE SETUP-FUNKTIONEN ---
  function setupGlossar() {
    const popover = document.getElementById('glossar-popover');
    if (!popover) return;
    
    document.body.addEventListener('mouseover', (e) => {
      const target = e.target.closest('.glossar-begriff');
      if (!target) return;
      
      popover.textContent = target.dataset.definition;
      const rect = target.getBoundingClientRect();
      popover.style.left = `${rect.left}px`;
      popover.style.top = `${rect.bottom + 8}px`;
      popover.classList.add('visible');
    });
    
    document.body.addEventListener('mouseout', (e) => {
      if (e.target.matches('.glossar-begriff')) {
        popover.classList.remove('visible');
      }
    });
  }

  function setupTranscripts() {
    document.querySelectorAll('.panel').forEach(panel => {
      const audio = panel.querySelector('audio');
      const transcriptContainer = panel.querySelector('.transcript');
      const toggleBtn = panel.querySelector('.transcript-toggle');
      if (!audio || !transcriptContainer || !toggleBtn) return;
      
      // Zeitstempel-Daten sammeln
      const key = audio.querySelector('source').src;
      const timestamps = [];
      transcriptContainer.querySelectorAll('p[data-start]').forEach(p => {
        const start = parseFloat(p.dataset.start);
        timestamps.push({ start, element: p });
        
        // Klick-Funktion zum Springen
        p.addEventListener('click', () => {
          audio.currentTime = start;
          if (audio.paused) audio.play();
        });
      });
      transcriptData.set(key, timestamps);

      // Toggle-Button
      toggleBtn.addEventListener('click', () => {
        const isHidden = transcriptContainer.hidden;
        transcriptContainer.hidden = !isHidden;
        toggleBtn.textContent = isHidden ? 'Transkript ausblenden' : 'Transkript anzeigen';
      });
    });
  }

  // --- Angepasste Animations-Funktionen ---
  function initAnimations() {
    // IntersectionObserver
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const section = entry.target;
          section.classList.add('is-visible');
          
          // ... (TOC-Update & Akzentfarben-Logik bleibt gleich) ...
          
          // NEU: SVG-Animationen triggern
          if (section.id === 'part1') {
            gsap.fromTo('#krise-riss', { y: -20 }, { y: 0, duration: 1, ease: 'bounce.out', delay: 0.5 });
          }
          if (section.id === 'part2') {
            gsap.timeline({ delay: 0.5 })
              .fromTo('#isonomie-balken', { rotation: -5, transformOrigin: '50% 50%' }, { rotation: 0, duration: 1.5, ease: 'elastic.out(1, 0.5)' })
              .fromTo(['#isonomie-schale1', '#isonomie-schale2'], { y: -10 }, { y: 0, duration: 1, ease: 'bounce.out' }, '<');
          }
        }
      });
    }, { rootMargin: "0px 0px -25% 0px" });

    document.querySelectorAll('.section').forEach(section => observer.observe(section));

    // ... (Hero- & Cinematic-Animationen bleiben gleich) ...
  }
  
  // HIER DEN GESAMTEN, VOLLSTÄNDIGEN JS-CODE AUS DER VORHERIGEN ANTWORT EINFÜGEN
  // UND DIE OBEN GEZEIGTEN ÄNDERUNGEN INTEGRIEREN.
})();
