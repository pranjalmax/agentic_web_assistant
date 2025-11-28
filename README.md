# Lumina - Agentic Web Assistant 🚀

> An intelligent Chrome extension that transforms how you interact with web content through AI-powered automation and data extraction.

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-blue?logo=google-chrome)](https://github.com/pranjalmax/agentic_web_assistant)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2-blue?logo=react)](https://reactjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🎯 Project Vision

As a developer who frequently works with web scraping, data extraction, and browser automation, I found myself repeatedly writing custom scripts for simple tasks like extracting data from websites, summarizing content, or automating form interactions. This project was born from the need to create a **universal tool** that could handle these tasks intelligently without writing code each time.

**Lumina** leverages the power of Google's Gemini AI to understand natural language queries and execute complex web automation tasks, making it accessible to both technical and non-technical users.

## ✨ Key Features

### 🤖 AI-Powered Intelligence

#### **AI Data Scraper**
Extract structured data from any webpage using natural language queries. No CSS selectors, no XPath - just describe what you want.

**Example Use Cases:**
- "Extract job titles and companies" from a careers page
- "Get product names and prices" from an e-commerce site
- "Find all author names and publication dates" from a blog

**Technical Implementation:**
- Utilizes Gemini's natural language understanding to parse page content
- Returns structured JSON data that's displayed in an interactive table
- Supports CSV export for further analysis

#### **Chat with Page**
Ask questions about any webpage's content and get instant AI-powered answers.

**Example Queries:**
- "What is the main argument of this article?"
- "Summarize the key features mentioned on this page"
- "What are the pricing tiers available?"

**Technical Implementation:**
- Extracts and preprocesses page content (removes scripts, styles, navigation)
- Sends context to Gemini API with user query
- Maintains conversation history for follow-up questions

#### **AI Summarize**
Generate concise 3-4 sentence summaries of any webpage instantly.

### 🛠️ Smart Actions

A suite of one-click utilities for common web tasks:

- **Extract Tables**: Automatically detect and parse all HTML tables on a page
- **Find All Links**: Categorize links as internal/external with domain grouping
- **Extract Prices**: Identify all monetary values with multi-currency support ($, €, £, ¥)
- **Find Contact Info**: Extract emails and phone numbers using intelligent regex patterns

### ⚡ Automation Agent

Run custom automation workflows using natural language goals:
- Built-in element selector picker for precise targeting
- Real-time execution traces for debugging
- Support for multi-step automation sequences

## 🏗️ Technical Architecture

### **Tech Stack**

#### **Frontend**
- **React 18.2** - Component-based UI architecture
- **TypeScript 5.3** - Type-safe development
- **Framer Motion** - Smooth animations and transitions
- **Tailwind CSS** - Utility-first styling with custom design system
- **Lucide React** - Modern icon library

#### **Build & Development**
- **Vite** - Lightning-fast build tool with HMR
- **Chrome Extension Manifest V3** - Latest extension platform
- **PostCSS & Autoprefixer** - CSS processing pipeline

#### **AI Integration**
- **Google Gemini API** - Advanced language model for intelligent features
- **Gemini Flash** - Optimized for fast response times

### **Architecture Patterns**

#### **Message-Based Communication**
Implemented a robust message-passing architecture between extension components:
```typescript
// Centralized message types for type safety
enum MessageType {
    EXECUTE_TOOL = 'EXECUTE_TOOL',
    AI_DATA_SCRAPE = 'AI_DATA_SCRAPE',
    CHAT_WITH_PAGE = 'CHAT_WITH_PAGE',
    SUMMARIZE_PAGE = 'SUMMARIZE_PAGE',
    // ... more types
}
```

#### **Content Script Tools**
Modular tool system for page interaction:
- `summarizePageTool()` - Clean content extraction
- `extractTablesTool()` - HTML table parsing
- `findAllLinksTool()` - Link categorization
- `extractPricesTool()` - Price detection with regex
- `findContactInfoTool()` - Contact information extraction

#### **Background Service Worker**
Centralized API orchestration to avoid CORS/CSP issues:
- Handles all Gemini API calls
- Manages extension state
- Coordinates between popup and content scripts

### **Design System**

Created a custom glassmorphic design with:
- Gradient animations
- Particle background effects
- Smooth state transitions
- Responsive layouts

## 💡 Skills Demonstrated

### **Full-Stack Development**
- **Frontend Engineering**: Built a complex React application with TypeScript
- **State Management**: Implemented efficient state handling with React hooks
- **API Integration**: Integrated Google's Gemini API with proper error handling
- **Async Programming**: Managed complex asynchronous workflows

### **Chrome Extension Development**
- **Manifest V3**: Implemented latest Chrome extension standards
- **Content Scripts**: Injected scripts for DOM manipulation
- **Background Workers**: Created service workers for background processing
- **Message Passing**: Built robust communication between extension components

### **UI/UX Design**
- **Modern Design**: Created an aesthetically pleasing glassmorphic interface
- **Animations**: Implemented smooth transitions with Framer Motion
- **Responsive Design**: Ensured compatibility across different screen sizes
- **User Experience**: Designed intuitive workflows for complex features

### **Software Engineering Best Practices**
- **TypeScript**: Leveraged type safety for robust code
- **Modular Architecture**: Separated concerns across components
- **Error Handling**: Implemented comprehensive error handling
- **Code Organization**: Maintained clean, readable code structure

### **AI/ML Integration**
- **Prompt Engineering**: Crafted effective prompts for Gemini API
- **Context Management**: Optimized context window usage
- **Response Parsing**: Handled and validated AI-generated responses

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Chrome browser
- Gemini API key ([Get one free](https://aistudio.google.com/app/apikey))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/pranjalmax/agentic_web_assistant.git
   cd agentic_web_assistant
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
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `dist` folder from the project directory

5. **Configure API Key**
   - Click the extension icon in Chrome
   - Go to Options (gear icon)
   - Paste your Gemini API key
   - Save settings

### Development

```bash
# Run development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
agentic-web-assistant/
├── src/
│   ├── background/          # Service worker
│   │   └── index.ts         # Background script logic
│   ├── content/             # Content scripts
│   │   └── index.ts         # Page interaction tools
│   ├── popup/               # Extension popup UI
│   │   ├── App.tsx          # Main popup component
│   │   └── components/      # React components
│   ├── options/             # Options page
│   │   └── App.tsx          # Settings interface
│   └── lib/                 # Shared utilities
│       ├── messages.ts      # Message types
│       └── planner.ts       # Automation planner
├── public/
│   └── icons/               # Extension icons
├── manifest.json            # Extension manifest
├── vite.config.ts           # Vite configuration
└── tailwind.config.js       # Tailwind configuration
```

## 🔒 Privacy & Security

- **Local Storage**: All user data (API keys, settings) stored locally in browser
- **No External Servers**: Extension doesn't send data to any servers except Gemini API
- **API Key Security**: Keys never leave the user's device
- **Minimal Permissions**: Only requests necessary Chrome permissions

## 🎨 Screenshots

*Coming soon - Extension in action*

## 🛣️ Roadmap

- [ ] Support for additional AI models (Claude, GPT-4)
- [ ] Advanced automation workflows with visual builder
- [ ] Data export in multiple formats (JSON, Excel)
- [ ] Scheduled automation tasks
- [ ] Browser history integration for context

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/pranjalmax/agentic_web_assistant/issues).

## 👨‍💻 Author

**Pranjal**

- GitHub: [@pranjalmax](https://github.com/pranjalmax)

## 🙏 Acknowledgments

- Google Gemini API for powering the AI features
- Chrome Extensions team for the excellent documentation
- The open-source community for inspiration

---

⭐ If you find this project useful, please consider giving it a star on GitHub!
