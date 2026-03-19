# PDF to Audio

A Progressive Web App that converts PDF documents to audio with optional AI-powered summarization.

## Features

- **PDF Upload**: Drag and drop or click to upload PDF files
- **Text Extraction**: Automatically extracts text from PDFs using PDF.js
- **Section Detection**: Intelligently detects sections in academic papers
- **Text-to-Speech**: Choose between:
  - **Browser TTS** (Free) - Uses system voices via Web Speech API
  - **OpenAI TTS** (Realistic) - High-quality natural voices (requires API key)
- **AI Summarization**: Multiple model options via OpenRouter:
  - GPT-4.1, OpenAI o3
  - Claude 4 Sonnet, Claude 4 Opus
  - Grok 3, Grok 3 Mini
  - Gemini 2.5 Pro
  - Llama 4 70B
- **PWA Support**: Install as a standalone app, works offline for cached content
- **Responsive Design**: Works on desktop and mobile devices

## Getting Started

### Running Locally

You can serve the app using any static file server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js (npx)
npx serve

# Using PHP
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

### Deployment

Deploy to any static hosting service:
- GitHub Pages
- Netlify
- Vercel
- Cloudflare Pages
- AWS S3 + CloudFront

## Usage

1. **Upload a PDF**: Drag and drop a PDF file or click the upload area
2. **Wait for Processing**: The app extracts text and detects sections
3. **Play Audio**: Use the play button to start text-to-speech playback
4. **Navigate Sections**: Click on sections or use prev/next buttons
5. **Adjust Settings**: Change voice, speed, and other options

### OpenAI TTS (Realistic Voices)

For more natural-sounding audio:

1. Click the **Settings** button (gear icon)
2. Select **OpenAI TTS** as the provider
3. Enter your **OpenAI API Key** (get from [platform.openai.com](https://platform.openai.com/api-keys))
4. Choose a voice (Nova, Alloy, Echo, Fable, Onyx, or Shimmer)
5. Select quality (Standard or HD)
6. Save settings

OpenAI TTS pricing: ~$15/1M characters (Standard) or ~$30/1M characters (HD)

### Summarization Mode

To use AI-powered summarization:

1. Click the **Settings** button (gear icon)
2. Enter your **OpenRouter API Key** (get from [openrouter.ai](https://openrouter.ai/keys))
3. Select your preferred AI model
4. Save settings
5. Click **Summarized** mode in the document view
6. Sections will be summarized before playback

OpenRouter provides access to multiple AI providers with unified billing.

## Keyboard Shortcuts

- **Space**: Play/Pause
- **Left Arrow**: Previous section
- **Right Arrow**: Next section
- **Escape**: Stop playback

## Browser Support

Works in all modern browsers that support:
- Web Speech API (Chrome, Edge, Safari, Firefox)
- PDF.js
- Service Workers

## File Structure

```
progressive_web_app/
├── index.html              # Main HTML file
├── styles.css              # Stylesheet
├── manifest.json           # PWA manifest
├── service-worker.js       # Service worker for offline support
├── js/
│   ├── app.js              # Main application logic
│   ├── pdf-parser.js       # PDF text extraction
│   ├── tts.js              # Text-to-speech (Browser + OpenAI)
│   └── openrouter-api.js   # OpenRouter API for summarization
├── icons/
│   └── icon.svg            # App icon
└── generate-icons.html     # Utility to generate PNG icons
```

## API Keys

| Service | Purpose | Get Key |
|---------|---------|---------|
| OpenAI | Realistic TTS voices | [platform.openai.com](https://platform.openai.com/api-keys) |
| OpenRouter | AI summarization | [openrouter.ai/keys](https://openrouter.ai/keys) |

Both services use pay-as-you-go pricing. For typical academic paper usage:
- OpenAI TTS: ~$0.10-0.30 per paper
- OpenRouter: ~$0.01-0.05 per paper (varies by model)

## Generating PNG Icons

For full PWA support across all platforms, generate PNG icons:

1. Open `generate-icons.html` in a browser
2. Click "Download All" to download icon files
3. Place the downloaded files in the `icons/` folder

## Privacy

- PDF files are processed entirely in your browser
- Text is only sent externally when using:
  - OpenAI TTS (for voice generation)
  - OpenRouter (for summarization)
- API keys are stored locally in your browser
- No tracking or analytics

## License

MIT
