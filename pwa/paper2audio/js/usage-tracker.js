/**
 * Usage Tracker Module
 * Tracks API usage for OpenRouter and OpenAI TTS
 */

export class UsageTracker {
    constructor() {
        this.storageKey = 'pdf-audio-usage';
        this.usage = this.load();
    }

    /**
     * Load usage data from localStorage
     * @returns {Object}
     */
    load() {
        try {
            const data = localStorage.getItem(this.storageKey);
            if (data) {
                return JSON.parse(data);
            }
        } catch (e) {
            console.warn('Failed to load usage data:', e);
        }
        return this.getDefaultUsage();
    }

    /**
     * Get default usage structure
     * @returns {Object}
     */
    getDefaultUsage() {
        return {
            openrouter: {
                totalInputTokens: 0,
                totalOutputTokens: 0,
                totalRequests: 0,
                byModel: {},
                history: []
            },
            openai: {
                totalCharacters: 0,
                totalRequests: 0,
                byModel: {},
                history: []
            },
            lastUpdated: null
        };
    }

    /**
     * Save usage data to localStorage
     */
    save() {
        try {
            this.usage.lastUpdated = new Date().toISOString();
            localStorage.setItem(this.storageKey, JSON.stringify(this.usage));
        } catch (e) {
            console.warn('Failed to save usage data:', e);
        }
    }

    /**
     * Track OpenRouter API usage
     * @param {string} model - Model ID used
     * @param {number} inputTokens - Estimated input tokens
     * @param {number} outputTokens - Estimated output tokens
     */
    trackOpenRouter(model, inputTokens, outputTokens) {
        this.usage.openrouter.totalInputTokens += inputTokens;
        this.usage.openrouter.totalOutputTokens += outputTokens;
        this.usage.openrouter.totalRequests += 1;

        if (!this.usage.openrouter.byModel[model]) {
            this.usage.openrouter.byModel[model] = {
                inputTokens: 0,
                outputTokens: 0,
                requests: 0
            };
        }
        this.usage.openrouter.byModel[model].inputTokens += inputTokens;
        this.usage.openrouter.byModel[model].outputTokens += outputTokens;
        this.usage.openrouter.byModel[model].requests += 1;

        // Keep last 100 history entries
        this.usage.openrouter.history.push({
            timestamp: new Date().toISOString(),
            model,
            inputTokens,
            outputTokens
        });
        if (this.usage.openrouter.history.length > 100) {
            this.usage.openrouter.history.shift();
        }

        this.save();
    }

    /**
     * Track OpenAI TTS usage
     * @param {string} model - Model used (tts-1 or tts-1-hd)
     * @param {number} characters - Number of characters processed
     */
    trackOpenAI(model, characters) {
        this.usage.openai.totalCharacters += characters;
        this.usage.openai.totalRequests += 1;

        if (!this.usage.openai.byModel[model]) {
            this.usage.openai.byModel[model] = {
                characters: 0,
                requests: 0
            };
        }
        this.usage.openai.byModel[model].characters += characters;
        this.usage.openai.byModel[model].requests += 1;

        // Keep last 100 history entries
        this.usage.openai.history.push({
            timestamp: new Date().toISOString(),
            model,
            characters
        });
        if (this.usage.openai.history.length > 100) {
            this.usage.openai.history.shift();
        }

        this.save();
    }

    /**
     * Get OpenRouter usage summary
     * @returns {Object}
     */
    getOpenRouterSummary() {
        const usage = this.usage.openrouter;
        return {
            totalInputTokens: usage.totalInputTokens,
            totalOutputTokens: usage.totalOutputTokens,
            totalTokens: usage.totalInputTokens + usage.totalOutputTokens,
            totalRequests: usage.totalRequests,
            byModel: usage.byModel
        };
    }

    /**
     * Get OpenAI TTS usage summary
     * @returns {Object}
     */
    getOpenAISummary() {
        const usage = this.usage.openai;
        return {
            totalCharacters: usage.totalCharacters,
            totalRequests: usage.totalRequests,
            byModel: usage.byModel
        };
    }

    /**
     * Calculate estimated costs
     * @param {Array} openrouterModels - Available OpenRouter models with pricing
     * @returns {Object}
     */
    calculateCosts(openrouterModels = []) {
        const costs = {
            openrouter: {
                total: 0,
                byModel: {}
            },
            openai: {
                total: 0,
                byModel: {}
            },
            grandTotal: 0
        };

        // OpenRouter costs
        for (const [modelId, data] of Object.entries(this.usage.openrouter.byModel)) {
            const modelInfo = openrouterModels.find(m => m.id === modelId);
            if (modelInfo) {
                const inputCost = (data.inputTokens / 1_000_000) * modelInfo.inputPrice;
                const outputCost = (data.outputTokens / 1_000_000) * modelInfo.outputPrice;
                const totalCost = inputCost + outputCost;
                costs.openrouter.byModel[modelId] = {
                    name: modelInfo.name,
                    inputCost,
                    outputCost,
                    totalCost
                };
                costs.openrouter.total += totalCost;
            }
        }

        // OpenAI TTS costs (per 1M characters)
        // tts-1: $15/1M chars, tts-1-hd: $30/1M chars
        const ttsRates = {
            'tts-1': 15,
            'tts-1-hd': 30
        };

        for (const [model, data] of Object.entries(this.usage.openai.byModel)) {
            const rate = ttsRates[model] || 15;
            const cost = (data.characters / 1_000_000) * rate;
            costs.openai.byModel[model] = {
                name: model === 'tts-1-hd' ? 'TTS HD' : 'TTS Standard',
                cost
            };
            costs.openai.total += cost;
        }

        costs.grandTotal = costs.openrouter.total + costs.openai.total;
        return costs;
    }

    /**
     * Format number with commas
     * @param {number} num
     * @returns {string}
     */
    static formatNumber(num) {
        return num.toLocaleString();
    }

    /**
     * Format cost as currency
     * @param {number} cost
     * @returns {string}
     */
    static formatCost(cost) {
        if (cost < 0.01) {
            return cost > 0 ? '< $0.01' : '$0.00';
        }
        return `$${cost.toFixed(2)}`;
    }

    /**
     * Reset all usage data
     */
    reset() {
        this.usage = this.getDefaultUsage();
        this.save();
    }

    /**
     * Get last updated timestamp
     * @returns {string|null}
     */
    getLastUpdated() {
        return this.usage.lastUpdated;
    }
}

// Singleton instance
export const usageTracker = new UsageTracker();
