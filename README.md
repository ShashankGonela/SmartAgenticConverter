# Smart Agentic Converter - Chrome Extension

A powerful Chrome extension that leverages Google Gemini 2.5 Flash to provide intelligent unit conversions, currency conversions, and date/time calculations through an agentic AI system.

## 🚀 Features

### Advanced Query Processing
- **Mixed Query Support**: Handle complex queries with multiple conversion types in one request
- **Intelligent Parsing**: Extract and process different conversion types from natural language
- **Smart Query Analysis**: Automatic detection of unit, currency, and date/time components

### Conversion Tools
- **Unit Converter**: Length, weight, volume, temperature, area, time conversions using embedded convert-units library
- **Currency Converter**: Real-time currency conversions with 50+ supported currencies and smart fallback rates
- **DateTime Helper**: Timezone conversions, date calculations, day finding using Day.js library for precision

### AI Integration
- **Google Gemini 2.0 Flash**: Advanced language model for query interpretation and response generation
- **Agentic Loop**: Structured reasoning process with detailed step-by-step logging
- **Context Awareness**: Maintains conversation history for better contextual responses
- **Robust Error Handling**: User-friendly error messages with specific guidance for API issues

### User Interface
- **Modern Tech Theme**: Clean, gradient-based design with smooth animations and responsive layout
- **Real-time Logging**: View the AI's reasoning process in collapsible Agent Process logs
- **Interactive Examples**: Comprehensive query examples section with one-click insertion
- **CSP Compliant**: Content Security Policy compliant with proper event delegation
- **Loading States**: Visual feedback during processing with loading animations
- **Error Guidance**: Helpful suggestions when conversions fail or queries are unclear

## 📋 Requirements

- Chrome Browser (Manifest V3 support)
- Google Gemini API Key ([Get one here](https://aistudio.google.com/app/apikey))

## 🛠 Installation & Setup

### 1. Download/Clone Repository
```bash
git clone <repository-url>
cd AgentChrExt
```

### 2. Configure API Key
1. **Copy Environment File**: Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. **Get Gemini API Key**: Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
3. **Edit .env file**: Open `.env` and replace `your_gemini_api_key_here` with your actual API key:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   ```

### 3. Build Configuration
Run the build script to generate the configuration file:
```bash
# Using Node.js directly
node build-config.js

# Or using npm scripts (if you have npm)
npm run build
```

### 4. Install Chrome Extension
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer Mode** (toggle in top right)
3. Click **Load Unpacked** and select the extension folder
4. The extension should load automatically with your API key configured

### 5. Usage
Click the extension icon in Chrome toolbar and start converting!

## ⚙️ Configuration Files

- **`.env.example`** - Template environment file with setup instructions (safe to commit)
- **`.env`** - Your actual API key and configuration (keep private, never commit)
- **`config.js`** - Generated configuration file (auto-created, don't edit manually)
- **`build-config.js`** - Script that builds config.js from .env

> **Important**: Never commit your `.env` file or `config.js` to version control!


## 🏗 Architecture

### File Structure
```
AgentChrExt/
├── manifest.json           # Chrome extension manifest (V3 compliant)
├── popup.html             # Extension popup interface with examples section
├── popup.css              # Modern UI styling with animations
├── popup.js               # UI controller with CSP-compliant event handling
├── agent.js               # Main AI agent orchestrator with enhanced error handling
├── unitConverter.js       # Unit conversion module with mixed query support
├── currencyConverter.js   # Currency conversion module with fallback rates
├── datetimeHelper.js      # Date/time module with Day.js integration
├── config.js              # Generated configuration file (auto-created)
├── build-config.js        # Configuration build script
├── .env                   # Environment variables (API keys)
├── lib/
│   ├── convert-units.js   # Lightweight unit conversion library (embedded)
│   └── dayjs.js          # Day.js date library for robust date handling
└── icons/
    ├── icon16.png         # 16x16 extension icon
    ├── icon48.png         # 48x48 extension icon
    └── icon128.png        # 128x128 extension icon
```

### Agentic Loop Process

1. **User Query** → Input received and logged with timestamp
2. **Agent Thought** → LLM analyzes query to determine needed tools (with fallback analysis)
3. **Tool Call(s)** → Execute appropriate conversion tools with smart query extraction
4. **Tool Result(s)** → Log structured results from each tool with success/error status
5. **Agent Observation** → LLM processes and integrates tool results
6. **Final Answer** → Clean, natural language response without LLM reasoning

### Enhanced Query Processing
Each tool now includes intelligent query extraction:
- **Mixed Query Parsing**: Separates different conversion types from complex queries
- **Pattern Recognition**: Advanced regex patterns with punctuation handling
- **Smart Fallbacks**: Keyword-based analysis when LLM is unavailable
- **Error Recovery**: Graceful handling of parsing failures with helpful suggestions

### Console Logging Format
```
[USER QUERY] Original user input
[AGENT THOUGHT] LLM analysis and reasoning
[TOOL CALL] Which tool is being called
[TOOL RESULT] Raw results from tools
[AGENT OBSERVATION] LLM processing of results
[FINAL ANSWER] Natural language response
```

## 🔧 Configuration

## 🔧 Configuration

### Environment Variables (.env)
```bash
# Required: Your Google Gemini API Key
GEMINI_API_KEY=your_actual_api_key_here

# Optional: Customize model (default: gemini-2.0-flash-exp)
GEMINI_MODEL=gemini-2.0-flash-exp

# Optional: API endpoint (default: Google's endpoint)
GEMINI_API_BASE_URL=https://generativelanguage.googleapis.com/v1beta
```

### Build Process
The extension uses a build process to securely load API keys:

1. **Edit .env**: Add your API key to the `.env` file
2. **Run Build**: Execute `node build-config.js` to generate `config.js`
3. **Reload Extension**: Refresh the extension in Chrome to load new config

### Security Features
- API keys are loaded at build time, not runtime
- Configuration file is excluded from version control
- No API key prompts in the UI - seamless experience

### Customization Options
- **Model Selection**: Currently uses `gemini-2.5-flash` (configurable in `agent.js`)
- **Cache Timeout**: Currency rates cached for 10 minutes (configurable in `currencyConverter.js`)
- **Temperature Settings**: LLM temperature set to 0.1 for consistent results
- **UI Theme**: CSS variables in `popup.css` for easy color customization

## 🌟 Technical Highlights

### Advanced Query Processing
- **Mixed Query Parsing**: Intelligent extraction of different conversion types from complex queries
- **Pattern Recognition**: Comprehensive regex patterns with punctuation and natural language support
- **Smart Analysis**: LLM-based query analysis with keyword-based fallback system
- **Error Recovery**: Graceful degradation when individual components fail

### Robust Architecture
- **Modular Design**: Each conversion type isolated with standardized interfaces
- **CSP Compliance**: Content Security Policy compliant with proper event delegation
- **Library Integration**: Day.js (2KB) for dates, convert-units for measurements
- **Clean Separation**: UI, agent logic, and tools completely decoupled

### Performance & Reliability
- **Efficient Caching**: Smart caching for currency rates and API responses
- **Lightweight Libraries**: Embedded minimal libraries to avoid external dependencies
- **Fallback Systems**: Multiple fallback mechanisms for API failures
- **Error Handling**: Comprehensive error handling with specific user guidance

### User Experience
- **Interactive Examples**: Collapsible examples section with one-click query insertion
- **Real-time Feedback**: Loading states, animations, and progress indicators
- **Clean Results**: LLM reasoning hidden, only final answers shown to users
- **Responsive Design**: Optimized for Chrome extension popup constraints

## 🚧 Development

### Adding New Conversion Types
1. Create new module file (e.g., `newConverter.js`)
2. Implement standard interface with `handleConversion()` method
3. Register in `agent.js` constructor
4. Add analysis keywords in `fallbackAnalysis()`
5. Update system prompt with new tool description

### Extending LLM Capabilities
- Modify system prompt in `agent.js`
- Add new tool result processing logic
- Update UI to display new result types

### Customizing UI Theme
- Edit CSS variables in `:root` selector
- Modify gradient backgrounds and colors
- Adjust animation timings and effects

## 📝 API Dependencies

- **Google Gemini API**: For intelligent query processing and natural language generation
- **exchangerate-api.com**: For real-time currency rates (free, no API key required) with fallback rates
- **convert-units library**: Embedded lightweight version (2KB) for comprehensive unit conversions
- **Day.js library**: Embedded lightweight date library (2KB) for robust date arithmetic and formatting

### API Reliability Features
- **Currency Fallbacks**: Hardcoded rates for major pairs when API is unavailable
- **Error Handling**: User-friendly messages for 503, 429, 401, and 400 status codes  
- **Smart Caching**: 10-minute cache for currency rates to reduce API calls
- **Offline Capability**: Unit conversions and basic date operations work without internet

## 🐛 Troubleshooting

**Extension won't load:**
- Check Chrome extension developer mode is enabled
- Verify manifest.json syntax (Manifest V3 required)
- Check browser console for CSP or loading errors
- Ensure all files are present in the extension directory

**API key issues:**
- Ensure valid Gemini API key in .env file
- Run `node build-config.js` after updating .env
- Check API key permissions and quotas at Google AI Studio
- Verify network connectivity and firewall settings

**Conversion failures:**
- Check input format matches examples in popup
- Verify supported units/currencies (50+ currencies supported)
- Review Agent Process logs for detailed error info
- Try simpler query format if mixed query fails

**Mixed query parsing issues:**
- Separate different conversion types clearly in your query
- Use standard formats: "convert X to Y and what day is Z"
- Check examples section in extension for proper formatting
- Single-type queries are more reliable than complex mixed queries

**Date calculation errors:**
- Use clear relative terms: "30 days from now", "days until Christmas"
- Specify exact dates for calculations when possible
- Holiday names (Christmas, Halloween) are supported
- Timezone abbreviations (PST, EST) work better than full names

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/new-feature`)
3. Commit changes (`git commit -am 'Add new feature'`)
4. Push to branch (`git push origin feature/new-feature`)
5. Create Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
