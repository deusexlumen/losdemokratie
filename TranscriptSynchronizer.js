// FILE: TranscriptSynchronizer.js

export class TranscriptSynchronizer {
    constructor(audioBoxElement) {
        this.audioBox = audioBoxElement;
        this.audioElement = this.audioBox.querySelector('audio');
        this.transcriptContainer = this.audioBox.querySelector('.transcript-container');
        this.toggleBtn = this.audioBox.querySelector('.transcript-toggle-btn');

        if (!this.audioElement || !this.transcriptContainer || !this.toggleBtn) {
            console.warn('TranscriptSynchronizer: Missing required elements for a feature box. Skipping initialization.');
            return;
        }

        this.transcriptParts = this.parseTranscript();
        if (this.transcriptParts.length === 0) {
            this.toggleBtn.disabled = true;
            this.toggleBtn.style.display = 'none';
            return;
        }

        this.currentSpeakingEl = null;

        // Bind 'this' context for event handlers
        this.handleTimeUpdate = this.handleTimeUpdate.bind(this);
        this.handleTranscriptClick = this.handleTranscriptClick.bind(this);
        this.handleToggleClick = this.handleToggleClick.bind(this);

        this.addEventListeners();
    }

    parseTranscript() {
        const parts = [];
        const elements = this.transcriptContainer.querySelectorAll('[data-start]');
        elements.forEach(el => {
            const start = parseFloat(el.dataset.start);
            const end = parseFloat(el.dataset.end);
            if (!isNaN(start) && !isNaN(end)) {
                parts.push({
                    start: start,
                    end: end,
                    element: el
                });
            }
        });
        return parts;
    }

    addEventListeners() {
        this.audioElement.addEventListener('timeupdate', this.handleTimeUpdate);
        this.transcriptContainer.addEventListener('click', this.handleTranscriptClick);
        this.toggleBtn.addEventListener('click', this.handleToggleClick);
    }

    handleTimeUpdate() {
        const currentTime = this.audioElement.currentTime;
        let activePart = null;

        for (const part of this.transcriptParts) {
            if (currentTime >= part.start && currentTime <= part.end) {
                activePart = part;
                break;
            }
        }

        if (activePart && activePart.element !== this.currentSpeakingEl) {
            this.updateHighlight(activePart.element);
        } else if (!activePart && this.currentSpeakingEl) {
            this.updateHighlight(null);
        }
    }

    updateHighlight(newElement) {
        if (this.currentSpeakingEl) {
            this.currentSpeakingEl.classList.remove('is-speaking');
        }

        if (newElement) {
            newElement.classList.add('is-speaking');
            if (this.transcriptContainer.offsetParent !== null) { // only scroll if visible
                newElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
        
        this.currentSpeakingEl = newElement;
    }

    handleTranscriptClick(event) {
        const target = event.target.closest('[data-start]');
        if (target && this.transcriptParts.some(p => p.element === target)) {
            const startTime = parseFloat(target.dataset.start);
            this.audioElement.currentTime = startTime;
            if (this.audioElement.paused) {
                // Find the corresponding play button and click it to maintain central state
                const playBtn = this.audioBox.querySelector('.play-pause-btn');
                if (playBtn) playBtn.click();
            }
        }
    }

    handleToggleClick() {
        const isExpanded = this.toggleBtn.getAttribute('aria-expanded') === 'true';
        this.toggleBtn.setAttribute('aria-expanded', String(!isExpanded));
        this.transcriptContainer.hidden = isExpanded;
        this.toggleBtn.textContent = isExpanded ? 'Transkript anzeigen' : 'Transkript ausblenden';
    }
    
    destroy() {
        this.audioElement.removeEventListener('timeupdate', this.handleTimeUpdate);
        this.transcriptContainer.removeEventListener('click', this.handleTranscriptClick);
        this.toggleBtn.removeEventListener('click', this.handleToggleClick);
    }
}
