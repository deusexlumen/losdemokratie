// FILE: TranscriptSynchronizer.js

export class TranscriptSynchronizer {
    constructor(audioBoxElement) {
        this.audioBox = audioBoxElement;
        this.audioElement = this.audioBox.querySelector('audio');
        this.transcriptContainer = this.audioBox.querySelector('.transcript-container');
        this.toggleBtn = this.audioBox.querySelector('.transcript-toggle-btn');

        if (!this.audioElement || !this.transcriptContainer || !this.toggleBtn) {
            // No transcript for this audio box, so we do nothing.
            return;
        }

        this.transcriptParts = this.parseTranscript();
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
            parts.push({
                start: parseFloat(el.dataset.start),
                end: parseFloat(el.dataset.end),
                element: el
            });
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
            newElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
        this.currentSpeakingEl = newElement;
    }

    handleTranscriptClick(event) {
        const target = event.target.closest('[data-start]');
        if (target && this.transcriptParts.some(p => p.element === target)) {
            const startTime = parseFloat(target.dataset.start);
            this.audioElement.currentTime = startTime;
            if (this.audioElement.paused) {
                // We need to access the play/pause button from the parent to update its state
                const playPauseBtn = this.audioBox.querySelector('.play-pause-btn');
                this.audioElement.play().catch(e => console.error("Error playing audio:", e));
                if (playPauseBtn) playPauseBtn.closest('.custom-audio-player').classList.add('is-playing');
            }
        }
    }

    handleToggleClick() {
        const isExpanded = this.toggleBtn.getAttribute('aria-expanded') === 'true';
        this.toggleBtn.setAttribute('aria-expanded', !isExpanded);
        this.transcriptContainer.hidden = isExpanded;
        this.toggleBtn.textContent = isExpanded ? 'Transkript anzeigen' : 'Transkript ausblenden';
    }
    
    destroy() {
        this.audioElement.removeEventListener('timeupdate', this.handleTimeUpdate);
        this.transcriptContainer.removeEventListener('click', this.handleTranscriptClick);
        this.toggleBtn.removeEventListener('click', this.handleToggleClick);
    }
}
