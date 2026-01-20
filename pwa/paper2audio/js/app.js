/**
 * PDF to Audio - Main Application
 * Progressive Web App for converting PDF documents to audio
 */

import { PDFParser } from './pdf-parser.js';
import { TextToSpeech } from './tts.js';
import { OpenRouterAPI } from './openrouter-api.js';
import { usageTracker, UsageTracker } from './usage-tracker.js';

class PDFToAudioApp {
    constructor() {
        // Services
        this.pdfParser = new PDFParser();
        this.tts = new TextToSpeech();
        this.api = new OpenRouterAPI();

        // State
        this.currentDocument = null;
        this.sections = [];
        this.currentSectionIndex = 0;
        this.mode = 'full'; // 'full' or 'summary'
        this.isPlaying = false;

        // Settings
        this.settings = this.loadSettings();

        // Initialize
        this.initializeElements();
        this.initializeEventListeners();
        this.initializeTTS();
        this.applySettings();

        // Register service worker
        this.registerServiceWorker();
    }

    /**
     * Initialize DOM element references
     */
    initializeElements() {
        // Sections
        this.uploadSection = document.getElementById('upload-section');
        this.processingSection = document.getElementById('processing-section');
        this.documentSection = document.getElementById('document-section');

        // Upload
        this.dropZone = document.getElementById('drop-zone');
        this.fileInput = document.getElementById('file-input');

        // Processing
        this.processingStatus = document.getElementById('processing-status');
        this.progressFill = document.getElementById('progress-fill');
        this.processingDetail = document.getElementById('processing-detail');

        // Document
        this.documentTitle = document.getElementById('document-title');
        this.documentMeta = document.getElementById('document-meta');
        this.sectionsList = document.getElementById('sections-list');
        this.currentTextDisplay = document.getElementById('current-text');

        // Summarization Progress
        this.summarizationProgress = document.getElementById('summarization-progress');
        this.progressText = document.getElementById('progress-text');
        this.progressCount = document.getElementById('progress-count');
        this.progressFillBar = document.getElementById('summarization-progress-fill');

        // Controls
        this.playPauseBtn = document.getElementById('play-pause-btn');
        this.playIcon = document.getElementById('play-icon');
        this.pauseIcon = document.getElementById('pause-icon');
        this.stopBtn = document.getElementById('stop-btn');
        this.prevSectionBtn = document.getElementById('prev-section-btn');
        this.nextSectionBtn = document.getElementById('next-section-btn');
        this.speedSelect = document.getElementById('speed-select');
        this.voiceSelect = document.getElementById('voice-select');
        this.newDocumentBtn = document.getElementById('new-document-btn');
        this.downloadAudioBtn = document.getElementById('download-audio-btn');

        // Mode toggle
        this.modeFullBtn = document.getElementById('mode-full');
        this.modeSummaryBtn = document.getElementById('mode-summary');
        this.apiNotice = document.getElementById('api-notice');

        // Settings modal
        this.settingsBtn = document.getElementById('settings-btn');
        this.settingsModal = document.getElementById('settings-modal');
        this.closeSettingsBtn = document.getElementById('close-settings');
        this.saveSettingsBtn = document.getElementById('save-settings');

        // Settings inputs - TTS
        this.ttsProviderRadios = document.querySelectorAll('input[name="tts-provider"]');
        this.openaiTtsSettings = document.getElementById('openai-tts-settings');
        this.openaiKeyInput = document.getElementById('openai-key-input');
        this.openaiVoiceSelect = document.getElementById('openai-voice-select');
        this.openaiModelSelect = document.getElementById('openai-model-select');

        // Settings inputs - OpenRouter
        this.openrouterKeyInput = document.getElementById('openrouter-key-input');
        this.modelSelect = document.getElementById('model-select');

        // Other settings
        this.openSettingsLink = document.getElementById('open-settings-link');

        // Toast container
        this.toastContainer = document.getElementById('toast-container');

        // Usage modal
        this.usageBtn = document.getElementById('usage-btn');
        this.usageModal = document.getElementById('usage-modal');
        this.closeUsageBtn = document.getElementById('close-usage');
        this.closeUsageBtnFooter = document.getElementById('close-usage-btn');
        this.resetUsageBtn = document.getElementById('reset-usage');
    }

    /**
     * Initialize event listeners
     */
    initializeEventListeners() {
        // File upload
        this.dropZone.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

        // Drag and drop
        this.dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.dropZone.classList.add('drag-over');
        });

        this.dropZone.addEventListener('dragleave', () => {
            this.dropZone.classList.remove('drag-over');
        });

        this.dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.dropZone.classList.remove('drag-over');
            const file = e.dataTransfer.files[0];
            if (file && file.type === 'application/pdf') {
                this.processFile(file);
            } else {
                this.showToast('Please drop a PDF file', 'error');
            }
        });

        // Player controls
        this.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
        this.stopBtn.addEventListener('click', () => this.stop());
        this.prevSectionBtn.addEventListener('click', () => this.previousSection());
        this.nextSectionBtn.addEventListener('click', () => this.nextSection());
        this.speedSelect.addEventListener('change', (e) => this.setSpeed(parseFloat(e.target.value)));
        this.voiceSelect.addEventListener('change', (e) => this.setVoice(e.target.value));

        // New document
        this.newDocumentBtn.addEventListener('click', () => this.resetToUpload());

        // Download audio
        this.downloadAudioBtn.addEventListener('click', () => this.downloadFullAudio());

        // Mode toggle
        this.modeFullBtn.addEventListener('click', () => this.setMode('full'));
        this.modeSummaryBtn.addEventListener('click', () => this.setMode('summary'));

        // Settings
        this.settingsBtn.addEventListener('click', () => this.openSettings());
        this.closeSettingsBtn.addEventListener('click', () => this.closeSettings());
        this.saveSettingsBtn.addEventListener('click', () => this.saveSettings());
        this.settingsModal.querySelector('.modal-backdrop').addEventListener('click', () => this.closeSettings());
        this.openSettingsLink?.addEventListener('click', () => this.openSettings());

        // TTS provider toggle
        this.ttsProviderRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.toggleOpenAISettings(e.target.value === 'openai');
            });
        });

        // API key visibility toggles
        this.setupApiKeyToggle('toggle-openai-key', 'openai-key-input');
        this.setupApiKeyToggle('toggle-openrouter-key', 'openrouter-key-input');

        // Usage modal
        this.usageBtn.addEventListener('click', () => this.openUsageModal());
        this.closeUsageBtn.addEventListener('click', () => this.closeUsageModal());
        this.closeUsageBtnFooter.addEventListener('click', () => this.closeUsageModal());
        this.resetUsageBtn.addEventListener('click', () => this.resetUsage());
        this.usageModal.querySelector('.modal-backdrop').addEventListener('click', () => this.closeUsageModal());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            if (e.code === 'Space') {
                e.preventDefault();
                this.togglePlayPause();
            } else if (e.code === 'ArrowLeft') {
                this.previousSection();
            } else if (e.code === 'ArrowRight') {
                this.nextSection();
            } else if (e.code === 'Escape') {
                this.stop();
            }
        });
    }

    /**
     * Setup API key visibility toggle
     */
    setupApiKeyToggle(buttonId, inputId) {
        const button = document.getElementById(buttonId);
        const input = document.getElementById(inputId);

        if (button && input) {
            button.addEventListener('click', () => {
                input.type = input.type === 'password' ? 'text' : 'password';
            });
        }
    }

    /**
     * Toggle OpenAI TTS settings visibility
     */
    toggleOpenAISettings(show) {
        if (show) {
            this.openaiTtsSettings.classList.remove('hidden');
        } else {
            this.openaiTtsSettings.classList.add('hidden');
        }
    }

    /**
     * Initialize TTS callbacks and voices
     */
    initializeTTS() {
        if (!TextToSpeech.isSupported()) {
            this.showToast('Text-to-speech is not supported in your browser', 'error');
            return;
        }

        const populateVoices = () => {
            const voices = this.tts.getVoices();
            this.voiceSelect.innerHTML = '<option value="">Default</option>';

            voices.forEach(voice => {
                const option = document.createElement('option');
                option.value = voice.name;
                option.textContent = `${voice.name} (${voice.lang})`;
                this.voiceSelect.appendChild(option);
            });

            if (this.settings.browserVoice) {
                this.voiceSelect.value = this.settings.browserVoice;
                this.tts.setVoice(this.settings.browserVoice);
            }
        };

        if (this.tts.getVoices().length > 0) {
            populateVoices();
        } else {
            window.speechSynthesis.onvoiceschanged = populateVoices;
        }

        // TTS callbacks
        this.tts.onStart = () => {
            this.isPlaying = true;
            this.updatePlayPauseButton();
        };

        this.tts.onEnd = () => {
            this.isPlaying = false;
            this.updatePlayPauseButton();

            if (this.settings.autoPlay && this.currentSectionIndex < this.sections.length - 1) {
                this.nextSection();
                this.play();
            } else {
                this.updateSectionDisplay();
            }
        };

        this.tts.onBoundary = (event) => {
            if (this.settings.highlightSentence && this.settings.ttsProvider === 'browser') {
                this.highlightCurrentPosition(event.charIndex);
            }
        };

        this.tts.onError = (event) => {
            console.error('TTS Error:', event);
            this.showToast('Speech synthesis error. Please try again.', 'error');
            this.isPlaying = false;
            this.updatePlayPauseButton();
        };
    }

    /**
     * Handle file selection
     */
    handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            this.processFile(file);
        }
    }

    /**
     * Process uploaded PDF file
     */
    async processFile(file) {
        try {
            this.showSection('processing');
            this.updateProgress(0, 'Loading PDF...');

            const docInfo = await this.pdfParser.loadPDF(file, (percent) => {
                this.updateProgress(percent * 0.3, 'Loading PDF...');
            });

            this.updateProgress(30, 'Extracting text...');
            const pages = await this.pdfParser.extractAllText((page, total) => {
                const percent = 30 + (page / total) * 40;
                this.updateProgress(percent, `Extracting text (page ${page}/${total})...`);
            });

            this.updateProgress(70, 'Analyzing structure...');
            this.sections = this.pdfParser.detectSections(pages);

            this.currentDocument = {
                title: docInfo.title || file.name.replace('.pdf', ''),
                author: docInfo.author,
                totalPages: docInfo.totalPages,
                fileName: file.name
            };

            this.updateProgress(100, 'Complete!');

            await this.delay(500);

            this.showSection('document');
            this.renderDocument();

        } catch (error) {
            console.error('Error processing PDF:', error);
            this.showToast(error.message || 'Failed to process PDF', 'error');
            this.showSection('upload');
        }
    }

    /**
     * Update progress display
     */
    updateProgress(percent, status) {
        this.progressFill.style.width = `${percent}%`;
        this.processingDetail.textContent = status;
    }

    /**
     * Render document after processing
     */
    renderDocument() {
        this.documentTitle.textContent = this.currentDocument.title;

        const totalDuration = this.sections.reduce((sum, s) => sum + s.estimatedDuration, 0);
        this.documentMeta.textContent = `${this.sections.length} sections • ~${Math.round(totalDuration / 60)} min`;

        this.renderSectionsList();
        this.updateApiNotice();

        this.currentSectionIndex = 0;
        this.updateSectionDisplay();
    }

    /**
     * Render sections list
     */
    renderSectionsList() {
        this.sectionsList.innerHTML = '';

        this.sections.forEach((section, index) => {
            const item = document.createElement('div');
            const isExpanded = section.isExpanded || false;

            // In summary mode, create expandable items
            if (this.mode === 'summary') {
                const style = this.settings.summaryStyle || 'clean';
                const isSkipped = section.summarySkipped === true;
                const isCleanMode = style === 'clean';

                item.className = 'section-item expandable' +
                    (index === this.currentSectionIndex ? ' active' : '') +
                    (isExpanded ? ' expanded' : '') +
                    (isSkipped ? ' skipped' : '');
                item.dataset.index = index;

                const duration = this.getSectionDuration(section);
                const processedText = this.getSectionText(section);
                const originalText = section.text;

                // Determine labels based on mode
                const processedLabel = isCleanMode ? 'Clean Text' : 'AI Summary';
                const statusBadge = isSkipped
                    ? '<span class="skip-badge">Skipped</span>'
                    : '';

                // Content for the processed panel
                let processedContent;
                if (isSkipped) {
                    processedContent = '<p class="skipped-text"><em>Section marked as not relevant for audio (author info, references, etc.)</em></p>';
                } else {
                    processedContent = `<p>${processedText.replace(/\n/g, '<br>')}</p>`;
                }

                const isCurrentlyPlaying = this.isPlaying && index === this.currentSectionIndex;

                item.innerHTML = `
                    <div class="section-header">
                        <span class="section-number">${index + 1}</span>
                        <span class="section-title">${section.title}${statusBadge}</span>
                        <span class="section-duration">${isSkipped ? '--' : PDFParser.formatDuration(duration)}</span>
                        ${isCurrentlyPlaying ? '<span class="section-status"><div class="playing-indicator"><span></span><span></span><span></span></div></span>' : ''}
                        <button class="expand-btn" title="Toggle details">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="6 9 12 15 18 9"/>
                            </svg>
                        </button>
                    </div>
                    <div class="section-content">
                        <div class="text-comparison">
                            <div class="text-panel summarized-panel${isSkipped ? ' skipped' : ''}">
                                <h4>${processedLabel}</h4>
                                ${processedContent}
                            </div>
                            <div class="text-panel original-panel">
                                <h4>Original</h4>
                                <p>${originalText.replace(/\n/g, '<br>')}</p>
                            </div>
                        </div>
                    </div>
                `;

                // Header click for selection and playback
                const header = item.querySelector('.section-header');
                header.addEventListener('click', (e) => {
                    if (!e.target.closest('.expand-btn')) {
                        this.selectSection(index);
                    }
                });

                // Expand button click
                const expandBtn = item.querySelector('.expand-btn');
                expandBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggleSectionExpand(index);
                });
            } else {
                // Full text mode - simple items
                item.className = 'section-item' + (index === this.currentSectionIndex ? ' active' : '');
                item.dataset.index = index;

                const duration = this.getSectionDuration(section);
                const isCurrentlyPlaying = this.isPlaying && index === this.currentSectionIndex;

                item.innerHTML = `
                    <span class="section-number">${index + 1}</span>
                    <span class="section-title">${section.title}</span>
                    <span class="section-duration">${PDFParser.formatDuration(duration)}</span>
                    ${isCurrentlyPlaying ? '<span class="section-status"><div class="playing-indicator"><span></span><span></span><span></span></div></span>' : ''}
                `;

                item.addEventListener('click', () => {
                    this.selectSection(index);
                });
            }

            this.sectionsList.appendChild(item);
        });
    }

    /**
     * Toggle section expand/collapse
     */
    toggleSectionExpand(index) {
        if (index >= 0 && index < this.sections.length) {
            this.sections[index].isExpanded = !this.sections[index].isExpanded;
            this.renderSectionsList();
        }
    }

    /**
     * Select a section
     */
    selectSection(index) {
        if (index < 0 || index >= this.sections.length) return;

        const wasPlaying = this.isPlaying;

        if (this.isPlaying) {
            this.tts.stop();
        }

        this.currentSectionIndex = index;
        this.renderSectionsList();
        this.updateSectionDisplay();

        if (wasPlaying) {
            this.play();
        }
    }

    /**
     * Get the appropriate text for a section based on mode and settings
     */
    getSectionText(section) {
        if (this.mode !== 'summary') {
            return section.text;
        }

        const style = this.settings.summaryStyle || 'clean';

        // For AI summarization modes, check if section was skipped
        if ((style === 'brief' || style === 'detailed') && section.summarySkipped) {
            return ''; // Return empty for skipped sections
        }

        if (style === 'clean' && section.cleanText) {
            return section.cleanText;
        } else if ((style === 'brief' || style === 'detailed') && section.summary) {
            return section.summary;
        }

        return section.text;
    }

    /**
     * Check if a section should be skipped during playback
     */
    isSectionSkipped(section) {
        if (this.mode !== 'summary') {
            return false;
        }
        const style = this.settings.summaryStyle || 'clean';
        return (style === 'brief' || style === 'detailed') && section.summarySkipped === true;
    }

    /**
     * Get the estimated duration for a section based on mode and settings
     */
    getSectionDuration(section) {
        if (this.mode !== 'summary') {
            return section.estimatedDuration;
        }

        const style = this.settings.summaryStyle || 'clean';

        if (style === 'clean' && section.cleanTextEstimatedDuration) {
            return section.cleanTextEstimatedDuration;
        } else if ((style === 'brief' || style === 'detailed') && section.summaryEstimatedDuration) {
            return section.summaryEstimatedDuration;
        }

        return section.estimatedDuration;
    }

    /**
     * Update the current section text display
     */
    updateSectionDisplay() {
        const section = this.sections[this.currentSectionIndex];
        if (!section) return;

        let text = this.getSectionText(section);
        text = text.replace(/\n/g, '<br>');

        this.currentTextDisplay.innerHTML = `<p>${text}</p>`;
    }

    /**
     * Highlight current position in text
     */
    highlightCurrentPosition(charIndex) {
        const section = this.sections[this.currentSectionIndex];
        if (!section) return;

        let text = this.getSectionText(section);

        let start = charIndex;
        let end = charIndex;

        while (start > 0 && !/[.!?]\s/.test(text.slice(start - 2, start))) {
            start--;
        }

        while (end < text.length && !/[.!?]/.test(text[end])) {
            end++;
        }
        if (end < text.length) end++;

        const before = text.slice(0, start);
        const highlighted = text.slice(start, end);
        const after = text.slice(end);

        this.currentTextDisplay.innerHTML = `<p>${before.replace(/\n/g, '<br>')}<span class="highlight">${highlighted.replace(/\n/g, '<br>')}</span>${after.replace(/\n/g, '<br>')}</p>`;

        const highlightEl = this.currentTextDisplay.querySelector('.highlight');
        if (highlightEl) {
            highlightEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    /**
     * Toggle play/pause
     */
    togglePlayPause() {
        if (this.sections.length === 0) return;

        if (this.tts.isPlaying) {
            if (this.tts.isPaused) {
                this.tts.resume();
            } else {
                this.tts.pause();
            }
            this.updatePlayPauseButton();
        } else {
            this.play();
        }
    }

    /**
     * Start playing current section
     */
    async play() {
        const section = this.sections[this.currentSectionIndex];
        if (!section) return;

        // Skip over skipped sections automatically
        if (this.isSectionSkipped(section)) {
            if (this.currentSectionIndex < this.sections.length - 1) {
                this.currentSectionIndex++;
                this.renderSectionsList();
                this.updateSectionDisplay();
                this.play(); // Recurse to play next section
            }
            return;
        }

        let text = this.getSectionText(section);
        text = TextToSpeech.preprocessText(text);

        this.isPlaying = true;
        this.updatePlayPauseButton();
        this.renderSectionsList();

        // Track TTS usage if using OpenAI TTS
        if (this.settings.ttsProvider === 'openai') {
            this.trackOpenAIUsage(text);
        }

        try {
            await this.tts.speak(text);
        } catch (error) {
            console.error('Playback error:', error);
            this.showToast(error.message || 'Playback failed', 'error');
        }
    }

    /**
     * Stop playback
     */
    stop() {
        this.tts.stop();
        this.isPlaying = false;
        this.updatePlayPauseButton();
        this.renderSectionsList();
        this.updateSectionDisplay();
    }

    /**
     * Download full audio as MP3
     */
    async downloadFullAudio() {
        // Check if OpenAI TTS is configured
        if (!this.tts.canDownloadAudio()) {
            this.showToast('MP3 download requires OpenAI TTS. Enable it in Settings and add your API key.', 'warning');
            this.openSettings();
            return;
        }

        if (this.sections.length === 0) {
            this.showToast('No document loaded', 'error');
            return;
        }

        // Stop any current playback
        this.stop();

        // Disable the download button during processing
        this.downloadAudioBtn.disabled = true;
        this.downloadAudioBtn.innerHTML = `
            <svg class="spinner-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" stroke-dasharray="60" stroke-dashoffset="20"/>
            </svg>
            Generating...
        `;

        try {
            this.showToast('Generating audio... This may take a few minutes.', 'info');

            // Collect all section texts, filtering out skipped sections
            const texts = this.sections
                .filter(section => !this.isSectionSkipped(section))
                .map(section => {
                    const text = this.getSectionText(section);
                    return TextToSpeech.preprocessText(text);
                });

            // Track TTS usage for all texts (join all texts to get total character count)
            const allText = texts.join(' ');
            this.trackOpenAIUsage(allText);

            // Generate full audio with progress updates
            const audioBlob = await this.tts.generateFullAudio(texts, (current, total) => {
                this.downloadAudioBtn.innerHTML = `
                    <svg class="spinner-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10" stroke-dasharray="60" stroke-dashoffset="20"/>
                    </svg>
                    ${current}/${total}
                `;
            });

            // Create download link
            const url = URL.createObjectURL(audioBlob);
            const a = document.createElement('a');
            a.href = url;
            const filename = this.currentDocument?.title
                ? `${this.currentDocument.title.replace(/[^a-z0-9]/gi, '_').substring(0, 50)}.mp3`
                : 'document.mp3';
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.showToast('MP3 downloaded successfully!', 'success');

        } catch (error) {
            console.error('Download error:', error);
            this.showToast(error.message || 'Failed to generate audio', 'error');
        } finally {
            // Restore download button
            this.downloadAudioBtn.disabled = false;
            this.downloadAudioBtn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Download MP3
            `;
        }
    }

    /**
     * Go to previous section
     */
    previousSection() {
        if (this.currentSectionIndex > 0) {
            this.selectSection(this.currentSectionIndex - 1);
        }
    }

    /**
     * Go to next section
     */
    nextSection() {
        if (this.currentSectionIndex < this.sections.length - 1) {
            this.selectSection(this.currentSectionIndex + 1);
        }
    }

    /**
     * Update play/pause button state
     */
    updatePlayPauseButton() {
        if (this.tts.isPlaying && !this.tts.isPaused) {
            this.playIcon.classList.add('hidden');
            this.pauseIcon.classList.remove('hidden');
        } else {
            this.playIcon.classList.remove('hidden');
            this.pauseIcon.classList.add('hidden');
        }
    }

    /**
     * Set playback speed
     */
    setSpeed(rate) {
        this.tts.setRate(rate);
        this.settings.speed = rate;
        this.saveSettingsToStorage();
    }

    /**
     * Set browser voice
     */
    setVoice(voiceName) {
        if (voiceName) {
            this.tts.setVoice(voiceName);
            this.settings.browserVoice = voiceName;
            this.saveSettingsToStorage();
        }
    }

    /**
     * Set reading mode
     */
    async setMode(mode) {
        if (mode === this.mode) return;

        const wasPlaying = this.isPlaying;
        if (this.isPlaying) {
            this.stop();
        }

        if (mode === 'summary') {
            const style = this.settings.summaryStyle || 'clean';

            if (style === 'clean') {
                // Clean text mode - no API needed, process locally
                this.mode = mode;
                this.modeFullBtn.classList.toggle('active', mode === 'full');
                this.modeSummaryBtn.classList.toggle('active', mode === 'summary');
                this.generateCleanText();
            } else {
                // AI summarization modes - need API key
                if (!this.api.hasApiKey()) {
                    this.updateApiNotice();
                    this.showToast('Please add your OpenRouter API key in settings to use AI summarization', 'warning');
                    return;
                }

                const needsSummarization = this.sections.some(s => !s.summary && !s.summaryError);

                if (needsSummarization) {
                    // Show cost estimate and get confirmation
                    const confirmed = await this.showCostConfirmation(style);
                    if (!confirmed) {
                        return; // User cancelled
                    }

                    this.mode = mode;
                    this.modeFullBtn.classList.toggle('active', mode === 'full');
                    this.modeSummaryBtn.classList.toggle('active', mode === 'summary');
                    await this.generateSummaries();
                } else {
                    // Already summarized, just switch mode
                    this.mode = mode;
                    this.modeFullBtn.classList.toggle('active', mode === 'full');
                    this.modeSummaryBtn.classList.toggle('active', mode === 'summary');
                }
            }
        } else {
            this.mode = mode;
            this.modeFullBtn.classList.toggle('active', mode === 'full');
            this.modeSummaryBtn.classList.toggle('active', mode === 'summary');
        }

        this.updateApiNotice();
        this.renderSectionsList();
        this.updateSectionDisplay();

        if (wasPlaying) {
            this.play();
        }
    }

    /**
     * Show cost confirmation dialog before AI summarization
     * @param {string} style - 'brief' or 'detailed'
     * @returns {Promise<boolean>} - true if confirmed, false if cancelled
     */
    async showCostConfirmation(style) {
        const modelId = this.settings.aiModel || 'anthropic/claude-sonnet-4';
        const estimate = OpenRouterAPI.estimateCost(this.sections, modelId, style);

        if (estimate.error) {
            this.showToast('Could not estimate cost: ' + estimate.error, 'error');
            return false;
        }
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'modal cost-confirm-modal';
            modal.innerHTML = `
                <div class="modal-backdrop"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Confirm AI Summarization</h2>
                    </div>
                    <div class="modal-body">
                        <div class="cost-estimate">
                            <div class="cost-row">
                                <span class="cost-label">Model:</span>
                                <span class="cost-value">${estimate.model}</span>
                            </div>
                            <div class="cost-row">
                                <span class="cost-label">Sections:</span>
                                <span class="cost-value">${estimate.sections}</span>
                            </div>
                            <div class="cost-row">
                                <span class="cost-label">Estimated tokens:</span>
                                <span class="cost-value">~${estimate.totalTokens.toLocaleString()}</span>
                            </div>
                            <div class="cost-row cost-total">
                                <span class="cost-label">Estimated cost:</span>
                                <span class="cost-value">${estimate.formattedCost}</span>
                            </div>
                        </div>
                        <p class="cost-note">This is an estimate. Actual cost may vary based on content length.</p>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary cancel-btn">Cancel</button>
                        <button class="btn btn-primary confirm-btn">Proceed</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            const cleanup = (result) => {
                modal.remove();
                resolve(result);
            };

            modal.querySelector('.cancel-btn').addEventListener('click', () => cleanup(false));
            modal.querySelector('.confirm-btn').addEventListener('click', () => cleanup(true));
            modal.querySelector('.modal-backdrop').addEventListener('click', () => cleanup(false));
        });
    }

    /**
     * Generate clean text versions of all sections (no API needed)
     */
    generateCleanText() {
        this.sections = this.sections.map(section => {
            if (!section.cleanText) {
                const cleanText = PDFParser.cleanTextForTTS(section.text);
                return {
                    ...section,
                    cleanText,
                    cleanTextWordCount: cleanText.split(/\s+/).length,
                    cleanTextEstimatedDuration: Math.round((cleanText.split(/\s+/).length / 150) * 60)
                };
            }
            return section;
        });

        this.showToast('Text cleaned for audio playback', 'success');
    }

    /**
     * Generate summaries for all sections
     */
    async generateSummaries() {
        const style = this.settings.summaryStyle || 'brief';

        // Show progress bar
        this.showSummarizationProgress(true);
        this.updateSummarizationProgress(0, this.sections.length, 'Starting summarization...');

        try {
            this.sections = await this.api.summarizeSections(
                this.sections,
                style,
                (current, total, summarizedSection) => {
                    let sectionTitle = summarizedSection.title || `Section ${current}`;
                    // Truncate long titles
                    if (sectionTitle.length > 40) {
                        sectionTitle = sectionTitle.substring(0, 37) + '...';
                    }
                    this.updateSummarizationProgress(current, total, `Summarizing: ${sectionTitle}`);

                    // Track usage for successful summarizations
                    if (summarizedSection.summary && !summarizedSection.summaryError) {
                        this.trackOpenRouterUsage(summarizedSection.text, summarizedSection.summary);
                    }
                }
            );

            this.showToast('Summaries generated successfully', 'success');
        } catch (error) {
            console.error('Summarization error:', error);
            this.showToast('Failed to generate some summaries: ' + error.message, 'error');
        } finally {
            // Hide progress bar
            this.showSummarizationProgress(false);
        }
    }

    /**
     * Show or hide the summarization progress bar
     * @param {boolean} show - Whether to show the progress bar
     */
    showSummarizationProgress(show) {
        if (show) {
            this.summarizationProgress.classList.remove('hidden');
        } else {
            this.summarizationProgress.classList.add('hidden');
        }
    }

    /**
     * Update the summarization progress bar
     * @param {number} current - Current section number
     * @param {number} total - Total sections
     * @param {string} text - Progress text
     */
    updateSummarizationProgress(current, total, text) {
        const percent = total > 0 ? (current / total) * 100 : 0;
        this.progressFillBar.style.width = `${percent}%`;
        this.progressCount.textContent = `${current}/${total}`;
        this.progressText.textContent = text;
    }

    /**
     * Update API notice visibility
     */
    updateApiNotice() {
        const style = this.settings.summaryStyle || 'clean';
        // Only show API notice if in summary mode with AI summarization (not clean text)
        const needsApi = this.mode === 'summary' && style !== 'clean' && !this.api.hasApiKey();

        if (needsApi) {
            this.apiNotice.classList.remove('hidden');
        } else {
            this.apiNotice.classList.add('hidden');
        }
    }

    /**
     * Show a specific section
     */
    showSection(section) {
        this.uploadSection.classList.add('hidden');
        this.processingSection.classList.add('hidden');
        this.documentSection.classList.add('hidden');

        switch (section) {
            case 'upload':
                this.uploadSection.classList.remove('hidden');
                break;
            case 'processing':
                this.processingSection.classList.remove('hidden');
                break;
            case 'document':
                this.documentSection.classList.remove('hidden');
                break;
        }
    }

    /**
     * Reset to upload screen
     */
    resetToUpload() {
        this.stop();
        this.currentDocument = null;
        this.sections = [];
        this.currentSectionIndex = 0;
        this.mode = 'full';
        this.modeFullBtn.classList.add('active');
        this.modeSummaryBtn.classList.remove('active');
        this.fileInput.value = '';
        this.showSection('upload');
    }

    /**
     * Open settings modal
     */
    openSettings() {
        // TTS Provider
        const ttsProvider = this.settings.ttsProvider || 'browser';
        document.querySelector(`input[name="tts-provider"][value="${ttsProvider}"]`).checked = true;
        this.toggleOpenAISettings(ttsProvider === 'openai');

        // OpenAI TTS settings
        this.openaiKeyInput.value = this.settings.openaiKey || '';
        this.openaiVoiceSelect.value = this.settings.openaiVoice || 'nova';
        this.openaiModelSelect.value = this.settings.openaiModel || 'tts-1';

        // OpenRouter settings
        this.openrouterKeyInput.value = this.settings.openrouterKey || '';
        this.modelSelect.value = this.settings.aiModel || 'anthropic/claude-sonnet-4';

        // Other settings
        document.querySelector(`input[name="summary-style"][value="${this.settings.summaryStyle || 'brief'}"]`).checked = true;
        document.getElementById('auto-play-toggle').checked = this.settings.autoPlay !== false;
        document.getElementById('highlight-toggle').checked = this.settings.highlightSentence !== false;

        this.settingsModal.classList.remove('hidden');
    }

    /**
     * Close settings modal
     */
    closeSettings() {
        this.settingsModal.classList.add('hidden');
    }

    /**
     * Save settings
     */
    saveSettings() {
        // TTS Provider
        const ttsProvider = document.querySelector('input[name="tts-provider"]:checked').value;

        // OpenAI TTS settings
        const openaiKey = this.openaiKeyInput.value.trim();
        const openaiVoice = this.openaiVoiceSelect.value;
        const openaiModel = this.openaiModelSelect.value;

        // OpenRouter settings
        const openrouterKey = this.openrouterKeyInput.value.trim();
        const aiModel = this.modelSelect.value;

        // Other settings
        const summaryStyle = document.querySelector('input[name="summary-style"]:checked').value;
        const autoPlay = document.getElementById('auto-play-toggle').checked;
        const highlightSentence = document.getElementById('highlight-toggle').checked;

        // Validate OpenAI key if using OpenAI TTS
        if (ttsProvider === 'openai' && openaiKey && !openaiKey.startsWith('sk-')) {
            this.showToast('Invalid OpenAI API key format', 'error');
            return;
        }

        // Validate OpenRouter key if provided
        if (openrouterKey && !OpenRouterAPI.validateKeyFormat(openrouterKey)) {
            this.showToast('Invalid OpenRouter API key format. Keys should start with "sk-or-"', 'error');
            return;
        }

        // Update settings
        this.settings.ttsProvider = ttsProvider;
        this.settings.openaiKey = openaiKey;
        this.settings.openaiVoice = openaiVoice;
        this.settings.openaiModel = openaiModel;
        this.settings.openrouterKey = openrouterKey;
        this.settings.aiModel = aiModel;
        this.settings.summaryStyle = summaryStyle;
        this.settings.autoPlay = autoPlay;
        this.settings.highlightSentence = highlightSentence;

        // Apply to services
        this.tts.setProvider(ttsProvider);
        this.tts.setOpenAIKey(openaiKey);
        this.tts.setOpenAIVoice(openaiVoice);
        this.tts.setOpenAIModel(openaiModel);

        this.api.setApiKey(openrouterKey);
        this.api.setModel(aiModel);

        // Save to storage
        this.saveSettingsToStorage();

        this.closeSettings();
        this.showToast('Settings saved', 'success');

        // Update API notice
        this.updateApiNotice();
    }

    /**
     * Load settings from localStorage
     */
    loadSettings() {
        try {
            const saved = localStorage.getItem('pdf-to-audio-settings');
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }

        return {
            ttsProvider: 'browser',
            openaiKey: '',
            openaiVoice: 'nova',
            openaiModel: 'tts-1',
            openrouterKey: '',
            aiModel: 'anthropic/claude-sonnet-4',
            summaryStyle: 'clean',
            autoPlay: true,
            highlightSentence: true,
            speed: 1,
            browserVoice: ''
        };
    }

    /**
     * Save settings to localStorage
     */
    saveSettingsToStorage() {
        try {
            localStorage.setItem('pdf-to-audio-settings', JSON.stringify(this.settings));
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }

    /**
     * Apply loaded settings
     */
    applySettings() {
        // Apply TTS provider settings
        this.tts.setProvider(this.settings.ttsProvider || 'browser');

        if (this.settings.openaiKey) {
            this.tts.setOpenAIKey(this.settings.openaiKey);
        }
        if (this.settings.openaiVoice) {
            this.tts.setOpenAIVoice(this.settings.openaiVoice);
        }
        if (this.settings.openaiModel) {
            this.tts.setOpenAIModel(this.settings.openaiModel);
        }

        // Apply OpenRouter settings
        if (this.settings.openrouterKey) {
            this.api.setApiKey(this.settings.openrouterKey);
        }
        if (this.settings.aiModel) {
            this.api.setModel(this.settings.aiModel);
        }

        // Apply speed
        if (this.settings.speed) {
            this.speedSelect.value = this.settings.speed;
            this.tts.setRate(this.settings.speed);
        }
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icons = {
            success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
            error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
            warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
            info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
        };

        toast.innerHTML = `${icons[type] || icons.info}<span>${message}</span>`;

        this.toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('toast-exit');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    /**
     * Open usage modal and update display
     */
    openUsageModal() {
        this.updateUsageDisplay();
        this.usageModal.classList.remove('hidden');
    }

    /**
     * Close usage modal
     */
    closeUsageModal() {
        this.usageModal.classList.add('hidden');
    }

    /**
     * Reset usage statistics
     */
    resetUsage() {
        if (confirm('Are you sure you want to reset all usage statistics?')) {
            usageTracker.reset();
            this.updateUsageDisplay();
            this.showToast('Usage statistics reset', 'success');
        }
    }

    /**
     * Update the usage display in the modal
     */
    updateUsageDisplay() {
        const openrouterSummary = usageTracker.getOpenRouterSummary();
        const openaiSummary = usageTracker.getOpenAISummary();
        const costs = usageTracker.calculateCosts(OpenRouterAPI.getAvailableModels());

        // Update OpenRouter stats
        document.getElementById('or-requests').textContent = UsageTracker.formatNumber(openrouterSummary.totalRequests);
        document.getElementById('or-input-tokens').textContent = UsageTracker.formatNumber(openrouterSummary.totalInputTokens);
        document.getElementById('or-output-tokens').textContent = UsageTracker.formatNumber(openrouterSummary.totalOutputTokens);
        document.getElementById('or-cost').textContent = UsageTracker.formatCost(costs.openrouter.total);

        // Update OpenAI stats
        document.getElementById('oa-requests').textContent = UsageTracker.formatNumber(openaiSummary.totalRequests);
        document.getElementById('oa-characters').textContent = UsageTracker.formatNumber(openaiSummary.totalCharacters);
        document.getElementById('oa-cost').textContent = UsageTracker.formatCost(costs.openai.total);

        // Update total cost
        document.getElementById('total-cost').textContent = UsageTracker.formatCost(costs.grandTotal);

        // Update OpenRouter breakdown
        const orBreakdown = document.getElementById('or-breakdown');
        if (Object.keys(costs.openrouter.byModel).length > 0) {
            let html = '<div class="breakdown-title">By Model</div>';
            for (const [modelId, data] of Object.entries(costs.openrouter.byModel)) {
                html += `
                    <div class="breakdown-item">
                        <span class="model-name">${data.name}</span>
                        <span class="model-cost">${UsageTracker.formatCost(data.totalCost)}</span>
                    </div>
                `;
            }
            orBreakdown.innerHTML = html;
        } else {
            orBreakdown.innerHTML = '';
        }

        // Update OpenAI breakdown
        const oaBreakdown = document.getElementById('oa-breakdown');
        if (Object.keys(costs.openai.byModel).length > 0) {
            let html = '<div class="breakdown-title">By Model</div>';
            for (const [model, data] of Object.entries(costs.openai.byModel)) {
                html += `
                    <div class="breakdown-item">
                        <span class="model-name">${data.name}</span>
                        <span class="model-cost">${UsageTracker.formatCost(data.cost)}</span>
                    </div>
                `;
            }
            oaBreakdown.innerHTML = html;
        } else {
            oaBreakdown.innerHTML = '';
        }

        // Update last updated time
        const lastUpdated = usageTracker.getLastUpdated();
        const lastUpdatedEl = document.getElementById('last-updated');
        if (lastUpdated) {
            const date = new Date(lastUpdated);
            lastUpdatedEl.textContent = `Last updated: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
        } else {
            lastUpdatedEl.textContent = '';
        }
    }

    /**
     * Track OpenRouter usage for a summarization request
     */
    trackOpenRouterUsage(text, outputText) {
        const model = this.settings.aiModel || 'anthropic/claude-sonnet-4';
        const inputTokens = OpenRouterAPI.estimateTokens(text) + 200; // Add prompt overhead
        const outputTokens = OpenRouterAPI.estimateTokens(outputText);
        usageTracker.trackOpenRouter(model, inputTokens, outputTokens);
    }

    /**
     * Track OpenAI TTS usage
     */
    trackOpenAIUsage(text) {
        const model = this.settings.openaiModel || 'tts-1';
        usageTracker.trackOpenAI(model, text.length);
    }

    /**
     * Register service worker for PWA
     */
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/pwa/paper2audio/service-worker.js');
                console.log('Service Worker registered:', registration.scope);
            } catch (error) {
                console.log('Service Worker registration failed:', error);
            }
        }
    }

    /**
     * Helper delay function
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new PDFToAudioApp();
});
