# Lumina-Agentic Web Assistant

AI-powered Chrome extension with intelligent data extraction, chat, and smart actions for any webpage.

## Features

### 🤖 AI-Powered Tools
- **AI Data Scraper**: Extract structured data with natural language queries
- **Chat with Page**: Ask questions about webpage content
- **AI Summarize**: Get concise summaries of any page

### 🛠️ Smart Actions
- **Extract Tables**: Find and export all data tables
- **Find All Links**: Categorize internal/external links
- **Extract Prices**: Locate all monetary values
- **Find Contact Info**: Extract emails and phone numbers

### ⚡ Automation
- Run custom automation tasks with natural language goals
- Built-in selector picker for precise element targeting
- Real-time execution traces

## Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd agentic-web-assistant
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the extension**
   ```bash
   npm run build
   ```

4. **Load in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

5. **Configure API Key**
   - Get a free Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Open the extension options
   - Add your API key

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Preview build
npm run preview
```

## Tech Stack

- **Framework**: React + TypeScript
- **Build Tool**: Vite
- **UI**: Framer Motion + Lucide Icons
- **AI**: Google Gemini API
- **Styling**: Tailwind CSS

## Privacy

All data is stored locally in your browser. The extension only sends page content to Google's Gemini API when you use AI features.

## License

MIT

## Publishing

See [publishing_guide.md](../brain/a91c6d97-a4f6-4356-a0b3-211061157a10/publishing_guide.md) for instructions on publishing to the Chrome Web Store.
