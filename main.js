// VALIDIERTE VERSION: Phoenix Edition v4.8.3 (Synthesized)
// LOGIK FUSIONIERT: Behält den Preloader und den GSAP-Fix bei, integriert aber den voll funktionalen Transcript-Synchronizer und den erweiterten Audio-Player der Inhaltsquelle.

// === Helper Class: TranscriptSynchronizer (aus Inhaltsquelle) ===
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
                if (this.audio.paused) {
                    this.audio.play();
                }
            });
        });
        
        this.toggleBtn.textContent = 'Transkript anzeigen';
    }

    toggle() {
        const isHidden = this.transcriptContainer.hidden;
        this.transcriptContainer.hidden = !isHidden;
        this.toggleBtn.setAttribute('aria-expanded', String(isHidden));
        this.toggleBtn.textContent = isHidden ? 'Transkript ausblenden' : 'Transkript anzeigen';
    }

    sync() {
        if (this.transcriptContainer.hidden || this.audio.paused) return;
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
                container.scrollTop = cueOffsetTop - (containerHeight / 2) + (cueHeight / 2);
            }
        }
    }
}

// === Hauptklasse: PhoenixDossier (aus Strukturquelle, aber mit fusionierter Logik) ===
class PhoenixDossier {
    constructor() {
        this.DOM = {
            preloader: document.getElementById('preloader'),
            body: document.body,
            focusPane: document.querySelector('.focus-pane'),
            perfToggle: document.getElementById('perf-toggle'),
            mainTitle: document.getElementById('title-split'),
            subTitle: document.getElementById('subtitle-split'),
            narrativePath: document.querySelector('.narrative-thread-path'),
        };

        this.state = {
            isLowPerfMode: false,
        };

        this.init();
    }

    init() {
        this.hidePreloader();
        this.setupPerfToggle();
        this.setupAudioPlayers(); // Nutzt jetzt die Logik der Inhaltsquelle
        
        try {
            if (!this.state.isLowPerfMode) {
                this.setupGSAPAnimations();
            } else {
                gsap.set([this.DOM.mainTitle, this.DOM.subTitle], { opacity: 1 });
                console.log('Low Performance Mode aktiv: GSAP Animationen übersprungen.');
            }
        } catch (error) {
            console.error("Fehler bei der GSAP-Initialisierung:", error);
            if (this.DOM.mainTitle && this.DOM.subTitle) {
                 gsap.set([this.DOM.mainTitle, this.DOM.subTitle], { opacity: 1 });
            }
        } finally {
            this.DOM.preloader.classList.add('hidden');
            this.DOM.preloader.addEventListener('transitionend', () => {
                 this.DOM.preloader.style.display = 'none';
            }, { once: true });
        }
        
        this.setupShareButtons();
        this.generateTakeaways();
        console.log('Synthetisiertes Dossier vollständig initialisiert.');
    }
    
    hidePreloader() {
        this.DOM.preloader.classList.remove('hidden');
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
        const iconPlay = playPauseBtn.querySelector('.icon-play');
        const iconPause = playPauseBtn.querySelector('.icon-pause');
        const progressBar = box.querySelector('.audio-progress-bar');
        const progressContainer = box.querySelector('.audio-progress-container');
        const currentTimeEl = box.querySelector('.current-time');
        const totalTimeEl = box.querySelector('.total-time');
        const skipBtns = box.querySelectorAll('.skip-btn');
        const speedBtn = box.querySelector('.speed-btn');

        const updatePlayPauseIcon = () => {
            const isPaused = audio.paused;
            iconPlay.style.display = isPaused ? 'block' : 'none';
            iconPause.style.display = isPaused ? 'none' : 'block';
            playPauseBtn.setAttribute('aria-label', isPaused ? 'Abspielen' : 'Pausieren');
        };
        
        audio.addEventListener('loadedmetadata', () => {
            totalTimeEl.textContent = this.formatTime(audio.duration);
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
            const progress = (audio.currentTime / audio.duration) * 100;
            progressBar.style.width = `${progress}%`;
            currentTimeEl.textContent = this.formatTime(audio.currentTime);
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
                audio.currentTime += skipAmount;
            });
        });

        const speeds = [1, 1.25, 1.5, 1.75, 2, 0.75];
        let currentSpeedIndex = 0;
        speedBtn.addEventListener('click', () => {
            currentSpeedIndex = (currentSpeedIndex + 1) % speeds.length;
            const newSpeed = speeds[currentSpeedIndex];
            audio.playbackRate = newSpeed;
            speedBtn.textContent = `${newSpeed}x`;
        });

        updatePlayPauseIcon(); // Initial state
    }
    
    setupAudioVisualizer(box) {
         if (!window.AudioContext && !window.webkitAudioContext) {
            console.warn("AudioContext nicht verfügbar. Visualizer deaktiviert.");
            box.querySelector('.audio-visualizer').style.display = 'none';
            return;
        }

        const canvas = box.querySelector('.audio-visualizer');
        const audio = box.querySelector('audio');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        
        // Verhindern, dass die Quelle mehrmals erstellt wird
        if (!audio.dataset.audioSourceConnected) {
            const source = audioContext.createMediaElementSource(audio);
            source.connect(analyser);
            analyser.connect(audioContext.destination);
            audio.dataset.audioSourceConnected = 'true';
        }

        analyser.fftSize = 128;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        const draw = () => {
            if (audio.paused) {
                requestAnimationFrame(draw);
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
    }
    
    formatTime(seconds) {
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    }

    setupPerfToggle() {
        const isLowPerf = localStorage.getItem('lowPerfMode') === 'true';
        this.state.isLowPerfMode = isLowPerf;
        this.DOM.perfToggle.setAttribute('aria-pressed', String(isLowPerf));
        this.DOM.perfToggle.textContent = isLowPerf ? '💤 Animationen aus' : '✨ Animationen an';
        this.DOM.body.classList.toggle('low-perf-mode', isLowPerf);

        this.DOM.perfToggle.addEventListener('click', () => {
            this.state.isLowPerfMode = !this.state.isLowPerfMode;
            localStorage.setItem('lowPerfMode', String(this.state.isLowPerfMode));
            window.location.reload(); 
        });
    }

    manualSplitText(element) {
        if (!element) return [];
        const originalText = element.textContent;
        element.textContent = '';
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

        if (this.DOM.narrativePath && !this.state.isLowPerfMode && window.innerWidth > 1024) {
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
            gsap.from(finalSection.querySelector('#final-cta'), { scrollTrigger: { trigger: finalSection, start: 'top 80%', toggleActions: 'play none none none' }, opacity: 0, y: 50, duration: 0.8, ease: 'power2.out' });
            gsap.from(document.querySelectorAll('.final-actions-grid > .action-card'), { scrollTrigger: { trigger: finalSection, start: 'top 70%', toggleActions: 'play none none none' }, opacity: 0, y: 30, duration: 1, stagger: 0.2, ease: 'power2.out' });
        }
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

document.addEventListener('DOMContentLoaded', () => {
    window.dossier = new PhoenixDossier();
});            preloader: document.getElementById('preloader'), // NEU: Preloader
            body: document.body,
            focusPane: document.querySelector('.focus-pane'),
            perfToggle: document.getElementById('perf-toggle'),
            mainTitle: document.getElementById('title-split'),
            subTitle: document.getElementById('subtitle-split'),
            narrativePath: document.querySelector('.narrative-thread-path'),
        };

        this.state = {
            isLowPerfMode: false,
        };

        // Ruft die Initialisierung auf
        this.init();
    }

    init() {
        this.hidePreloader(); // Setzt den Preloader auf sichtbar und fügt die Klasse 'hidden' später hinzu
        this.setupPerfToggle(); // Setze zuerst den Performance-Modus
        this.setupAudioPlayers(); // Initialisiere alle Audio-Boxen
        
        try {
            // Führe GSAP-Initialisierung nur aus, wenn der Low-Perf-Modus nicht aktiv ist
            if (!this.state.isLowPerfMode) {
                this.setupGSAPAnimations();
            } else {
                // Wenn Low-Perf aktiv ist, die Split-Elemente sofort zeigen
                gsap.set([this.DOM.mainTitle, this.DOM.subTitle], { opacity: 1 });
                console.log('Low Performance Mode aktiv: GSAP Animationen übersprungen.');
            }
        } catch (error) {
            console.error("Fehler bei der GSAP-Initialisierung:", error);
            // Fallback: Stelle sicher, dass der Text sichtbar ist, auch wenn die Animation fehlschlägt
            if (this.DOM.mainTitle && this.DOM.subTitle) {
                 gsap.set([this.DOM.mainTitle, this.DOM.subTitle], { opacity: 1 });
            }
        } finally {
            // NEU: Sicheres Ausblenden des Preloaders
            // Dies stellt sicher, dass der Preloader *immer* ausgeblendet wird,
            // auch wenn die Animationen (try-Block) fehlschlagen.
            this.DOM.preloader.classList.add('hidden');
            
            // Entferne das Preloader-Element nach der Transition, um Klicks zu verhindern
            this.DOM.preloader.addEventListener('transitionend', () => {
                 this.DOM.preloader.style.display = 'none';
            }, { once: true });
        }
        
        this.setupLinkCopy(); // Fügt die Kopierfunktion hinzu
        
        console.log('Dossier vollständig initialisiert.');
    }
    
    // NEU: Methode zur Vorbereitung des Preloaders
    hidePreloader() {
        // Das ist eigentlich 'showPreloader', aber wir wollen sicherstellen, dass es anfangs sichtbar ist.
        // Die 'hidden'-Klasse wird erst am Ende von init() hinzugefügt.
        this.DOM.preloader.classList.remove('hidden');
    }


    // === Audio-Player & Visualizer Setup ===
    setupAudioPlayers() {
        const audioBoxes = document.querySelectorAll('.audio-box');
        audioBoxes.forEach(box => {
            const synchronizer = new TranscriptSynchronizer(box);
            this.setupAudioControls(box, synchronizer);
            // Wir überspringen den Visualizer-Setup im Low-Perf-Modus und auf Mobilgeräten (via CSS)
            if (!this.state.isLowPerfMode && window.innerWidth > 1024) {
                this.setupAudioVisualizer(box);
            }
        });
    }

    setupAudioControls(box, synchronizer) {
        const audio = box.querySelector('audio');
        const playPauseBtn = box.querySelector('.audio-play-pause-btn');
        const progressBar = box.querySelector('.audio-progress-bar');
        const timeDisplay = box.querySelector('.audio-time');
        
        // Initialisiere die Zeitanzeige, sobald Metadaten verfügbar sind
        audio.onloadedmetadata = () => {
            timeDisplay.textContent = this.formatTime(audio.currentTime) + ' / ' + this.formatTime(audio.duration);
            progressBar.max = audio.duration;
        };

        playPauseBtn.onclick = () => {
            if (audio.paused) {
                audio.play();
                playPauseBtn.innerHTML = '⏸️ Pause';
                playPauseBtn.setAttribute('aria-label', 'Audio pausieren');
            } else {
                audio.pause();
                playPauseBtn.innerHTML = '▶️ Play';
                playPauseBtn.setAttribute('aria-label', 'Audio abspielen');
            }
        };

        audio.ontimeupdate = () => {
            progressBar.value = audio.currentTime;
            timeDisplay.textContent = this.formatTime(audio.currentTime) + ' / ' + this.formatTime(audio.duration);
            synchronizer.sync();
        };

        progressBar.oninput = () => {
            audio.currentTime = progressBar.value;
        };

        audio.onended = () => {
            playPauseBtn.innerHTML = '▶️ Play';
            playPauseBtn.setAttribute('aria-label', 'Audio abspielen');
            audio.currentTime = 0;
        };
    }

    setupAudioVisualizer(box) {
        // Überprüfen, ob AudioContext verfügbar ist (Robustheit)
        if (!window.AudioContext && !window.webkitAudioContext) {
            console.warn("AudioContext nicht verfügbar. Visualizer deaktiviert.");
            box.querySelector('.audio-visualizer-container').style.display = 'none';
            return;
        }
        
        const canvas = box.querySelector('.audio-visualizer');
        const audio = box.querySelector('audio');
        const container = box.querySelector('.audio-visualizer-container');

        if (!canvas) return; // Kann durch Responsive CSS ausgeblendet sein

        const ctx = canvas.getContext('2d');
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaElementSource(audio);

        // Verbinde Audio-Quelle mit Analyser und dem Audio-Ziel
        source.connect(analyser);
        analyser.connect(audioContext.destination);

        // Setze Analyser-Parameter
        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        // Funktion zum Zeichnen der Visualisierung
        const draw = () => {
            requestAnimationFrame(draw);
            
            // Stelle sicher, dass die Canvas-Größe aktuell ist
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;

            analyser.getByteFrequencyData(dataArray);

            ctx.fillStyle = 'rgba(0, 0, 0, 0)'; // Klarer Hintergrund (transparent)
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const barWidth = (canvas.width / bufferLength) * 2.5;
            let barX = 0;

            for (let i = 0; i < bufferLength; i++) {
                const barHeight = dataArray[i] / 2;
                
                // Cyan zu Violett Farbverlauf basierend auf der Frequenz (i)
                const r = Math.floor(255 - (i / bufferLength) * 200); 
                const g = Math.floor(100 + (i / bufferLength) * 150); 
                const b = Math.floor(200 + (i / bufferLength) * 55); 
                ctx.fillStyle = `rgb(6, 182, 212)`; // Einfacher Cyan-Farbton

                // Zeichne den Balken
                ctx.fillRect(barX, canvas.height - barHeight, barWidth, barHeight);

                barX += barWidth + 1;
            }
        };

        // Starte das Zeichnen, aber pausiere den AudioContext initial, wenn es notwendig ist
        if (audioContext.state === 'suspended') {
            const resumeAudio = () => {
                audioContext.resume().then(() => {
                    draw();
                    document.body.removeEventListener('click', resumeAudio);
                });
            };
            // Starte AudioContext erst nach einer Benutzerinteraktion
            document.body.addEventListener('click', resumeAudio);
        } else {
            draw();
        }

        // Listener für die Fenstergröße, um die Canvas-Größe anzupassen
        window.addEventListener('resize', () => {
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;
        });
    }

    formatTime(seconds) {
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min}:${sec < 10 ? '0' : ''}${sec}`;
    }

    // === Performance Toggle ===
    setupPerfToggle() {
        const isLowPerf = localStorage.getItem('lowPerfMode') === 'true';
        this.state.isLowPerfMode = isLowPerf;
        this.DOM.perfToggle.setAttribute('aria-pressed', isLowPerf);
        this.DOM.perfToggle.textContent = isLowPerf ? '💤 Animationen aus' : '✨ Animationen an';
        this.DOM.body.classList.toggle('low-perf-mode', isLowPerf);

        this.DOM.perfToggle.addEventListener('click', () => {
            this.state.isLowPerfMode = !this.state.isLowPerfMode;
            localStorage.setItem('lowPerfMode', this.state.isLowPerfMode);
            // Einfacher Reload, um GSAP korrekt zu (de)initialisieren
            window.location.reload(); 
        });
    }

    // === NEUE HELPER-FUNKTION: Manueller Text-Split ===
    /**
     * Splittet den Textinhalt eines Elements manuell in <span>-Tags für jeden Buchstaben.
     * @param {HTMLElement} element - Das Element, dessen Text gesplittet werden soll.
     * @returns {Array<HTMLElement>} - Ein Array der neuen Char-Span-Elemente.
     */
    manualSplitText(element) {
        if (!element) return [];
        const originalText = element.textContent;
        element.textContent = ''; // Leert das Element
        const chars = [];
        
        originalText.split('').forEach(char => {
            const charSpan = document.createElement('span');
            charSpan.className = 'char-anim';
            charSpan.style.display = 'inline-block'; // Wichtig für GSAP
            charSpan.textContent = (char === ' ') ? '\u00A0' : char; // Leerzeichen beibehalten
            element.appendChild(charSpan);
            chars.push(charSpan);
        });
        return chars;
    }

    // === GSAP Animationen ===
    setupGSAPAnimations() {
        // Registriere GSAP Plugins
        // KORREKTUR: SplitText entfernt
        gsap.registerPlugin(ScrollTrigger);

        // 1. Split Text Animationen für Überschriften
        // KORREKTUR: Verwende die manuelle Split-Funktion statt new SplitText()
        const mainChars = this.manualSplitText(this.DOM.mainTitle);
        const subChars = this.manualSplitText(this.DOM.subTitle);

        gsap.set([this.DOM.mainTitle, this.DOM.subTitle], { opacity: 1 }); // Elemente sichtbar machen
        gsap.set(mainChars, { opacity: 0, y: '100%', rotationX: -90, transformOrigin: 'center center -50px' });
        gsap.set(subChars, { opacity: 0, y: '100%' });

        // Haupt-Titel Animation (Eingeflogen)
        gsap.to(mainChars, {
            opacity: 1,
            y: '0%',
            rotationX: 0,
            duration: 0.8,
            ease: 'power3.out',
            stagger: 0.03,
            delay: 0.5 // Startet nach dem Preloader
        });

        // Untertitel Animation (Eingeblendet)
        gsap.to(subChars, {
            opacity: 1,
            y: '0%',
            duration: 0.5,
            ease: 'power1.out',
            stagger: 0.01,
            delay: 1.0
        });
        
        // 2. Parallax für die Kapitel-Überschriften
        document.querySelectorAll('.chapter-section').forEach(section => {
            const title = section.querySelector('.chapter-title');
            if (title) {
                 gsap.from(title, {
                    y: 100,
                    opacity: 0,
                    ease: "power2.out",
                    scrollTrigger: {
                        trigger: section,
                        start: "top 80%",
                        end: "top 20%",
                        scrub: true,
                        toggleActions: "play none none reverse",
                    }
                });
            }
        });

        // 3. Narrative Thread (SVG-Linien-Animation)
        // Läuft nur, wenn das Element sichtbar ist (auf Mobilgeräten via CSS ausgeblendet)
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
        
        // 4. Final Actions Animation
        const finalSection = document.querySelector('.final-actions');
        if (finalSection) {
            gsap.from(finalSection.querySelector('#final-cta'), { scrollTrigger: { trigger: finalSection, start: 'top 80%', toggleActions: 'play none none none' }, opacity: 0, y: 50, duration: 0.8, ease: 'power2.out' });
            gsap.from(document.querySelectorAll('.final-actions-grid > div'), { scrollTrigger: { trigger: finalSection, start: 'top 70%', toggleActions: 'play none none none' }, opacity: 0, y: 30, duration: 1, stagger: 0.2, ease: 'power2.out' });
        }
    }
    
    // === Link Copy Funktion ===
    setupLinkCopy() {
        const copyButton = document.querySelector('.cta-button');
        if (!copyButton) return;

        copyButton.addEventListener('click', async (event) => {
            event.preventDefault();
            const linkToCopy = window.location.href; 
            
            // Versuche, in die Zwischenablage zu kopieren
            try {
                // Verwenden der veralteten execCommand-Methode als Fallback/in Canvas
                const tempInput = document.createElement('input');
                tempInput.value = linkToCopy;
                document.body.appendChild(tempInput);
                tempInput.select();
                document.execCommand('copy');
                document.body.removeChild(tempInput);
                
                // Visuelles Feedback
                const originalText = copyButton.textContent;
                copyButton.textContent = 'Link kopiert! ✅';
                
                setTimeout(() => {
                    copyButton.textContent = originalText;
                }, 2000);
                
            } catch (err) {
                console.error('Kopieren fehlgeschlagen:', err);
                copyButton.textContent = 'Kopieren fehlgeschlagen ❌';
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Wenn das Fenster vollständig geladen ist und das DOM bereit ist, initialisiere das Dossier
    window.dossier = new PhoenixDossier();
});
