// VALIDIERTE VERSION: Phoenix Edition v4.9.0 (Synthesized & Hardened)
// UPGRADE: Scroll-Spy-Navigation implementiert, Lade-Event optimiert, Low-Perf-Mode-Bug (CSS) behoben.

// === Helper Class: TranscriptSynchronizer ===
class TranscriptSynchronizer {
    constructor(box) {
        this.box = box;
        this.audio = box.querySelector('audio');
        this.transcriptContainer = box.querySelector('.transcript-container');
        if (!this.audio || !this.transcriptContainer) return;
        
        this.toggleBtn = box.querySelector('.transcript-toggle-btn');
        this.cues = Array.from(this.transcriptContainer.querySelectorAll('p[data-start]'));

        if (this.toggleBtn) {
            this.toggleBtn.addEventListener('click', () => this.toggle());
        }
        this.audio.addEventListener('timeupdate', () => this.sync());
        
        this.cues.forEach(cue => {
            cue.addEventListener('click', () => {
                this.audio.currentTime = parseFloat(cue.dataset.start);
                if (this.audio.paused) {
                    this.audio.play();
                }
            });
        });
        
        if (this.toggleBtn) {
            this.toggleBtn.textContent = 'Transkript anzeigen';
        }
    }

    toggle() {
        if (!this.transcriptContainer || !this.toggleBtn) return;
        const isHidden = this.transcriptContainer.hidden;
        this.transcriptContainer.hidden = !isHidden;
        this.toggleBtn.setAttribute('aria-expanded', String(isHidden));
        this.toggleBtn.textContent = isHidden ? 'Transkript ausblenden' : 'Transkript anzeigen';
    }

    sync() {
        if (!this.transcriptContainer || this.transcriptContainer.hidden || !this.audio || this.audio.paused) return;
        const time = this.audio.currentTime;
        let activeCue = null;
        
        this.cues.forEach(cue => {
            const start = parseFloat(cue.dataset.start);
            const end = parseFloat(cue.dataset.end || Infinity);
            const isActive = time >= start && time < end;
            cue.classList.toggle('active-cue', isActive);
            if (isActive) {
                activeCue = cue;
            }
        });

        if (activeCue) {
            const container = this.transcriptContainer;
            const containerScrollTop = container.scrollTop;
            const containerHeight = container.clientHeight;
            const cueOffsetTop = activeCue.offsetTop;
            const cueHeight = activeCue.offsetHeight;

            if (cueOffsetTop < containerScrollTop || cueOffsetTop + cueHeight > containerScrollTop + containerHeight) {
                container.scrollTop = cueOffsetTop - (container.clientHeight / 2) + (cueHeight / 2);
            }
        }
    }
}

// === Hauptklasse: PhoenixDossier ===
class PhoenixDossier {
    constructor() {
        this.DOM = {
            body: document.body,
            focusPane: document.querySelector('.focus-pane'),
            perfToggle: document.getElementById('perf-toggle'),
            mainTitle: document.getElementById('title-split'),
            subTitle: document.getElementById('subtitle-split'),
            narrativePath: document.querySelector('.narrative-thread-path'),
            navItems: document.querySelectorAll('.bento-nav .nav-item'),
            sections: document.querySelectorAll('.chapter-section')
        };

        this.state = {
            isLowPerfMode: false,
        };

        this.init();
    }

    init() {
        this.setupPerfToggle();
        this.setupAudioPlayers();
        
        try {
            if (!this.state.isLowPerfMode && window.gsap) {
                this.setupGSAPAnimations();
            } else {
                if(this.DOM.mainTitle) this.DOM.mainTitle.style.opacity = 1;
                if(this.DOM.subTitle) this.DOM.subTitle.style.opacity = 1;
                console.log('Low Performance Mode aktiv oder GSAP nicht gefunden: Animationen übersprungen.');
            }
        } catch (error) {
            console.error("Fehler bei der GSAP-Initialisierung:", error);
            if(this.DOM.mainTitle) this.DOM.mainTitle.style.opacity = 1;
            if(this.DOM.subTitle) this.DOM.subTitle.style.opacity = 1;
        }
        
        this.setupShareButtons();
        this.generateTakeaways();
        this.setupScrollSpy(); // NEU: Initialisierung des Scroll-Spys
        console.log('Synthetisiertes Dossier vollständig initialisiert.');
    }
    
    setupAudioPlayers() {
        document.querySelectorAll('.audio-feature-box').forEach(box => {
            new TranscriptSynchronizer(box);
            this.setupAudioControls(box);
            if (!this.state.isLowPerfMode && window.innerWidth > 1024) {
                this.setupAudioVisualizer(box);
            }
        });
    }

    setupAudioControls(box) {
        const audio = box.querySelector('audio');
        const playPauseBtn = box.querySelector('.play-pause-btn');
        const progressContainer = box.querySelector('.audio-progress-container');
        const totalTimeEl = box.querySelector('.total-time');
        const speedBtn = box.querySelector('.speed-btn');

        if (!audio || !playPauseBtn || !progressContainer || !totalTimeEl) {
            console.warn('Ein Audio-Player konnte nicht initialisiert werden: Essentielle Elemente fehlen.', box);
            return;
        }

        const iconPlay = playPauseBtn.querySelector('.icon-play');
        const iconPause = playPauseBtn.querySelector('.icon-pause');
        const progressBar = box.querySelector('.audio-progress-bar');
        const currentTimeEl = box.querySelector('.current-time');
        const skipBtns = box.querySelectorAll('.skip-btn');
        
        const updatePlayPauseIcon = () => {
            const isPaused = audio.paused;
            if(iconPlay) iconPlay.style.display = isPaused ? 'block' : 'none';
            if(iconPause) iconPause.style.display = isPaused ? 'none' : 'block';
            playPauseBtn.setAttribute('aria-label', isPaused ? 'Abspielen' : 'Pausieren');
        };
        
        audio.addEventListener('loadedmetadata', () => {
            totalTimeEl.textContent = this.formatTime(audio.duration);
        });
        
        audio.addEventListener('error', () => {
            console.error(`Audio-Datei konnte nicht geladen werden: ${audio.src}`);
            const audioBox = audio.closest('.audio-feature-box');
            if (audioBox) audioBox.innerHTML += '<p style="color:red;">Fehler: Die Audiodatei konnte nicht geladen werden.</p>';
        });

        playPauseBtn.addEventListener('click', () => {
            audio.paused ? audio.play() : audio.pause();
        });
        
        audio.addEventListener('play', updatePlayPauseIcon);
        audio.addEventListener('pause', updatePlayPauseIcon);
        audio.addEventListener('ended', () => {
            audio.currentTime = 0;
            updatePlayPauseIcon();
        });

        audio.addEventListener('timeupdate', () => {
            if (progressBar) {
                const progress = (audio.currentTime / audio.duration) * 100;
                progressBar.style.width = `${progress}%`;
            }
            if (currentTimeEl) {
                currentTimeEl.textContent = this.formatTime(audio.currentTime);
            }
        });

        progressContainer.addEventListener('click', (e) => {
            const rect = progressContainer.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const newTime = (clickX / rect.width) * audio.duration;
            audio.currentTime = newTime;
        });

        skipBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const skipAmount = parseFloat(btn.dataset.skip);
                audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + skipAmount));
            });
        });

        if (speedBtn) {
            const speeds = [1, 1.25, 1.5, 1.75, 2, 0.75];
            let currentSpeedIndex = 0;
            speedBtn.addEventListener('click', () => {
                currentSpeedIndex = (currentSpeedIndex + 1) % speeds.length;
                const newSpeed = speeds[currentSpeedIndex];
                audio.playbackRate = newSpeed;
                speedBtn.textContent = `${newSpeed}x`;
            });
        }
        updatePlayPauseIcon();
    }
    
    setupAudioVisualizer(box) {
         if (!window.AudioContext && !window.webkitAudioContext) {
            console.warn("AudioContext nicht verfügbar. Visualizer deaktiviert.");
            const visualizer = box.querySelector('.audio-visualizer');
            if (visualizer) visualizer.style.display = 'none';
            return;
        }

        const canvas = box.querySelector('.audio-visualizer');
        const audio = box.querySelector('audio');
        if (!canvas || !audio) return;

        const ctx = canvas.getContext('2d');
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        
        if (!audio.dataset.audioSourceConnected) {
            try {
                const source = audioContext.createMediaElementSource(audio);
                source.connect(analyser);
                analyser.connect(audioContext.destination);
                audio.dataset.audioSourceConnected = 'true';
            } catch (e) {
                console.error("Fehler beim Verbinden der Audio-Quelle für den Visualizer:", e);
                return;
            }
        }

        analyser.fftSize = 128;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        const draw = () => {
            if (audio.paused || audio.ended) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                return;
            }
            requestAnimationFrame(draw);
            analyser.getByteFrequencyData(dataArray);
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const barWidth = (canvas.width / bufferLength);
            let barX = 0;

            for (let i = 0; i < bufferLength; i++) {
                const barHeight = dataArray[i] / 2.5;
                ctx.fillStyle = `rgba(6, 182, 212, ${barHeight / 100})`;
                ctx.fillRect(barX, canvas.height - barHeight, barWidth, barHeight);
                barX += barWidth + 1;
            }
        };

        const startVisualizer = () => {
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }
            draw();
        };
        
        audio.addEventListener('play', startVisualizer);
        audio.addEventListener('timeupdate', () => {
            if (!audio.paused) draw();
        });
    }
    
    formatTime(seconds) {
        if (isNaN(seconds) || seconds < 0) return '00:00';
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    }

    setupPerfToggle() {
        if (!this.DOM.perfToggle) return;
        
        const isLowPerf = localStorage.getItem('lowPerfMode') === 'true';
        this.state.isLowPerfMode = isLowPerf;
        this.DOM.perfToggle.setAttribute('aria-pressed', String(isLowPerf));
        this.DOM.perfToggle.textContent = isLowPerf ? '💤 Animationen aus' : '✨ Animationen an';
        if (this.DOM.body) this.DOM.body.classList.toggle('low-perf-mode', isLowPerf);

        this.DOM.perfToggle.addEventListener('click', () => {
            this.state.isLowPerfMode = !this.state.isLowPerfMode;
            localStorage.setItem('lowPerfMode', String(this.state.isLowPerfMode));
            window.location.reload(); 
        });
    }

    manualSplitText(element) {
        if (!element) return [];
        const originalText = element.textContent;
        element.innerHTML = '';
        const chars = [];
        
        originalText.split('').forEach(char => {
            const charSpan = document.createElement('span');
            charSpan.className = 'char-anim';
            charSpan.style.display = 'inline-block';
            charSpan.textContent = (char === ' ') ? '\u00A0' : char;
            element.appendChild(charSpan);
            chars.push(charSpan);
        });
        return chars;
    }

    setupGSAPAnimations() {
        if (!this.DOM.mainTitle || !this.DOM.subTitle) return;

        gsap.registerPlugin(ScrollTrigger);

        const mainChars = this.manualSplitText(this.DOM.mainTitle);
        const subChars = this.manualSplitText(this.DOM.subTitle);

        gsap.set([this.DOM.mainTitle, this.DOM.subTitle], { opacity: 1 });
        gsap.set(mainChars, { opacity: 0, y: '100%', rotationX: -90, transformOrigin: 'center center -50px' });
        gsap.set(subChars, { opacity: 0, y: '100%' });

        gsap.to(mainChars, {
            opacity: 1, y: '0%', rotationX: 0, duration: 0.8,
            ease: 'power3.out', stagger: 0.03, delay: 0.5
        });

        gsap.to(subChars, {
            opacity: 1, y: '0%', duration: 0.5,
            ease: 'power1.out', stagger: 0.01, delay: 1.0
        });
        
        document.querySelectorAll('.chapter-section').forEach(section => {
            const title = section.querySelector('.chapter-title');
            if (title) {
                 gsap.from(title, {
                    y: 100, opacity: 0, ease: "power2.out",
                    scrollTrigger: {
                        trigger: section, start: "top 80%", end: "top 20%",
                        scrub: true, toggleActions: "play none none reverse",
                    }
                });
            }
        });

        if (this.DOM.narrativePath && this.DOM.focusPane) {
            const pathLength = this.DOM.narrativePath.getTotalLength();
            if (pathLength > 0) {
                this.DOM.narrativePath.style.strokeDasharray = pathLength;
                this.DOM.narrativePath.style.strokeDashoffset = pathLength;
                gsap.to(this.DOM.narrativePath, {
                    strokeDashoffset: 0, ease: "none",
                    scrollTrigger: {
                        trigger: this.DOM.focusPane, start: "top top", end: "bottom bottom",
                        scrub: 1, invalidateOnRefresh: true
                    }
                });
            }
        }
        
        const finalSection = document.querySelector('.final-actions');
        if (finalSection) {
            const finalCta = finalSection.querySelector('#final-cta');
            const actionCards = document.querySelectorAll('.final-actions-grid > .action-card');
            if(finalCta) gsap.from(finalCta, { scrollTrigger: { trigger: finalSection, start: 'top 80%', toggleActions: 'play none none none' }, opacity: 0, y: 50, duration: 0.8, ease: 'power2.out' });
            if(actionCards.length > 0) gsap.from(actionCards, { scrollTrigger: { trigger: finalSection, start: 'top 70%', toggleActions: 'play none none none' }, opacity: 0, y: 30, duration: 1, stagger: 0.2, ease: 'power2.out' });
        }
    }
    
    // NEU: Scroll-Spy-Logik zur Hervorhebung des aktiven Navigationspunkts
    setupScrollSpy() {
        if (!this.DOM.sections.length || !this.DOM.navItems.length) return;

        const observerOptions = {
            root: null, // beobachtet im Viewport des Browsers
            rootMargin: '0px',
            threshold: 0.3 // Auslösen, wenn 30% der Sektion sichtbar sind
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.getAttribute('id');
                    const activeNavItem = document.querySelector(`.nav-item[href="#${id}"]`);

                    if (activeNavItem) {
                        this.DOM.navItems.forEach(item => item.classList.remove('active'));
                        activeNavItem.classList.add('active');
                    }
                }
            });
        }, observerOptions);

        this.DOM.sections.forEach(section => {
            observer.observe(section);
        });
    }

    setupShareButtons() {
        const url = encodeURIComponent(window.location.href);
        const title = encodeURIComponent(document.title);
        
        const emailBtn = document.getElementById('share-email');
        if (emailBtn) emailBtn.href = `mailto:?subject=${title}&body=Schau dir dieses Dossier an: ${url}`;
        
        const xBtn = document.getElementById('share-x');
        if (xBtn) xBtn.href = `https://twitter.com/intent/tweet?url=${url}&text=${title}`;

        const facebookBtn = document.getElementById('share-facebook');
        if (facebookBtn) facebookBtn.href = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
    }
    
    generateTakeaways() {
        const container = document.querySelector('#knowledge-distillate ul');
        if (!container) return;
        
        const sections = document.querySelectorAll('section[data-takeaway]');
        sections.forEach((section, index) => {
            const takeawayText = section.dataset.takeaway;
            const li = document.createElement('li');
            li.innerHTML = `<strong>Teil ${index + 1}:</strong> ${takeawayText}`;
            container.appendChild(li);
        });
    }
}

// === INITIALISIERUNG (VERBESSERT) ===
// OPTIMIERUNG: Wechsel von 'load' zu 'DOMContentLoaded' für eine schnellere Initialisierung.
window.addEventListener('DOMContentLoaded', () => {
    const preloader = document.getElementById('preloader');
    if (preloader) {
        preloader.classList.add('hidden');
        preloader.addEventListener('transitionend', () => {
            preloader.style.display = 'none';
        }, { once: true });
    }

    try {
        window.dossier = new PhoenixDossier();
    } catch (e) {
        console.error("Fehler bei der Initialisierung der PhoenixDossier-Anwendung:", e);
    }
});
