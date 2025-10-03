// FILE: main.js

import { TranscriptSynchronizer } from './TranscriptSynchronizer.js';

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

        this.narrativeColors = {
            part1: { primary: '#fb923c', secondary: '#f97316' },
            part2: { primary: '#f87171', secondary: '#ef4444' },
            part3: { primary: '#60a5fa', secondary: '#3b82f6' },
            part4: { primary: '#4ade80', secondary: '#22c55e' },
            part5: { primary: '#a78bfa', secondary: '#8b5cf6' },
            part6: { primary: '#22d3ee', secondary: '#06b6d4' },
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
            this.generateNarrativePath();
        }

        this.setupEventListeners();
        this.setupIntersectionObserver();
        this.setupCustomAudioPlayers();
        this.checkInitialPerfMode();
        this.setupBentoInteractions();
        this.setupTranscripts();
    }

    setupTranscripts() {
        this.DOM.audioBoxes.forEach(box => {
            this.transcriptSynchronizers.push(new TranscriptSynchronizer(box));
        });
    }

    splitMainHeader() {
        const mainHeader = document.querySelector('h1.fade-up-header');
        if (mainHeader && !mainHeader.dataset.split) {
            const originalText = mainHeader.textContent;
            mainHeader.textContent = '';
            originalText.split('').forEach(char => {
                const charSpan = document.createElement('span');
                charSpan.className = 'char';
                charSpan.textContent = char === ' ' ? '\u00A0' : char; // Non-breaking space
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

    setupAnimations() {
        const mainHeader = document.querySelector('h1.fade-up-header');
        const chars = mainHeader ? mainHeader.querySelectorAll('.char') : null;

        if (chars && chars.length > 0) {
            const tl = gsap.timeline({delay: 0.2});
            tl.to(mainHeader, { '--underline-width': '100%', duration: 1.2, ease: 'power4.out' }, 0);
            tl.from(chars, { yPercent: 100, opacity: 0, stagger: 0.05, duration: 0.8, ease: 'power2.out' }, 0.2);
            gsap.from(this.DOM.subtitle, { autoAlpha: 0, y: 20, duration: 1, ease: 'power3.out', delay: 0.8 });
        }

        gsap.to(this.DOM.auroraBlobs[0], { duration: 20, x: "+=120", y: "-=80", rotation: 45, scale: 1.25, repeat: -1, yoyo: true, ease: "sine.inOut" });
        gsap.to(this.DOM.auroraBlobs[1], { duration: 25, x: "-=100", y: "+=100", rotation: -35, scale: 0.8, repeat: -1, yoyo: true, ease: "sine.inOut" });

        if (window.matchMedia("(min-width: 1025px)").matches) {
            const bentoNav = document.querySelector('.bento-nav');
            if (bentoNav) {
                gsap.to(bentoNav, { y: (i, target) => -(target.offsetHeight - window.innerHeight + 100), ease: "none", scrollTrigger: { trigger: this.DOM.mainContent, start: "top top", end: `bottom-=${window.innerHeight} bottom`, scrub: 1.8, invalidateOnRefresh: true } });
            }
        }

        gsap.to(this.DOM.headerContent, { scrollTrigger: { trigger: ".page-header", start: "top top", end: "bottom top", scrub: 1 }, y: 200, opacity: 0, ease: 'none' });

        this.DOM.sections.forEach(section => {
            const sectionId = section.id;
            const colors = this.narrativeColors[sectionId];
            const h2Element = section.querySelector('h2');

            if (h2Element) {
                const h2chars = h2Element.querySelectorAll('.char');
                const tl = gsap.timeline({ scrollTrigger: { trigger: h2Element, start: 'top 85%', toggleActions: 'play none none reverse' } });
                tl.from(h2chars, { yPercent: 100, rotationZ: 8, opacity: 0, ease: 'circ.out', duration: 0.8, stagger: { amount: 0.4, from: "start" } }, 0);
                tl.fromTo(h2Element, { '--underline-scale': 0 }, { '--underline-scale': 1, duration: 1, ease: 'expo.out' }, 0.1);
            }

            const animatedElements = section.querySelectorAll('p, h4, .audio-feature-box');
            if (animatedElements.length > 0) {
                gsap.from(animatedElements, { scrollTrigger: { trigger: section, start: 'top 85%', toggleActions: 'play none none reverse' }, opacity: 0, y: 40, duration: 0.9, ease: 'power3.out', stagger: 0.1 });
            }

            if (colors) {
                ScrollTrigger.create({ trigger: section, start: "top 40%", end: "bottom 40%", onEnter: () => this.animateColors(colors), onEnterBack: () => this.animateColors(colors) });
            }
            const navLink = this.DOM.navLinks.find(link => link.hash === `#${sectionId}`);
            if (navLink) {
                const progressPath = navLink.querySelector('.bento-progress-circle .progress-path');
                if (progressPath) {
                    gsap.to(progressPath, { scrollTrigger: { trigger: section, start: "top center", end: "bottom bottom", scrub: true }, strokeDashoffset: 0, ease: 'none' });
                }
            }
        });

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
        
        const finalSection = document.querySelector('.final-actions');
        if (finalSection) {
            gsap.from(finalSection.querySelector('#final-cta'), { scrollTrigger: { trigger: finalSection, start: 'top 80%', toggleActions: 'play none none none' }, opacity: 0, y: 50, duration: 0.8, ease: 'power2.out' });
            gsap.from(document.querySelectorAll('.final-actions-grid > div'), { scrollTrigger: { trigger: finalSection, start: 'top 70%', toggleActions: 'play none none none' }, opacity: 0, y: 30, duration: 1, stagger: 0.2, ease: 'power2.out' });
        }
    }
    
    // Placeholder for other methods from the original file
    setupEventListeners() { /* Add full method from original file */ }
    setupIntersectionObserver() { /* Add full method from original file */ }
    setupCustomAudioPlayers() { /* Add full method from original file */ }
    checkInitialPerfMode() { /* Add full method from original file */ }
    setupBentoInteractions() { /* Add full method from original file */ }
    animateColors(colors) { /* Add full method from original file */ }
}

document.addEventListener('DOMContentLoaded', () => new PhoenixDossier());
