/**
 * Text-to-Speech Module
 * Supports Web Speech API (free) and OpenAI TTS (realistic)
 */

export class TextToSpeech {
    constructor() {
        // Web Speech API
        this.synth = window.speechSynthesis;
        this.utterance = null;
        this.voices = [];
        this.currentVoice = null;
        this.rate = 1;

        // OpenAI TTS
        this.openaiApiKey = null;
        this.openaiVoice = 'alloy'; // alloy, echo, fable, onyx, nova, shimmer
        this.openaiModel = 'tts-1'; // tts-1 or tts-1-hd

        // Provider: 'browser' or 'openai'
        this.provider = 'browser';

        // State
        this.isPlaying = false;
        this.isPaused = false;
        this.audioElement = null;
        this.audioQueue = [];
        this.currentAudioIndex = 0;

        // Callbacks
        this.onStart = null;
        this.onEnd = null;
        this.onPause = null;
        this.onResume = null;
        this.onBoundary = null;
        this.onError = null;

        // Current state
        this.currentText = '';
        this.currentCharIndex = 0;

        // Initialize voices
        this.loadVoices();

        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = () => this.loadVoices();
        }
    }

    /**
     * Set the TTS provider
     * @param {string} provider - 'browser' or 'openai'
     */
    setProvider(provider) {
        this.provider = provider;
    }

    /**
     * Set OpenAI API key
     * @param {string} key - OpenAI API key
     */
    setOpenAIKey(key) {
        this.openaiApiKey = key;
    }

    /**
     * Set OpenAI voice
     * @param {string} voice - Voice name (alloy, echo, fable, onyx, nova, shimmer)
     */
    setOpenAIVoice(voice) {
        this.openaiVoice = voice;
    }

    /**
     * Set OpenAI model
     * @param {string} model - Model name (tts-1 or tts-1-hd)
     */
    setOpenAIModel(model) {
        this.openaiModel = model;
    }

    /**
     * Get available OpenAI voices
     * @returns {Array}
     */
    static getOpenAIVoices() {
        return [
            { id: 'alloy', name: 'Alloy', description: 'Neutral, balanced' },
            { id: 'echo', name: 'Echo', description: 'Warm, conversational' },
            { id: 'fable', name: 'Fable', description: 'Expressive, storytelling' },
            { id: 'onyx', name: 'Onyx', description: 'Deep, authoritative' },
            { id: 'nova', name: 'Nova', description: 'Friendly, upbeat' },
            { id: 'shimmer', name: 'Shimmer', description: 'Clear, gentle' }
        ];
    }

    /**
     * Load browser voices
     */
    loadVoices() {
        this.voices = this.synth.getVoices();

        this.voices.sort((a, b) => {
            const aEnglish = a.lang.startsWith('en');
            const bEnglish = b.lang.startsWith('en');

            if (aEnglish && !bEnglish) return -1;
            if (!aEnglish && bEnglish) return 1;

            return a.name.localeCompare(b.name);
        });

        if (!this.currentVoice && this.voices.length > 0) {
            this.currentVoice = this.voices.find(v =>
                v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Microsoft'))
            ) || this.voices.find(v => v.lang.startsWith('en')) || this.voices[0];
        }

        return this.voices;
    }

    /**
     * Get list of available browser voices
     * @returns {Array}
     */
    getVoices() {
        if (this.voices.length === 0) {
            this.loadVoices();
        }
        return this.voices;
    }

    /**
     * Set the browser voice to use
     * @param {string} voiceName - Name of the voice
     */
    setVoice(voiceName) {
        const voice = this.voices.find(v => v.name === voiceName);
        if (voice) {
            this.currentVoice = voice;
        }
    }

    /**
     * Set the speaking rate
     * @param {number} rate - Rate from 0.1 to 10 (default 1)
     */
    setRate(rate) {
        this.rate = Math.max(0.1, Math.min(10, rate));
    }

    /**
     * Speak text using configured provider
     * @param {string} text - Text to speak
     * @returns {Promise}
     */
    speak(text) {
        if (this.provider === 'openai') {
            return this.speakOpenAI(text);
        }
        return this.speakBrowser(text);
    }

    /**
     * Speak using browser Web Speech API
     * @param {string} text - Text to speak
     * @returns {Promise}
     */
    speakBrowser(text) {
        return new Promise((resolve, reject) => {
            if (!text || text.trim().length === 0) {
                resolve();
                return;
            }

            this.stop();

            this.currentText = text;
            this.currentCharIndex = 0;

            this.utterance = new SpeechSynthesisUtterance(text);

            if (this.currentVoice) {
                this.utterance.voice = this.currentVoice;
            }

            this.utterance.rate = this.rate;
            this.utterance.pitch = 1;
            this.utterance.volume = 1;

            this.utterance.onstart = () => {
                this.isPlaying = true;
                this.isPaused = false;
                if (this.onStart) this.onStart();
            };

            this.utterance.onend = () => {
                this.isPlaying = false;
                this.isPaused = false;
                if (this.onEnd) this.onEnd();
                resolve();
            };

            this.utterance.onpause = () => {
                this.isPaused = true;
                if (this.onPause) this.onPause();
            };

            this.utterance.onresume = () => {
                this.isPaused = false;
                if (this.onResume) this.onResume();
            };

            this.utterance.onboundary = (event) => {
                this.currentCharIndex = event.charIndex;
                if (this.onBoundary) this.onBoundary(event);
            };

            this.utterance.onerror = (event) => {
                if (event.error !== 'interrupted' && event.error !== 'canceled') {
                    this.isPlaying = false;
                    this.isPaused = false;
                    if (this.onError) this.onError(event);
                    reject(event);
                }
            };

            this.synth.speak(this.utterance);
        });
    }

    /**
     * Speak using OpenAI TTS API
     * @param {string} text - Text to speak
     * @returns {Promise}
     */
    async speakOpenAI(text) {
        if (!text || text.trim().length === 0) {
            return;
        }

        if (!this.openaiApiKey) {
            throw new Error('OpenAI API key not set');
        }

        this.stop();
        this.currentText = text;
        this.isPlaying = true;
        this.isPaused = false;

        if (this.onStart) this.onStart();

        try {
            // OpenAI TTS has a 4096 character limit, so we may need to chunk
            const chunks = this.chunkText(text, 4000);
            this.audioQueue = [];

            // Generate all audio chunks
            for (const chunk of chunks) {
                const audioBlob = await this.generateOpenAIAudio(chunk);
                this.audioQueue.push(audioBlob);
            }

            // Play audio sequentially
            await this.playAudioQueue();

        } catch (error) {
            this.isPlaying = false;
            this.isPaused = false;
            if (this.onError) this.onError(error);
            throw error;
        }
    }

    /**
     * Generate audio from OpenAI TTS API
     * @param {string} text - Text to convert
     * @returns {Promise<Blob>}
     */
    async generateOpenAIAudio(text) {
        const response = await fetch('https://api.openai.com/v1/audio/speech', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.openaiApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: this.openaiModel,
                input: text,
                voice: this.openaiVoice,
                speed: this.rate
            })
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error?.message || `OpenAI TTS failed: ${response.status}`);
        }

        return await response.blob();
    }

    /**
     * Play queued audio blobs
     * @returns {Promise}
     */
    async playAudioQueue() {
        for (let i = 0; i < this.audioQueue.length; i++) {
            if (!this.isPlaying) break;

            this.currentAudioIndex = i;
            await this.playAudioBlob(this.audioQueue[i]);
        }

        this.isPlaying = false;
        this.isPaused = false;
        if (this.onEnd) this.onEnd();
    }

    /**
     * Play a single audio blob
     * @param {Blob} blob - Audio blob
     * @returns {Promise}
     */
    playAudioBlob(blob) {
        return new Promise((resolve, reject) => {
            const url = URL.createObjectURL(blob);
            this.audioElement = new Audio(url);
            this.audioElement.playbackRate = 1; // Speed already applied in API

            this.audioElement.onended = () => {
                URL.revokeObjectURL(url);
                resolve();
            };

            this.audioElement.onerror = (e) => {
                URL.revokeObjectURL(url);
                reject(e);
            };

            this.audioElement.play().catch(reject);
        });
    }

    /**
     * Chunk text for OpenAI API limits
     * @param {string} text - Text to chunk
     * @param {number} maxLength - Max characters per chunk
     * @returns {Array<string>}
     */
    chunkText(text, maxLength) {
        const chunks = [];
        const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

        let currentChunk = '';

        for (const sentence of sentences) {
            if (currentChunk.length + sentence.length > maxLength) {
                if (currentChunk) {
                    chunks.push(currentChunk.trim());
                }
                currentChunk = sentence;
            } else {
                currentChunk += sentence;
            }
        }

        if (currentChunk.trim()) {
            chunks.push(currentChunk.trim());
        }

        return chunks;
    }

    /**
     * Pause speech
     */
    pause() {
        if (this.isPlaying && !this.isPaused) {
            if (this.provider === 'openai' && this.audioElement) {
                this.audioElement.pause();
            } else {
                this.synth.pause();
            }
            this.isPaused = true;
            if (this.onPause) this.onPause();
        }
    }

    /**
     * Resume speech
     */
    resume() {
        if (this.isPaused) {
            if (this.provider === 'openai' && this.audioElement) {
                this.audioElement.play();
            } else {
                this.synth.resume();
            }
            this.isPaused = false;
            if (this.onResume) this.onResume();
        }
    }

    /**
     * Toggle play/pause
     */
    toggle() {
        if (this.isPaused) {
            this.resume();
        } else if (this.isPlaying) {
            this.pause();
        }
    }

    /**
     * Stop speech
     */
    stop() {
        if (this.provider === 'openai') {
            if (this.audioElement) {
                this.audioElement.pause();
                this.audioElement.currentTime = 0;
                this.audioElement = null;
            }
            this.audioQueue = [];
        } else {
            this.synth.cancel();
        }

        this.isPlaying = false;
        this.isPaused = false;
        this.currentCharIndex = 0;
    }

    /**
     * Generate audio blob for text without playing (OpenAI only)
     * @param {string} text - Text to convert to audio
     * @returns {Promise<Blob>} - Audio blob
     */
    async generateAudio(text) {
        if (this.provider !== 'openai') {
            throw new Error('Audio download is only available with OpenAI TTS. Please enable OpenAI TTS in settings.');
        }

        if (!this.openaiApiKey) {
            throw new Error('OpenAI API key not set. Please add your API key in settings.');
        }

        if (!text || text.trim().length === 0) {
            throw new Error('No text to convert');
        }

        // Chunk text if needed and generate all audio
        const chunks = this.chunkText(text, 4000);
        const audioBlobs = [];

        for (const chunk of chunks) {
            const audioBlob = await this.generateOpenAIAudio(chunk);
            audioBlobs.push(audioBlob);
        }

        // If only one chunk, return it directly
        if (audioBlobs.length === 1) {
            return audioBlobs[0];
        }

        // Combine multiple audio blobs
        return new Blob(audioBlobs, { type: 'audio/mpeg' });
    }

    /**
     * Generate audio for multiple texts and combine into single file (parallel)
     * @param {Array<string>} texts - Array of texts to convert
     * @param {Function} onProgress - Progress callback (current, total)
     * @param {number} concurrency - Max concurrent requests (default: 3)
     * @returns {Promise<Blob>} - Combined audio blob
     */
    async generateFullAudio(texts, onProgress = null, concurrency = 3) {
        if (this.provider !== 'openai') {
            throw new Error('Audio download is only available with OpenAI TTS. Please enable OpenAI TTS in settings.');
        }

        if (!this.openaiApiKey) {
            throw new Error('OpenAI API key not set. Please add your API key in settings.');
        }

        const results = new Array(texts.length);
        let completedCount = 0;
        const total = texts.length;

        // Process a single text
        const processText = async (text, index) => {
            if (text && text.trim().length > 0) {
                try {
                    const blob = await this.generateAudio(text);
                    results[index] = blob;
                } catch (error) {
                    console.warn(`Failed to generate audio for section ${index}:`, error);
                    results[index] = null;
                }
            } else {
                results[index] = null;
            }

            completedCount++;
            if (onProgress) {
                onProgress(completedCount, total);
            }
        };

        // Process texts with concurrency limit
        await this.parallelLimit(
            texts.map((text, index) => () => processText(text, index)),
            concurrency
        );

        // Filter out null results and combine in order
        const audioBlobs = results.filter(blob => blob !== null);
        return new Blob(audioBlobs, { type: 'audio/mpeg' });
    }

    /**
     * Execute async functions in parallel with concurrency limit
     * @param {Array<Function>} tasks - Array of async functions to execute
     * @param {number} limit - Max concurrent executions
     * @returns {Promise<void>}
     */
    async parallelLimit(tasks, limit) {
        const executing = new Set();

        for (const task of tasks) {
            const promise = task().then(() => executing.delete(promise));
            executing.add(promise);

            if (executing.size >= limit) {
                await Promise.race(executing);
            }
        }

        await Promise.all(executing);
    }

    /**
     * Check if audio download is available (OpenAI TTS configured)
     * @returns {boolean}
     */
    canDownloadAudio() {
        return this.provider === 'openai' && !!this.openaiApiKey;
    }

    /**
     * Check if Web Speech API is supported
     * @returns {boolean}
     */
    static isSupported() {
        return 'speechSynthesis' in window;
    }

    /**
     * Preprocess text for better TTS output
     * @param {string} text - Raw text
     * @returns {string}
     */
    static preprocessText(text) {
        return text
            .replace(/\s+/g, ' ')
            .replace(/(\w)-\s+(\w)/g, '$1$2')
            .replace(/e\.g\./gi, 'for example,')
            .replace(/i\.e\./gi, 'that is,')
            .replace(/et al\./gi, 'and others')
            .replace(/etc\./gi, 'etcetera')
            .replace(/Fig\./gi, 'Figure')
            .replace(/Eq\./gi, 'Equation')
            .replace(/Sec\./gi, 'Section')
            .replace(/(\d+)\s*%/g, '$1 percent')
            .replace(/(\d+)\s*°C/gi, '$1 degrees Celsius')
            .replace(/(\d+)\s*°F/gi, '$1 degrees Fahrenheit')
            .replace(/\[\d+(?:,\s*\d+)*\]/g, '')
            .replace(/https?:\/\/[^\s]+/gi, '')
            .replace(/[\w.-]+@[\w.-]+\.\w+/g, '')
            .replace(/:\s+/g, '. ')
            .replace(/\.{2,}/g, '.')
            .trim();
    }
}
