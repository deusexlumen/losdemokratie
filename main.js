// FILE: main.js
// VALIDIERTE VERSION: Phoenix Edition v4.8.1 (Vollständig & Korrigiert)

// This script is designed to be modular. TranscriptSynchronizer would be in a separate file.
// For this example, I'll place a placeholder class definition.
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
            if (cueRect.top < containerRect.top || cueRect.bottom > containerRect.bottom) {
                 this.transcriptContainer.scrollTop = activeCue.offsetTop - (this.transcriptContainer.offsetHeight / 2) + (activeCue.offsetHeight / 2);
            }
        }
    }
}


class PhoenixDossier {
    constructor() {
        gsap.registerPlugin(ScrollTrigger);

        this.DOM = {
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

        // REVISED: New dynamic color palette for the scrolling journey
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
        this.splitMainHeader();
        this.splitSectionHeaders();
        
        if (this.DOM.narrativePath) {
            // Use a slight delay to ensure layout is calculated
            setTimeout(() => this.generateNarrativePath(), 100);
        }

        this.setupEventListeners();
        this.setupIntersectionObserver();
        this.setupCustomAudioPlayers();
        this.checkInitialPerfMode();
        this.setupBentoInteractions();
        this.setupTranscripts();
        this.setupShareLinks();
    }
    
    setupTranscripts() {
        this.DOM.audioBoxes.forEach(box => {
            this.transcriptSynchronizers.push(new TranscriptSynchronizer(box));
        });
    }

    setupEventListeners() {
        window.addEventListener('resize', this.debouncedRefresh);
        document.addEventListener('scroll', () => {
            if (!this.state.isTicking) {
                window.requestAnimationFrame(() => {
                    this.onScroll();
                    this.state.isTicking = false;
                });
                this.state.isTicking = true;
            }
        });

        if (this.DOM.perfToggleBtn) {
            this.DOM.perfToggleBtn.addEventListener('click', () => this.togglePerformanceMode());
        }
    }
    
    onScroll() {
        const scrollPercentage = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
        this.DOM.progressBar.style.transform = `scaleX(${scrollPercentage})`;

        if (!this.state.isLowPerfMode) {
            // This lerp value can be used by CSS for subtle effects, like paragraph text color
            const lerpAmount = Math.min(window.scrollY / 500, 1);
            this.DOM.root.style.setProperty('--scroll-lerp', lerpAmount);
        }
    }

    setupIntersectionObserver() {
        const options = { rootMargin: '-50% 0px -50% 0px' };
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                const id = entry.target.id;
                const navLink = this.DOM.navLinks.find(link => link.hash === `#${id}`);
                if (entry.isIntersecting) {
                    this.state.activeSectionId = id;
                    navLink?.classList.add('is-active');
                    this.DOM.liveRegion.textContent = `Sie befinden sich jetzt im Abschnitt: ${navLink?.querySelector('h3').textContent}`;
                } else {
                    navLink?.classList.remove('is-active');
                }
            });
        }, options);

        this.DOM.sections.forEach(section => observer.observe(section));

        const completionObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.id;
                    if (!this.state.completedSections.has(id)) {
                        this.state.completedSections.add(id);
                        this.updateKnowledgeDistillate();
                    }
                }
            });
        }, { threshold: 0.8 });

        this.DOM.sections.forEach(section => completionObserver.observe(section));
        
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
        this.DOM.distillateList.innerHTML = '';
        this.DOM.sections.forEach(section => {
            const id = section.id;
            if (this.state.completedSections.has(id)) {
                const takeaway = section.dataset.takeaway;
                if (takeaway) {
                    const li = document.createElement('li');
                    li.textContent = takeaway;
                    this.DOM.distillateList.appendChild(li);
                }
            }
        });
    }

    setupCustomAudioPlayers() {
        this.DOM.audioBoxes.forEach(box => {
            const audio = box.querySelector('.audio-player-hidden');
            const playPauseBtn = box.querySelector('.play-pause-btn');
            const skipBtns = box.querySelectorAll('.skip-btn');
            const progressBar = box.querySelector('.audio-progress-bar');
            const progressContainer = box.querySelector('.audio-progress-container');
            const currentTimeEl = box.querySelector('.current-time');
            const totalTimeEl = box.querySelector('.total-time');
            const speedBtn = box.querySelector('.speed-btn');
            const visualizer = box.querySelector('.audio-visualizer');
            const playerContainer = box.querySelector('.custom-audio-player');
            const playbackRates = [1, 1.25, 1.5, 1.75, 2, 0.75];
            let currentRateIndex = 0;

            audio.addEventListener('loadedmetadata', () => {
                totalTimeEl.textContent = this.formatTime(audio.duration);
            });

            playPauseBtn.addEventListener('click', () => {
                if (audio.paused) {
                    audio.play();
                } else {
                    audio.pause();
                }
            });

            audio.addEventListener('play', () => {
                playerContainer.classList.add('is-playing');
                playPauseBtn.setAttribute('aria-label', 'Pause');
                this.setupAudioVisualizer(audio, visualizer);
            });
            audio.addEventListener('pause', () => {
                playerContainer.classList.remove('is-playing');
                playPauseBtn.setAttribute('aria-label', 'Abspielen');
            });

            audio.addEventListener('timeupdate', () => {
                const progress = (audio.currentTime / audio.duration) * 100;
                progressBar.style.width = `${progress}%`;
                currentTimeEl.textContent = this.formatTime(audio.currentTime);
            });

            skipBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    audio.currentTime += parseFloat(btn.dataset.skip);
                });
            });

            progressContainer.addEventListener('click', (e) => {
                const rect = progressContainer.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const percentage = (clickX / rect.width);
                audio.currentTime = audio.duration * percentage;
            });
            
            speedBtn.addEventListener('click', () => {
                currentRateIndex = (currentRateIndex + 1) % playbackRates.length;
                audio.playbackRate = playbackRates[currentRateIndex];
                speedBtn.textContent = `${playbackRates[currentRateIndex]}x`;
            });
        });
    }
    
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    setupAudioVisualizer(audioElement, canvas) {
        if (this.state.isLowPerfMode || !canvas) return;
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.analysers.has(audioElement)) return;

        const source = this.audioContext.createMediaElementSource(audioElement);
        const analyser = this.audioContext.createAnalyser();
        analyser.fftSize = 128;
        source.connect(analyser);
        analyser.connect(this.audioContext.destination);
        this.sources.set(audioElement, source);
        this.analysers.set(audioElement, analyser);

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        const ctx = canvas.getContext('2d');
        const draw = () => {
            if (audioElement.paused) return;
            requestAnimationFrame(draw);
            analyser.getByteFrequencyData(dataArray);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const barWidth = (canvas.width / bufferLength) * 1.5;
            let x = 0;
            for (let i = 0; i < bufferLength; i++) {
                const barHeight = (dataArray[i] / 255) * canvas.height;
                const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
                gradient.addColorStop(0, this.state.currentColor);
                gradient.addColorStop(1, '#67e8f9');
                ctx.fillStyle = gradient;
                ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
                x += barWidth + 2;
            }
        };
        draw();
    }

    checkInitialPerfMode() {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) {
            this.state.isLowPerfMode = true;
            this.DOM.body.classList.add('low-performance-mode');
            this.DOM.perfToggleBtn.setAttribute('aria-pressed', 'true');
            this.DOM.perfToggleBtn.textContent = '✨ Animationen aus';
            ScrollTrigger.getAll().forEach(st => st.disable());
        } else {
            this.setupAnimations();
        }
    }

    togglePerformanceMode() {
        this.state.isLowPerfMode = !this.state.isLowPerfMode;
        this.DOM.body.classList.toggle('low-performance-mode', this.state.isLowPerfMode);
        this.DOM.perfToggleBtn.setAttribute('aria-pressed', String(this.state.isLowPerfMode));
        this.DOM.perfToggleBtn.textContent = this.state.isLowPerfMode ? '✨ Animationen aus' : '✨ Animationen an';
        
        if (this.state.isLowPerfMode) {
            ScrollTrigger.getAll().forEach(st => st.disable());
            gsap.killTweensOf('*');
        } else {
            ScrollTrigger.getAll().forEach(st => st.enable());
            this.setupAnimations();
        }
    }
    
    setupBentoInteractions() {
        this.DOM.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href');
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    window.scrollTo({
                        top: targetElement.offsetTop - 100,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }
    
    setupShareLinks() {
        const url = window.location.href;
        const title = document.title;
        document.getElementById('share-email').href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent('Schau dir dieses Dossier an: ' + url)}`;
        document.getElementById('share-x').href = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
        document.getElementById('share-facebook').href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    }
    
    animateColors(colors) {
        if (this.state.currentColor !== colors.primary) {
            this.state.currentColor = colors.primary;
            gsap.to(this.DOM.root, {
                '--primary-color': colors.primary,
                '--secondary-color': colors.secondary,
                '--primary-color-translucent': gsap.utils.splitColor(colors.primary).join(' / 0.3)'),
                duration: 1.5,
                ease: 'sine.inOut'
            });
        }
    }

    splitMainHeader() {
        const mainHeader = document.querySelector('h1.fade-up-header');
        if (mainHeader && !mainHeader.dataset.split) {
            const originalText = mainHeader.textContent;
            mainHeader.textContent = '';
            originalText.split('').forEach(char => {
                const charSpan = document.createElement('span');
                charSpan.className = 'char';
                charSpan.textContent = char === ' ' ? '\u00A0' : char;
                mainHeader.appendChild(charSpan);
            });
            mainHeader.dataset.split = 'true';
        }
    }

    splitSectionHeaders() {
        this.DOM.h2s.forEach(h2 => {
            if (h2.dataset.split) return;
            const originalText = h2.textContent;
            h2.textContent = '';
            const words = originalText.split(' ');
            words.forEach((word, index) => {
                const wordSpan = document.createElement('span');
                wordSpan.className = 'word';
                word.split('').forEach(char => {
                    const charSpan = document.createElement('span');
                    charSpan.className = 'char';
                    charSpan.textContent = char;
                    wordSpan.appendChild(charSpan);
                });
                h2.appendChild(wordSpan);
                if (index < words.length - 1) {
                   h2.appendChild(document.createTextNode(' '));
                }
            });
            h2.dataset.split = 'true';
        });
    }

    generateNarrativePath() {
        if (!this.DOM.narrativePath || !this.DOM.focusPane || this.DOM.sections.length === 0) return;
        const pathX = 20;
        let pathData = `M ${pathX} 0`;
        this.DOM.sections.forEach((section) => {
            const h2 = section.querySelector('h2');
            if (!h2) return;
            const h2Y = h2.offsetTop + (h2.offsetHeight / 2);
            pathData += ` L ${pathX} ${h2Y}`;
        });
        const totalHeight = this.DOM.focusPane.scrollHeight;
        pathData += ` L ${pathX} ${totalHeight}`;
        this.DOM.narrativePath.setAttribute('d', pathData);
        this.DOM.narrativePath.closest('svg').style.height = `${totalHeight}px`;
    }
    
    onResize() {
        if (this.DOM.narrativePath) {
            this.generateNarrativePath();
        }
        ScrollTrigger.refresh();
    }
    
    debounce(func, delay) {
        return (...args) => {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => func.apply(this, args), delay);
        };
    }

    // --- NEW / HEAVILY REVISED: All animations are now configured here ---
    setupAnimations() {
        // 1. Animate Main Header on Load
        const mainHeader = document.querySelector('h1.fade-up-header');
        const chars = mainHeader ? mainHeader.querySelectorAll('.char') : null;

        if (chars && chars.length > 0) {
            const tl = gsap.timeline({delay: 0.2});
            tl.to(mainHeader, { '--underline-width': '100%', duration: 1.2, ease: 'power4.out' }, 0);
            tl.from(chars, { yPercent: 100, opacity: 0, stagger: 0.05, duration: 0.8, ease: 'power2.out' }, 0.2);
            gsap.from(this.DOM.subtitle, { autoAlpha: 0, y: 20, duration: 1, ease: 'power3.out', delay: 0.8 });
        }

        // 2. Background aurora blob movement
        gsap.to(this.DOM.auroraBlobs[0], { duration: 20, x: "+=120", y: "-=80", rotation: 45, scale: 1.25, repeat: -1, yoyo: true, ease: "sine.inOut" });
        gsap.to(this.DOM.auroraBlobs[1], { duration: 25, x: "-=100", y: "+=100", rotation: -35, scale: 0.8, repeat: -1, yoyo: true, ease: "sine.inOut" });
        
        // 3. Parallax scroll for bento navigation on large screens
        if (window.matchMedia("(min-width: 1025px)").matches) {
            const bentoNav = document.querySelector('.bento-nav');
            if (bentoNav) {
                gsap.to(bentoNav, { y: (i, target) => -(target.offsetHeight - window.innerHeight + 100), ease: "none", scrollTrigger: { trigger: this.DOM.mainContent, start: "top top", end: `bottom-=${window.innerHeight} bottom`, scrub: 1.8, invalidateOnRefresh: true } });
            }
        }
        
        // 4. Fade out header content on scroll
        gsap.to(this.DOM.headerContent, { scrollTrigger: { trigger: ".page-header", start: "top top", end: "bottom top", scrub: 1 }, y: 200, opacity: 0, ease: 'none' });

        // 5. Animate each content section as it scrolls into view
        this.DOM.sections.forEach(section => {
            const sectionId = section.id;
            const colors = this.narrativeColors[sectionId];
            const h2Element = section.querySelector('h2');

            // 5a. Animate section headline
            if (h2Element) {
                const h2chars = h2Element.querySelectorAll('.char');
                const tl = gsap.timeline({ scrollTrigger: { trigger: h2Element, start: 'top 85%', toggleActions: 'play none none reverse' } });
                tl.from(h2chars, { yPercent: 100, rotationZ: 8, opacity: 0, ease: 'circ.out', duration: 0.8, stagger: { amount: 0.4, from: "start" } }, 0);
                tl.fromTo(h2Element, { '--underline-scale': 0 }, { '--underline-scale': 1, duration: 1, ease: 'expo.out' }, 0.1);
            }

            // 5b. Animate section content (paragraphs, audio boxes)
            const animatedElements = section.querySelectorAll('p, h4, .audio-feature-box');
            if (animatedElements.length > 0) {
                gsap.from(animatedElements, { scrollTrigger: { trigger: section, start: 'top 85%', toggleActions: 'play none none reverse' }, opacity: 0, y: 40, duration: 0.9, ease: 'power3.out', stagger: 0.1 });
            }

            // 5c. Trigger color change for the section
            if (colors) {
                ScrollTrigger.create({ trigger: section, start: "top 40%", end: "bottom 40%", onEnter: () => this.animateColors(colors), onEnterBack: () => this.animateColors(colors) });
            }
            
            // 5d. Animate the progress circle in the corresponding bento nav cell
            const navLink = this.DOM.navLinks.find(link => link.hash === `#${sectionId}`);
            if (navLink) {
                const progressPath = navLink.querySelector('.bento-progress-circle .progress-path');
                if (progressPath) {
                    gsap.to(progressPath, { scrollTrigger: { trigger: section, start: "top center", end: "bottom bottom", scrub: true }, strokeDashoffset: 0, ease: 'none' });
                }
            }
        });

        // 6. Animate the narrative thread SVG path
        if (this.DOM.narrativePath && !this.state.isLowPerfMode) {
            const pathLength = this.DOM.narrativePath.getTotalLength();
            if (pathLength > 0) {
                this.DOM.narrativePath.style.strokeDasharray = pathLength;
                this.DOM.narrativePath.style.strokeDashoffset = pathLength;
                gsap.to(this.DOM.narrativePath, {
                    strokeDashoffset: 0,
                    ease: "none",
                    scrollTrigger: {
                        trigger: this.DOM.focusPane,
                        start: "top top",
                        end: "bottom bottom",
                        scrub: 1,
                        invalidateOnRefresh: true
                    }
                });
            }
        }
        
        // 7. Animate the final CTA section
        const finalSection = document.querySelector('.final-actions');
        if (finalSection) {
            gsap.from(finalSection.querySelector('#final-cta'), { scrollTrigger: { trigger: finalSection, start: 'top 80%', toggleActions: 'play none none none' }, opacity: 0, y: 50, duration: 0.8, ease: 'power2.out' });
            gsap.from(document.querySelectorAll('.final-actions-grid > div'), { scrollTrigger: { trigger: finalSection, start: 'top 70%', toggleActions: 'play none none none' }, opacity: 0, y: 30, duration: 1, stagger: 0.2, ease: 'power2.out' });
        }
    }
}

document.addEventListener('DOMContentLoaded', () => new PhoenixDossier());
