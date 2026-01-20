/**
 * OpenRouter API Module
 * Handles communication with OpenRouter for multi-model summarization
 */

export class OpenRouterAPI {
    constructor(apiKey = null) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://openrouter.ai/api/v1';
        this.model = 'anthropic/claude-sonnet-4.5'; // Default model
        this.siteUrl = window.location.origin;
        this.siteName = 'PDF to Audio';
    }

    /**
     * Available models for selection with pricing (per 1M tokens)
     */
    static getAvailableModels() {
        return [
            {
                id: 'openai/gpt-5.2',
                name: 'ChatGPT 5.2',
                provider: 'OpenAI',
                description: 'Latest GPT-5.2 model',
                inputPrice: 2.50,  // $ per 1M input tokens
                outputPrice: 10.00  // $ per 1M output tokens
            },
            {
                id: 'anthropic/claude-sonnet-4.5',
                name: 'Claude 4.5 Sonnet',
                provider: 'Anthropic',
                description: 'Best for coding and agents',
                inputPrice: 3.00,
                outputPrice: 15.00
            },
            {
                id: 'anthropic/claude-opus-4.5',
                name: 'Claude 4.5 Opus',
                provider: 'Anthropic',
                description: 'Frontier reasoning model',
                inputPrice: 5.00,
                outputPrice: 25.00
            },
            {
                id: 'x-ai/grok-4',
                name: 'Grok 4',
                provider: 'xAI',
                description: 'Latest reasoning model',
                inputPrice: 3.00,
                outputPrice: 15.00
            },
            {
                id: 'x-ai/grok-4-fast',
                name: 'Grok 4 Fast',
                provider: 'xAI',
                description: 'Fast multimodal model',
                inputPrice: 0.60,
                outputPrice: 2.40
            },
            {
                id: 'google/gemini-3-pro-preview',
                name: 'Gemini 3 Pro',
                provider: 'Google',
                description: 'Google\'s flagship model',
                inputPrice: 1.25,
                outputPrice: 5.00
            },
            {
                id: 'meta-llama/llama-4-70b',
                name: 'Llama 4 70B',
                provider: 'Meta',
                description: 'Open source, powerful',
                inputPrice: 0.50,
                outputPrice: 0.75
            }
        ];
    }

    /**
     * Get model by ID
     * @param {string} modelId - Model ID
     * @returns {Object|null}
     */
    static getModelById(modelId) {
        return this.getAvailableModels().find(m => m.id === modelId) || null;
    }

    /**
     * Estimate tokens from text (rough estimate: ~4 chars per token)
     * @param {string} text - Text to estimate
     * @returns {number} Estimated token count
     */
    static estimateTokens(text) {
        if (!text) return 0;
        return Math.ceil(text.length / 4);
    }

    /**
     * Estimate cost for summarizing sections
     * @param {Array} sections - Array of sections with text
     * @param {string} modelId - Model ID to use
     * @param {string} style - 'brief' or 'detailed'
     * @returns {Object} Cost estimate with breakdown
     */
    static estimateCost(sections, modelId, style = 'brief') {
        const model = this.getModelById(modelId);
        if (!model) {
            return { error: 'Model not found' };
        }

        // Calculate total input tokens (text + prompt overhead ~200 tokens per section)
        const promptOverhead = 200;
        let totalInputTokens = 0;

        for (const section of sections) {
            const textTokens = this.estimateTokens(section.text);
            totalInputTokens += textTokens + promptOverhead;
        }

        // Estimate output tokens based on style
        const avgOutputPerSection = style === 'brief' ? 150 : 300;
        const totalOutputTokens = sections.length * avgOutputPerSection;

        // Calculate costs
        const inputCost = (totalInputTokens / 1_000_000) * model.inputPrice;
        const outputCost = (totalOutputTokens / 1_000_000) * model.outputPrice;
        const totalCost = inputCost + outputCost;

        return {
            model: model.name,
            sections: sections.length,
            inputTokens: totalInputTokens,
            outputTokens: totalOutputTokens,
            totalTokens: totalInputTokens + totalOutputTokens,
            inputCost: inputCost,
            outputCost: outputCost,
            totalCost: totalCost,
            formattedCost: totalCost < 0.01 ? '< $0.01' : `$${totalCost.toFixed(2)}`
        };
    }

    /**
     * Set the API key
     * @param {string} key - OpenRouter API key
     */
    setApiKey(key) {
        this.apiKey = key;
    }

    /**
     * Set the model to use
     * @param {string} modelId - Model ID from OpenRouter
     */
    setModel(modelId) {
        this.model = modelId;
    }

    /**
     * Check if API key is set
     * @returns {boolean}
     */
    hasApiKey() {
        return this.apiKey && this.apiKey.trim().length > 0;
    }

    /**
     * Validate the API key format
     * @param {string} key - API key to validate
     * @returns {boolean}
     */
    static validateKeyFormat(key) {
        // OpenRouter keys start with 'sk-or-'
        return key && key.trim().startsWith('sk-or-');
    }

    /**
     * Summarize a section of text
     * @param {string} text - Text to summarize
     * @param {string} style - 'brief' or 'detailed'
     * @param {string} sectionTitle - Optional section title for context
     * @returns {Promise<string>} Summarized text
     */
    async summarize(text, style = 'brief', sectionTitle = '') {
        if (!this.hasApiKey()) {
            throw new Error('API key not set');
        }

        const systemPrompt = this.getSystemPrompt(style);
        const userPrompt = this.getUserPrompt(text, sectionTitle, style);

        try {
            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                    'HTTP-Referer': this.siteUrl,
                    'X-Title': this.siteName
                },
                body: JSON.stringify({
                    model: this.model,
                    max_tokens: style === 'brief' ? 500 : 1000,
                    messages: [
                        {
                            role: 'system',
                            content: systemPrompt
                        },
                        {
                            role: 'user',
                            content: userPrompt
                        }
                    ]
                })
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.error?.message || `API request failed: ${response.status}`);
            }

            const data = await response.json();

            if (data.choices && data.choices.length > 0) {
                return data.choices[0].message.content;
            }

            throw new Error('No content in response');
        } catch (error) {
            console.error('OpenRouter API error:', error);

            if (error.message.includes('401') || error.message.includes('invalid')) {
                throw new Error('Invalid API key. Please check your OpenRouter API key in settings.');
            }

            if (error.message.includes('429')) {
                throw new Error('Rate limit exceeded. Please wait a moment and try again.');
            }

            if (error.message.includes('fetch')) {
                throw new Error('Network error. Please check your internet connection.');
            }

            throw error;
        }
    }

    /**
     * Get system prompt based on style
     * @param {string} style - 'brief' or 'detailed'
     * @returns {string}
     */
    getSystemPrompt(style) {
        const responseFormat = `

RESPONSE FORMAT:
You must respond in this exact format:
TITLE: [A clean, readable section title - fix any spacing issues, use proper capitalization]
SUMMARY: [Your summary text here]

If the section should be skipped, respond with exactly:
[SKIP]`;

        const skipInstructions = `

IMPORTANT - Skip irrelevant sections:
If the section contains ONLY non-substantive content such as:
- Author names, affiliations, emails
- Reference/bibliography lists
- Figure/table captions without context
- Acknowledgments
- Appendix headers
- Page numbers or headers

Then respond with exactly: [SKIP]

Only use [SKIP] for sections with NO meaningful content to summarize.`;

        if (style === 'brief') {
            return `You are a research paper summarization assistant. Your task is to create clear, concise summaries of academic text that capture the key points in a way that's easy to listen to as audio.

Guidelines:
- Extract only the most important points (3-5 key ideas)
- Use simple, clear language suitable for audio listening
- Avoid technical jargon when possible, or briefly explain it
- Write in flowing prose, not bullet points
- Keep summaries short (2-4 sentences)
- Focus on: main findings, key arguments, important conclusions
- Omit: citations, references to figures/tables, methodology details${skipInstructions}${responseFormat}`;
        }

        return `You are a research paper summarization assistant. Your task is to create comprehensive but accessible summaries of academic text that capture the important details in a way that's suitable for audio listening.

Guidelines:
- Cover the main points thoroughly while remaining concise
- Use clear language suitable for audio listening
- Explain technical terms when they appear
- Write in flowing prose, not bullet points
- Provide context for key findings and arguments
- Include important methodology details when relevant
- Keep summaries focused but informative (4-8 sentences)${skipInstructions}${responseFormat}`;
    }

    /**
     * Get user prompt
     * @param {string} text - Text to summarize
     * @param {string} sectionTitle - Section title
     * @param {string} style - Summary style
     * @returns {string}
     */
    getUserPrompt(text, sectionTitle, style) {
        let prompt = '';

        if (sectionTitle) {
            prompt += `This is the "${sectionTitle}" section of an academic paper.\n\n`;
        }

        prompt += `Please summarize the following text for audio listening (or respond with [SKIP] if it's not worth summarizing):\n\n${text}`;

        if (style === 'brief') {
            prompt += '\n\nProvide a brief summary focusing on the key points only, or [SKIP] if irrelevant.';
        } else {
            prompt += '\n\nProvide a detailed summary covering the important points thoroughly, or [SKIP] if irrelevant.';
        }

        return prompt;
    }

    /**
     * Parse AI response to extract title and summary
     * @param {string} response - Raw AI response
     * @returns {Object} Parsed response with title and summary
     */
    parseResponse(response) {
        const trimmed = response.trim();

        // Check for skip response
        if (trimmed.toUpperCase() === '[SKIP]' || trimmed.toUpperCase().startsWith('[SKIP]')) {
            return { isSkipped: true, title: null, summary: null };
        }

        // Parse TITLE: and SUMMARY: format
        const titleMatch = trimmed.match(/^TITLE:\s*(.+?)(?:\n|$)/im);
        const summaryMatch = trimmed.match(/SUMMARY:\s*([\s\S]+)$/im);

        if (titleMatch && summaryMatch) {
            return {
                isSkipped: false,
                title: titleMatch[1].trim(),
                summary: summaryMatch[1].trim()
            };
        }

        // Fallback: treat entire response as summary if format not followed
        return {
            isSkipped: false,
            title: null,
            summary: trimmed
        };
    }

    /**
     * Summarize multiple sections in parallel with concurrency limit
     * @param {Array} sections - Array of sections with title and text
     * @param {string} style - 'brief' or 'detailed'
     * @param {Function} onProgress - Progress callback (completed, total, section)
     * @param {number} concurrency - Max concurrent requests (default: 10)
     * @returns {Promise<Array>} Array of summarized sections
     */
    async summarizeSections(sections, style = 'brief', onProgress = () => {}, concurrency = 10) {
        const results = new Array(sections.length);
        let completedCount = 0;
        const total = sections.length;

        // Process a single section
        const processSection = async (section, index) => {
            try {
                const rawResponse = await this.summarize(section.text, style, section.title);
                const parsed = this.parseResponse(rawResponse);

                const summaryText = parsed.summary || '';
                const summarizedSection = {
                    ...section,
                    title: parsed.title || section.title,
                    originalTitle: section.title,
                    summary: parsed.isSkipped ? null : summaryText,
                    summarySkipped: parsed.isSkipped,
                    summaryWordCount: parsed.isSkipped ? 0 : summaryText.split(/\s+/).length,
                    summaryEstimatedDuration: parsed.isSkipped ? 0 : Math.round((summaryText.split(/\s+/).length / 150) * 60)
                };

                results[index] = summarizedSection;
                completedCount++;
                onProgress(completedCount, total, summarizedSection);
            } catch (error) {
                console.warn(`Failed to summarize section ${section.title}:`, error);

                const errorSection = {
                    ...section,
                    summary: null,
                    summaryError: error.message
                };
                results[index] = errorSection;
                completedCount++;
                onProgress(completedCount, total, errorSection);
            }
        };

        // Process sections with concurrency limit
        await this.parallelLimit(
            sections.map((section, index) => () => processSection(section, index)),
            concurrency
        );

        return results;
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
     * Test the API connection
     * @returns {Promise<boolean>}
     */
    async testConnection() {
        if (!this.hasApiKey()) {
            return false;
        }

        try {
            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                    'HTTP-Referer': this.siteUrl,
                    'X-Title': this.siteName
                },
                body: JSON.stringify({
                    model: this.model,
                    max_tokens: 10,
                    messages: [
                        {
                            role: 'user',
                            content: 'Hello'
                        }
                    ]
                })
            });

            return response.ok;
        } catch {
            return false;
        }
    }

    /**
     * Get available credits/usage info
     * @returns {Promise<Object>}
     */
    async getUsage() {
        if (!this.hasApiKey()) {
            return null;
        }

        try {
            const response = await fetch(`${this.baseUrl}/auth/key`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                }
            });

            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('Failed to get usage info:', error);
        }

        return null;
    }

    /**
     * Helper delay function
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise}
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
