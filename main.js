// FILE: main.js
// VALIDIERTE VERSION: Phoenix Edition v4.8.4 (Originalinhalt + Preloader)

// === Helper Class: TranscriptSynchronizer ===
class TranscriptSynchronizer {
    constructor(box) {
        this.box = box;
        this.audio = box.querySelector('audio');
        this.transcriptContainer = box.querySelector('.transcript-container');
        if (!this.audio || !this.transcriptContainer) return;
        
        this.toggleBtn = box.querySelector('.transcript-toggle-btn');
        this.cues = Array.from(this.transcriptContainer.querySelectorAll('p[data-start]'));

        this.toggleBtn.addEventListener('click', () => this.toggle());
        this.audio.addEventListener('timeupdate', () => this.sync());
        
        this.cues.forEach(cue => {
            cue.addEventListener('click', () => {
                this.audio.currentTime = parseFloat(cue.dataset.start);
                this.audio.play();
            });
        });
    }

    toggle() {
        const isHidden = this.transcriptContainer.hidden;
        this.transcriptContainer.hidden = !isHidden;
        this.toggleBtn.setAttribute('aria-expanded', String(isHidden));
    }

    sync() {
        if (this.transcriptContainer.hidden) return;
        const time = this.audio.currentTime;
        let activeCue = null;
        
        this.cues.forEach(cue => {
            const start = parseFloat(cue.dataset.start);
            const end = parseFloat(cue.dataset.end);
            if (time >= start && time <= end) {
                cue.classList.add('is-speaking');
                activeCue = cue;
            } else {
                cue.classList.remove('is-speaking');
            }
        });

        if (activeCue) {
            const containerRect = this.transcriptContainer.getBoundingClientRect();
            const cueRect = activeCue.getBoundingClientRect();
            // Nur scrollen, wenn das Cue außerhalb des sichtbaren Bereichs ist
            if (cueRect.top < containerRect.top || cueRect.bottom > containerRect.bottom) {
                 this.transcriptContainer.scrollTop = activeCue.offsetTop - (this.transcriptContainer.offsetHeight / 2) + (activeCue.offsetHeight / 2);
            }
        }
    }
}


// === Hauptklasse: PhoenixDossier ===
class PhoenixDossier {
    constructor() {
        gsap.registerPlugin(ScrollTrigger);

        this.DOM = {
            preloader: document.getElementById('preloader'), // NEU: Preloader
            body: document.body,
            root: document.documentElement,
            progressBar: document.querySelector('.scroll-progress-bar'),
            liveRegion: document.querySelector('[aria-live="polite"]'),
            sections: Array.from(document.querySelectorAll('.content-section')),
            navLinks: Array.from(document.querySelectorAll('.bento-nav .bento-cell')),
            perfToggleBtn: document.getElementById('perf-toggle'),
            aurora: document.querySelector('.aurora-background'),
            headerContent: document.querySelector('.header-content'),
            subtitle: document.querySelector('.page-header .subtitle'),
            audioBoxes: document.querySelectorAll('.audio-feature-box'),
            mainContent: document.getElementById('main-content'),
            distillateContainer: document.querySelector('#knowledge-distillate'),
            distillateList: document.querySelector('#knowledge-distillate ul'),
            h2s: document.querySelectorAll('.content-section h2'),
            auroraBlobs: document.querySelectorAll('.aurora-background .blob'),
            focusPane: document.querySelector('.focus-pane'),
            narrativeThreadContainer: document.querySelector('.narrative-thread-container'),
            narrativePath: document.querySelector('.narrative-thread-path'),
        };

        this.narrativeColors = {
            part1: { primary: '#fb923c', secondary: '#f97316' }, // Orange
            part2: { primary: '#f87171', secondary: '#ef4444' }, // Red
            part3: { primary: '#60a5fa', secondary: '#3b82f6' }, // Blue
            part4: { primary: '#4ade80', secondary: '#22c55e' }, // Green
            part5: { primary: '#a78bfa', secondary: '#8b5cf6' }, // Violet
            part6: { primary: '#22d3ee', secondary: '#06b6d4' }, // Cyan (Default)
        };

        this.state = {
            activeSectionId: null,
            completedSections: new Set(),
            isLowPerfMode: false,
            isTicking: false,
            currentColor: getComputedStyle(this.DOM.root).getPropertyValue('--primary-color').trim(),
        };

        this.audioContext = null;
        this.analysers = new Map();
        this.sources = new Map();
        this.transcriptSynchronizers = [];

        this.resizeTimeout = null;
        this.debouncedRefresh = this.debounce(this.onResize.bind(this), 250);

        if (this.DOM.distillateList) {
            this.init();
        } else {
            console.error("Initialisierung fehlgeschlagen: Wissens-Destillat-Liste nicht gefunden.");
        }
    }

    init() {
        // NEU: Stelle sicher, dass der Preloader sichtbar ist
        if (this.DOM.preloader) {
            this.DOM.preloader.classList.remove('hidden');
        }

        try {
            this.splitMainHeader();
            this.splitSectionHeaders();
            
            if (this.DOM.narrativePath) {
                setTimeout(() => this.generateNarrativePath(), 100);
            }

            this.setupEventListeners();
            this.setupIntersectionObserver();
            this.setupCustomAudioPlayers();
            this.checkInitialPerfMode(); // This will now always enable animations
            this.setupBentoInteractions();
            this.setupTranscripts();
            this.setupShareLinks();
        
        } catch (error) {
            console.error("Fehler bei der Initialisierung:", error);
        
        } finally {
            // NEU: Preloader sicher ausblenden
            if (this.DOM.preloader) {
                this.DOM.preloader.classList.add('hidden');
                this.DOM.preloader.addEventListener('transitionend', () => {
                    this.DOM.preloader.style.display = 'none';
                }, { once: true });
            }
        }
    }
    
    setupTranscripts() {
        this.DOM.audioBoxes.forEach(box => {
            this.transcriptSynchronizers.push(new TranscriptSynchronizer(box));
        });
    }

    setupEventListeners() {
// ... existing code ...
        window.addEventListener('resize', this.debouncedRefresh);
        document.addEventListener('scroll', () => {
            if (!this.state.isTicking) {
// ... existing code ...
            }
        });

        if (this.DOM.perfToggleBtn) {
// ... existing code ...
        }
    }
    
    onScroll() {
// ... existing code ...
        this.DOM.progressBar.style.transform = `scaleX(${scrollPercentage})`;

        if (!this.state.isLowPerfMode) {
// ... existing code ...
        }
    }

    setupIntersectionObserver() {
// ... existing code ...
        const options = { rootMargin: '-50% 0px -50% 0px' };
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
// ... existing code ...
                if (entry.isIntersecting) {
                    this.state.activeSectionId = id;
                    navLink?.classList.add('is-active');
// ... existing code ...
                } else {
                    navLink?.classList.remove('is-active');
                }
// ... existing code ...
        }, options);

        this.DOM.sections.forEach(section => observer.observe(section));

// ... existing code ...
        const completionObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
// ... existing code ...
                    if (!this.state.completedSections.has(id)) {
                        this.state.completedSections.add(id);
                        this.updateKnowledgeDistillate();
                    }
                }
            });
        }, { threshold: 0.8 });

        this.DOM.sections.forEach(section => completionObserver.observe(section));
        
// ... existing code ...
        const distillateObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.DOM.distillateContainer.classList.add('is-visible');
                }
            });
        }, { threshold: 0.2 });
        distillateObserver.observe(this.DOM.distillateContainer);
    }
    
    updateKnowledgeDistillate() {
// ... existing code ...
        this.DOM.distillateList.innerHTML = '';
        this.DOM.sections.forEach(section => {
            const id = section.id;
// ... existing code ...
            if (this.state.completedSections.has(id)) {
                const takeaway = section.dataset.takeaway;
                if (takeaway) {
// ... existing code ...
                    li.textContent = takeaway;
                    this.DOM.distillateList.appendChild(li);
                }
            }
        });
    }

    setupCustomAudioPlayers() {
        this.DOM.audioBoxes.forEach(box => {
// ... existing code ...
            const audio = box.querySelector('.audio-player-hidden');
            const playPauseBtn = box.querySelector('.play-pause-btn');
// ... existing code ...
            const playerContainer = box.querySelector('.custom-audio-player');
            const playbackRates = [1, 1.25, 1.5, 1.75, 2, 0.75];
            let currentRateIndex = 0;

            audio.addEventListener('loadedmetadata', () => {
// ... existing code ...
            });

            playPauseBtn.addEventListener('click', () => {
                if (audio.paused) {
// ... existing code ...
                } else {
                    audio.pause();
                }
            });

            audio.addEventListener('play', () => {
// ... existing code ...
                playPauseBtn.setAttribute('aria-label', 'Pause');
                this.setupAudioVisualizer(audio, visualizer);
            });
            audio.addEventListener('pause', () => {
// ... existing code ...
                playPauseBtn.setAttribute('aria-label', 'Abspielen');
            });

            audio.addEventListener('timeupdate', () => {
// ... existing code ...
                progressBar.style.width = `${progress}%`;
                currentTimeEl.textContent = this.formatTime(audio.currentTime);
            });

            skipBtns.forEach(btn => {
// ... existing code ...
            });

            progressContainer.addEventListener('click', (e) => {
// ... existing code ...
                const clickX = e.clientX - rect.left;
                const percentage = (clickX / rect.width);
                audio.currentTime = audio.duration * percentage;
            });
            
            speedBtn.addEventListener('click', () => {
// ... existing code ...
                audio.playbackRate = playbackRates[currentRateIndex];
                speedBtn.textContent = `${playbackRates[currentRateIndex]}x`;
            });
        });
    }
    
    formatTime(seconds) {
// ... existing code ...
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    setupAudioVisualizer(audioElement, canvas) {
// ... existing code ...
        if (this.state.isLowPerfMode || !canvas) return;
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
// ... existing code ...
        if (this.analysers.has(audioElement)) return;

        // Fehlerbehandlung für AudioContext, der Interaktion erfordert
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        const source = this.audioContext.createMediaElementSource(audioElement);
// ... existing code ...
        analyser.fftSize = 128;
        source.connect(analyser);
        analyser.connect(this.audioContext.destination);
// ... existing code ...
        this.analysers.set(audioElement, analyser);

        const bufferLength = analyser.frequencyBinCount;
// ... existing code ...
        const ctx = canvas.getContext('2d');
        const draw = () => {
            if (audioElement.paused) return;
// ... existing code ...
            analyser.getByteFrequencyData(dataArray);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const barWidth = (canvas.width / bufferLength) * 1.5;
// ... existing code ...
            for (let i = 0; i < bufferLength; i++) {
                const barHeight = (dataArray[i] / 255) * canvas.height;
                const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
// ... existing code ...
                gradient.addColorStop(1, '#67e8f9');
                ctx.fillStyle = gradient;
                ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
// ... existing code ...
            }
        };
        draw();
    }

// ... existing code ...
    // This ensures animations are always initialized.
    checkInitialPerfMode() {
        // Prüfen, ob der Modus im LocalStorage gespeichert ist
        const isLowPerf = localStorage.getItem('lowPerfMode') === 'true';
        this.state.isLowPerfMode = isLowPerf;
        this.DOM.body.classList.toggle('low-performance-mode', isLowPerf);
        if (this.DOM.perfToggleBtn) {
            this.DOM.perfToggleBtn.setAttribute('aria-pressed', String(isLowPerf));
            this.DOM.perfToggleBtn.textContent = isLowPerf ? '✨ Animationen aus' : '✨ Animationen an';
        }

        if (!isLowPerf) {
            this.setupAnimations();
        } else {
            console.log("Low Performance Mode ist aktiv. Animationen werden übersprungen.");
        }
    }

    togglePerformanceMode() {
// ... existing code ...
        this.state.isLowPerfMode = !this.state.isLowPerfMode;
        this.DOM.body.classList.toggle('low-performance-mode', this.state.isLowPerfMode);
        this.DOM.perfToggleBtn.setAttribute('aria-pressed', String(this.state.isLowPerfMode));
// ... existing code ...
        
        if (this.state.isLowPerfMode) {
            ScrollTrigger.getAll().forEach(st => st.disable());
// ... existing code ...
        } else {
            ScrollTrigger.getAll().forEach(st => st.enable());
            this.setupAnimations();
        }
        // Speichere die Wahl des Nutzers
        localStorage.setItem('lowPerfMode', this.state.isLowPerfMode);
    }
    
    setupBentoInteractions() {
// ... existing code ...
    }
    
    setupShareLinks() {
// ... existing code ...
        const url = window.location.href;
        const title = document.title;
        document.getElementById('share-email').href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent('Schau dir dieses Dossier an: ' + url)}`;
// ... existing code ...
        document.getElementById('share-facebook').href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    }
    
    animateColors(colors) {
// ... existing code ...
        if (this.state.currentColor !== colors.primary) {
            this.state.currentColor = colors.primary;
            gsap.to(this.DOM.root, {
// ... existing code ...
                '--primary-color-translucent': gsap.utils.splitColor(colors.primary).join(' / 0.3)'),
                duration: 1.5,
                ease: 'sine.inOut'
// ... existing code ...
        }
    }

    splitMainHeader() {
// ... existing code ...
        const mainHeader = document.querySelector('h1.fade-up-header');
        if (mainHeader && !mainHeader.dataset.split) {
            const originalText = mainHeader.textContent;
// ... existing code ...
            originalText.split('').forEach(char => {
                const charSpan = document.createElement('span');
                charSpan.className = 'char';
                charSpan.textContent = char === ' ' ? '\u00A0' : char;
// ... existing code ...
            });
            mainHeader.dataset.split = 'true';
        }
    }

    splitSectionHeaders() {
// ... existing code ...
        this.DOM.h2s.forEach(h2 => {
            if (h2.dataset.split) return;
            const originalText = h2.textContent;
// ... existing code ...
            const words = originalText.split(' ');
            words.forEach((word, index) => {
                const wordSpan = document.createElement('span');
// ... existing code ...
                word.split('').forEach(char => {
                    const charSpan = document.createElement('span');
                    charSpan.className = 'char';
// ... existing code ...
                    wordSpan.appendChild(charSpan);
                });
                h2.appendChild(wordSpan);
// ... existing code ...
                   h2.appendChild(document.createTextNode(' '));
                }
            });
            h2.dataset.split = 'true';
// ... existing code ...
    }

    generateNarrativePath() {
        if (!this.DOM.narrativePath || !this.DOM.focusPane || this.DOM.sections.length === 0) return;
// ... existing code ...
        let pathData = `M ${pathX} 0`;
        this.DOM.sections.forEach((section) => {
            const h2 = section.querySelector('h2');
// ... existing code ...
            const h2Y = h2.offsetTop + (h2.offsetHeight / 2);
            pathData += ` L ${pathX} ${h2Y}`;
        });
// ... existing code ...
        pathData += ` L ${pathX} ${totalHeight}`;
        this.DOM.narrativePath.setAttribute('d', pathData);
        this.DOM.narrativePath.closest('svg').style.height = `${totalHeight}px`;
    }
    
    onResize() {
// ... existing code ...
        if (this.DOM.narrativePath) {
            this.generateNarrativePath();
        }
// ... existing code ...
    }
    
    debounce(func, delay) {
// ... existing code ...
    }

    setupAnimations() {
        const mainHeader = document.querySelector('h1.fade-up-header');
// ... existing code ...

        if (chars && chars.length > 0) {
            const tl = gsap.timeline({delay: 0.2});
// ... existing code ...
            tl.from(chars, { yPercent: 100, opacity: 0, stagger: 0.05, duration: 0.8, ease: 'power2.out' }, 0.2);
            gsap.from(this.DOM.subtitle, { autoAlpha: 0, y: 20, duration: 1, ease: 'power3.out', delay: 0.8 });
        }

// ... existing code ...
        gsap.to(this.DOM.auroraBlobs[1], { duration: 25, x: "-=100", y: "+=100", rotation: -35, scale: 0.8, repeat: -1, yoyo: true, ease: "sine.inOut" });
        
        // Parallax for bento nav is correctly limited to desktop screens
// ... existing code ...
        if (window.matchMedia("(min-width: 1025px)").matches) {
            const bentoNav = document.querySelector('.bento-nav');
            if (bentoNav) {
// ... existing code ...
            }
        }
        
        gsap.to(this.DOM.headerContent, { scrollTrigger: { trigger: ".page-header", start: "top top", end: "bottom top", scrub: 1 }, y: 200, opacity: 0, ease: 'none' });

// ... existing code ...
            const sectionId = section.id;
            const colors = this.narrativeColors[sectionId];
            const h2Element = section.querySelector('h2');

// ... existing code ...
            if (h2Element) {
                const h2chars = h2Element.querySelectorAll('.char');
                const tl = gsap.timeline({ scrollTrigger: { trigger: h2Element, start: 'top 85%', toggleActions: 'play none none reverse' } });
// ... existing code ...
                tl.fromTo(h2Element, { '--underline-scale': 0 }, { '--underline-scale': 1, duration: 1, ease: 'expo.out' }, 0.1);
            }

            const animatedElements = section.querySelectorAll('p, h4, .audio-feature-box');
// ... existing code ...
            if (animatedElements.length > 0) {
                gsap.from(animatedElements, { scrollTrigger: { trigger: section, start: 'top 85%', toggleActions: 'play none none reverse' }, opacity: 0, y: 40, duration: 0.9, ease: 'power3.out', stagger: 0.1 });
            }

            if (colors) {
// ... existing code ...
            }
            
            const navLink = this.DOM.navLinks.find(link => link.hash === `#${sectionId}`);
// ... existing code ...
            if (navLink) {
                const progressPath = navLink.querySelector('.bento-progress-circle .progress-path');
                if (progressPath) {
// ... existing code ...
                }
            }
        });

// ... existing code ...
        // The narrative thread animation will only run if the element is visible (hidden on phones via CSS)
        if (this.DOM.narrativePath && !this.state.isLowPerfMode) {
            const pathLength = this.DOM.narrativePath.getTotalLength();
// ... existing code ...
            if (pathLength > 0) {
                this.DOM.narrativePath.style.strokeDasharray = pathLength;
                this.DOM.narrativePath.style.strokeDashoffset = pathLength;
// ... existing code ...
                    strokeDashoffset: 0,
                    ease: "none",
                    scrollTrigger: {
// ... existing code ...
                        end: "bottom bottom",
                        scrub: 1,
                        invalidateOnRefresh: true
// ... existing code ...
                });
            }
        }
        
// ... existing code ...
        const finalSection = document.querySelector('.final-actions');
        if (finalSection) {
            gsap.from(finalSection.querySelector('#final-cta'), { scrollTrigger: { trigger: finalSection, start: 'top 80%', toggleActions: 'play none none none' }, opacity: 0, y: 50, duration: 0.8, ease: 'power2.out' });
// ... existing code ...
        }
    }
}

document.addEventListener('DOMContentLoaded', () => new PhoenixDoss
