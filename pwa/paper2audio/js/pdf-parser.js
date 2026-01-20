/**
 * PDF Parser Module
 * Handles PDF loading and text extraction using PDF.js
 */

export class PDFParser {
    constructor() {
        this.pdf = null;
        this.totalPages = 0;
    }

    /**
     * Load a PDF file
     * @param {File|ArrayBuffer} source - PDF file or ArrayBuffer
     * @param {Function} onProgress - Progress callback (0-100)
     * @returns {Promise<Object>} Document info
     */
    async loadPDF(source, onProgress = () => {}) {
        try {
            let data;
            if (source instanceof File) {
                data = await source.arrayBuffer();
            } else {
                data = source;
            }

            const loadingTask = pdfjsLib.getDocument({ data });

            loadingTask.onProgress = (progress) => {
                if (progress.total > 0) {
                    const percent = Math.round((progress.loaded / progress.total) * 100);
                    onProgress(percent);
                }
            };

            this.pdf = await loadingTask.promise;
            this.totalPages = this.pdf.numPages;

            // Try to get document metadata
            const metadata = await this.pdf.getMetadata().catch(() => ({}));

            return {
                totalPages: this.totalPages,
                title: metadata?.info?.Title || null,
                author: metadata?.info?.Author || null,
                subject: metadata?.info?.Subject || null
            };
        } catch (error) {
            console.error('Error loading PDF:', error);
            throw new Error('Failed to load PDF. Please ensure the file is a valid PDF document.');
        }
    }

    /**
     * Extract text from all pages
     * @param {Function} onProgress - Progress callback with page number
     * @returns {Promise<Array>} Array of page texts
     */
    async extractAllText(onProgress = () => {}) {
        if (!this.pdf) {
            throw new Error('No PDF loaded');
        }

        const pages = [];

        for (let i = 1; i <= this.totalPages; i++) {
            const pageText = await this.extractPageText(i);
            pages.push({
                pageNumber: i,
                text: pageText
            });
            onProgress(i, this.totalPages);
        }

        return pages;
    }

    /**
     * Extract text from a single page
     * @param {number} pageNumber - Page number (1-indexed)
     * @returns {Promise<string>} Page text
     */
    async extractPageText(pageNumber) {
        if (!this.pdf) {
            throw new Error('No PDF loaded');
        }

        const page = await this.pdf.getPage(pageNumber);
        const textContent = await page.getTextContent();

        // Process text items to reconstruct the text with proper spacing
        let lastY = null;
        let text = '';

        for (const item of textContent.items) {
            if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
                // New line detected
                text += '\n';
            } else if (text.length > 0 && !text.endsWith(' ') && !text.endsWith('\n')) {
                // Add space between items on the same line
                text += ' ';
            }

            text += item.str;
            lastY = item.transform[5];
        }

        return text.trim();
    }

    /**
     * Detect sections in the extracted text
     * Uses heuristics to identify section headers in academic papers
     * @param {Array} pages - Array of page objects with text
     * @returns {Array} Array of sections
     */
    detectSections(pages) {
        const fullText = pages.map(p => p.text).join('\n\n');
        const lines = fullText.split('\n');

        const sections = [];
        let currentSection = {
            title: 'Introduction',
            content: [],
            startIndex: 0
        };

        // Common section header patterns for academic papers
        const sectionPatterns = [
            /^(?:(\d+\.?\s*)|([IVXLCDM]+\.?\s+))?(Abstract|Introduction|Background|Related Work|Methodology|Methods|Materials and Methods|Approach|Implementation|Experiments?|Results?|Discussion|Conclusion|Conclusions|Summary|Future Work|Acknowledgments?|References|Bibliography|Appendix|Appendices)$/i,
            /^(\d+\.?\s+)[A-Z][A-Za-z\s]+$/,  // Numbered sections like "1. Introduction"
            /^([IVXLCDM]+\.?\s+)[A-Z][A-Za-z\s]+$/,  // Roman numeral sections
            /^[A-Z][A-Z\s]+$/,  // ALL CAPS headers
        ];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Skip empty lines
            if (!line) continue;

            // Check if this line looks like a section header
            let isHeader = false;

            for (const pattern of sectionPatterns) {
                if (pattern.test(line) && line.length < 100) {
                    isHeader = true;
                    break;
                }
            }

            // Also check for short lines followed by content (potential headers)
            if (!isHeader && line.length < 60 && line.length > 2) {
                const nextLine = lines[i + 1]?.trim() || '';
                const prevLine = lines[i - 1]?.trim() || '';

                // If the line is short, surrounded by empty/longer lines, and starts with capital
                if ((!prevLine || prevLine.length > line.length) &&
                    nextLine.length > line.length &&
                    /^[A-Z\d]/.test(line) &&
                    !line.endsWith('.') &&
                    !line.endsWith(',')) {
                    // Heuristic: might be a header
                    isHeader = line.split(' ').length <= 6;
                }
            }

            if (isHeader && currentSection.content.length > 0) {
                // Save current section and start new one
                currentSection.text = currentSection.content.join('\n').trim();
                if (currentSection.text.length > 50) {
                    sections.push({ ...currentSection });
                }

                currentSection = {
                    title: this.cleanSectionTitle(line),
                    content: [],
                    startIndex: i
                };
            } else {
                currentSection.content.push(line);
            }
        }

        // Don't forget the last section
        currentSection.text = currentSection.content.join('\n').trim();
        if (currentSection.text.length > 50) {
            sections.push({ ...currentSection });
        }

        // If no sections were detected, create chunks based on paragraphs
        if (sections.length <= 1) {
            return this.createParagraphSections(fullText);
        }

        // Clean up sections
        return sections.map((section, index) => ({
            id: index,
            title: section.title,
            text: section.text,
            wordCount: section.text.split(/\s+/).length,
            estimatedDuration: this.estimateReadingTime(section.text)
        }));
    }

    /**
     * Create sections from paragraphs when no clear structure is detected
     * @param {string} text - Full document text
     * @returns {Array} Array of sections
     */
    createParagraphSections(text) {
        const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 50);
        const sections = [];

        // Group paragraphs into sections of roughly similar size
        const targetWordsPerSection = 500;
        let currentSection = {
            title: 'Section 1',
            paragraphs: [],
            wordCount: 0
        };

        for (const paragraph of paragraphs) {
            const words = paragraph.trim().split(/\s+/).length;

            if (currentSection.wordCount + words > targetWordsPerSection && currentSection.paragraphs.length > 0) {
                sections.push({
                    title: currentSection.title,
                    text: currentSection.paragraphs.join('\n\n'),
                    wordCount: currentSection.wordCount
                });

                currentSection = {
                    title: `Section ${sections.length + 1}`,
                    paragraphs: [],
                    wordCount: 0
                };
            }

            currentSection.paragraphs.push(paragraph.trim());
            currentSection.wordCount += words;
        }

        // Add the last section
        if (currentSection.paragraphs.length > 0) {
            sections.push({
                title: currentSection.title,
                text: currentSection.paragraphs.join('\n\n'),
                wordCount: currentSection.wordCount
            });
        }

        return sections.map((section, index) => ({
            id: index,
            title: section.title,
            text: section.text,
            wordCount: section.wordCount,
            estimatedDuration: this.estimateReadingTime(section.text)
        }));
    }

    /**
     * Clean up section title
     * @param {string} title - Raw section title
     * @returns {string} Cleaned title
     */
    cleanSectionTitle(title) {
        let cleaned = title
            .replace(/^(\d+\.?\s*)|^([IVXLCDM]+\.?\s+)/i, '') // Remove numbering
            .trim();

        // Fix PDF extraction artifacts where spaces are inserted between characters
        // Pattern: "T AKING F EATURES" -> "Taking Features"
        // Detect: sequences of single uppercase letters separated by spaces
        cleaned = PDFParser.fixSpacedLetters(cleaned);

        // Normalize remaining whitespace
        cleaned = cleaned.replace(/\s+/g, ' ').trim();

        // Convert to title case if it's ALL CAPS
        if (cleaned === cleaned.toUpperCase() && cleaned.length > 2) {
            cleaned = PDFParser.toTitleCase(cleaned);
        }

        return cleaned;
    }

    /**
     * Fix PDF extraction artifact where letters have spaces between them
     * e.g., "T AKING F EATURES" -> "TAKING FEATURES"
     * @param {string} text - Text with potential spacing issues
     * @returns {string} Fixed text
     */
    static fixSpacedLetters(text) {
        // Pattern: Single uppercase letter followed by space and another uppercase letter
        // that continues a word (followed by lowercase letters)
        // "T AKING" -> each word starts with spaced letters

        // First, detect if this looks like spaced-out text
        // Check for pattern: uppercase, space, uppercase (repeatedly)
        const spacedPattern = /^[A-Z]\s[A-Z]/;

        if (!spacedPattern.test(text)) {
            return text;
        }

        // Split into words (by multiple spaces or natural word boundaries)
        // Words in spaced text are often separated by multiple spaces
        const parts = text.split(/\s{2,}/);

        if (parts.length > 1) {
            // Multiple parts separated by multiple spaces
            return parts.map(part => PDFParser.removeIntraWordSpaces(part)).join(' ');
        }

        // Single block - try to detect word boundaries
        // Look for patterns like "A BSTRACT" or "I NTRODUCTION"
        return PDFParser.removeIntraWordSpaces(text);
    }

    /**
     * Remove spaces between letters that should form a single word
     * @param {string} text - Text like "A BSTRACT" or "T AKING"
     * @returns {string} Text like "ABSTRACT" or "TAKING"
     */
    static removeIntraWordSpaces(text) {
        // Pattern: uppercase letter, space, uppercase letter followed by lowercase
        // This indicates a word with spaced-out first letter
        let result = text;

        // Handle pattern like "T AKING" (single letter, space, rest of word)
        result = result.replace(/\b([A-Z])\s+([A-Z][a-z])/g, '$1$2');

        // Handle fully spaced words like "A B S T R A C T"
        // If most characters are single letters separated by spaces
        const chars = text.split('');
        let singleLetterSpaceCount = 0;
        for (let i = 0; i < chars.length - 2; i++) {
            if (/[A-Z]/.test(chars[i]) && chars[i + 1] === ' ' && /[A-Z]/.test(chars[i + 2])) {
                singleLetterSpaceCount++;
            }
        }

        // If more than half the pattern matches single-letter spacing, collapse all single spaces
        if (singleLetterSpaceCount > text.length / 6) {
            result = result.replace(/([A-Z])\s(?=[A-Z])/g, '$1');
        }

        return result;
    }

    /**
     * Convert text to title case
     * @param {string} text - Text to convert
     * @returns {string} Title cased text
     */
    static toTitleCase(text) {
        const smallWords = ['a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'by', 'in', 'of', 'with', 'via'];

        return text.toLowerCase().split(' ').map((word, index) => {
            // Always capitalize first word, otherwise check if it's a small word
            if (index === 0 || !smallWords.includes(word)) {
                return word.charAt(0).toUpperCase() + word.slice(1);
            }
            return word;
        }).join(' ');
    }

    /**
     * Estimate reading time in seconds
     * @param {string} text - Text to estimate
     * @returns {number} Estimated seconds
     */
    estimateReadingTime(text) {
        const wordsPerMinute = 150; // Average TTS speed
        const words = text.split(/\s+/).length;
        return Math.round((words / wordsPerMinute) * 60);
    }

    /**
     * Format duration in mm:ss
     * @param {number} seconds - Duration in seconds
     * @returns {string} Formatted duration
     */
    static formatDuration(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * Clean text for TTS - removes citations, equations, figure references, etc.
     * @param {string} text - Raw text from PDF
     * @returns {string} Cleaned text suitable for TTS
     */
    static cleanTextForTTS(text) {
        let cleaned = text;

        // Remove inline citations like [1], [2,3], [1-5], (Author, 2020), (Author et al., 2020)
        cleaned = cleaned.replace(/\[\d+(?:[,\s-]+\d+)*\]/g, '');
        cleaned = cleaned.replace(/\(\s*[A-Z][a-z]+(?:\s+(?:et\s+al\.?|and|&)\s+[A-Z][a-z]+)*,?\s*\d{4}[a-z]?\s*\)/g, '');
        cleaned = cleaned.replace(/\(\s*[A-Z][a-z]+\s+\d{4}[a-z]?\s*\)/g, '');

        // Remove figure/table references: Figure 1, Fig. 1, Table 2, Tab. 2, etc.
        cleaned = cleaned.replace(/\b(?:Fig(?:ure)?|Tab(?:le)?|Eq(?:uation)?|Algorithm|Listing|Appendix)\.?\s*\d+[a-z]?(?:\s*[-–]\s*\d+[a-z]?)?\b/gi, '');

        // Remove references like "see Figure 1" or "as shown in Table 2"
        cleaned = cleaned.replace(/\b(?:see|shown in|refer to|as in|in|from)\s+(?:Fig(?:ure)?|Tab(?:le)?|Eq(?:uation)?|Algorithm|Listing|Appendix)\.?\s*\d+[a-z]?(?:\s*[-–]\s*\d+[a-z]?)?\b/gi, '');

        // Remove equations and mathematical expressions
        // LaTeX-style: $...$ or $$...$$
        cleaned = cleaned.replace(/\$\$[\s\S]*?\$\$/g, ' [equation] ');
        cleaned = cleaned.replace(/\$[^$]+\$/g, '');

        // Remove standalone math symbols and expressions
        cleaned = cleaned.replace(/\s*[=<>≤≥≠±∓×÷∑∏∫∂∇√∞]+\s*/g, ' ');

        // Remove Greek letters often used in equations (when standalone)
        cleaned = cleaned.replace(/\s+[αβγδεζηθικλμνξοπρστυφχψωΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ]\s+/g, ' ');

        // Remove URLs
        cleaned = cleaned.replace(/https?:\/\/[^\s]+/gi, '');
        cleaned = cleaned.replace(/www\.[^\s]+/gi, '');

        // Remove email addresses
        cleaned = cleaned.replace(/[\w.-]+@[\w.-]+\.\w+/g, '');

        // Remove DOIs
        cleaned = cleaned.replace(/\bdoi:\s*[^\s]+/gi, '');
        cleaned = cleaned.replace(/\b10\.\d{4,}\/[^\s]+/g, '');

        // Remove arXiv references
        cleaned = cleaned.replace(/\barXiv:\s*\d+\.\d+/gi, '');

        // Remove page numbers and headers/footers patterns
        cleaned = cleaned.replace(/^\s*\d+\s*$/gm, '');
        cleaned = cleaned.replace(/\bpage\s+\d+\s*(?:of\s+\d+)?\b/gi, '');

        // Remove footnote markers (superscript numbers)
        cleaned = cleaned.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, '');

        // Remove asterisks often used for footnotes
        cleaned = cleaned.replace(/\*+(?!\w)/g, '');

        // Remove common academic abbreviations and replace with full words
        cleaned = cleaned.replace(/\be\.g\.\s*/gi, 'for example, ');
        cleaned = cleaned.replace(/\bi\.e\.\s*/gi, 'that is, ');
        cleaned = cleaned.replace(/\bet\s+al\.\s*/gi, 'and others ');
        cleaned = cleaned.replace(/\betc\.\s*/gi, 'and so on ');
        cleaned = cleaned.replace(/\bvs\.\s*/gi, 'versus ');
        cleaned = cleaned.replace(/\bcf\.\s*/gi, 'compare ');
        cleaned = cleaned.replace(/\bw\.r\.t\.\s*/gi, 'with respect to ');
        cleaned = cleaned.replace(/\bs\.t\.\s*/gi, 'such that ');
        cleaned = cleaned.replace(/\bw\/\s*/gi, 'with ');
        cleaned = cleaned.replace(/\bw\/o\s*/gi, 'without ');

        // Remove section numbers at the start of lines
        cleaned = cleaned.replace(/^\s*\d+(\.\d+)*\.?\s+/gm, '');

        // Remove bullet points and list markers
        cleaned = cleaned.replace(/^\s*[•◦▪▸►‣⁃-]\s*/gm, '');
        cleaned = cleaned.replace(/^\s*\([a-z]\)\s*/gmi, '');
        cleaned = cleaned.replace(/^\s*[a-z]\)\s*/gmi, '');

        // Remove code blocks and inline code
        cleaned = cleaned.replace(/```[\s\S]*?```/g, ' [code block] ');
        cleaned = cleaned.replace(/`[^`]+`/g, '');

        // Remove percentage symbols with proper reading
        cleaned = cleaned.replace(/(\d+(?:\.\d+)?)\s*%/g, '$1 percent');

        // Clean up units for better TTS
        cleaned = cleaned.replace(/(\d+)\s*°C\b/gi, '$1 degrees Celsius');
        cleaned = cleaned.replace(/(\d+)\s*°F\b/gi, '$1 degrees Fahrenheit');
        cleaned = cleaned.replace(/(\d+)\s*°\b/g, '$1 degrees');
        cleaned = cleaned.replace(/(\d+)\s*ms\b/gi, '$1 milliseconds');
        cleaned = cleaned.replace(/(\d+)\s*μs\b/gi, '$1 microseconds');
        cleaned = cleaned.replace(/(\d+)\s*ns\b/gi, '$1 nanoseconds');
        cleaned = cleaned.replace(/(\d+)\s*Hz\b/gi, '$1 hertz');
        cleaned = cleaned.replace(/(\d+)\s*kHz\b/gi, '$1 kilohertz');
        cleaned = cleaned.replace(/(\d+)\s*MHz\b/gi, '$1 megahertz');
        cleaned = cleaned.replace(/(\d+)\s*GHz\b/gi, '$1 gigahertz');
        cleaned = cleaned.replace(/(\d+)\s*KB\b/gi, '$1 kilobytes');
        cleaned = cleaned.replace(/(\d+)\s*MB\b/gi, '$1 megabytes');
        cleaned = cleaned.replace(/(\d+)\s*GB\b/gi, '$1 gigabytes');
        cleaned = cleaned.replace(/(\d+)\s*TB\b/gi, '$1 terabytes');

        // Remove parenthetical asides that are just references or very short
        cleaned = cleaned.replace(/\(\s*(?:see|cf\.?|e\.g\.?|i\.e\.?)[^)]*\)/gi, '');
        cleaned = cleaned.replace(/\(\s*\d+(?:\s*[-–,]\s*\d+)*\s*\)/g, '');

        // Clean up hyphenation from line breaks
        cleaned = cleaned.replace(/(\w)-\s+(\w)/g, '$1$2');

        // Remove repeated punctuation
        cleaned = cleaned.replace(/([.!?])\1+/g, '$1');
        cleaned = cleaned.replace(/,\s*,/g, ',');

        // Remove empty parentheses or brackets
        cleaned = cleaned.replace(/\(\s*\)/g, '');
        cleaned = cleaned.replace(/\[\s*\]/g, '');

        // Clean up multiple spaces and normalize whitespace
        cleaned = cleaned.replace(/\s+/g, ' ');

        // Clean up spacing around punctuation
        cleaned = cleaned.replace(/\s+([.,;:!?])/g, '$1');
        cleaned = cleaned.replace(/([.,;:!?])\s*([.,;:!?])/g, '$1');

        // Remove leading/trailing whitespace from lines
        cleaned = cleaned.replace(/^\s+|\s+$/gm, '');

        // Remove empty lines
        cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n');

        return cleaned.trim();
    }
}
