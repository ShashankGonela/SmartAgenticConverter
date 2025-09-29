/**
 * Popup UI Controller
 * Handles user interactions and agent communication
 */

class PopupController {
    constructor() {
        this.agent = null;
        this.isProcessing = false;
        this.logs = [];
        
        this.initializeElements();
        this.bindEvents();
        this.initializeAgent();
    }

    /**
     * Initialize DOM elements
     */
    initializeElements() {
        this.userQueryInput = document.getElementById('userQuery');
        this.submitBtn = document.getElementById('submitBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.outputArea = document.getElementById('outputArea');
        this.logsContainer = document.getElementById('logsContainer');
        this.logsArea = document.getElementById('logsArea');
        this.toggleLogsBtn = document.getElementById('toggleLogs');
        this.statusElement = document.getElementById('status');
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Submit button
        this.submitBtn.addEventListener('click', () => this.handleSubmit());
        
        // Enter key in textarea
        this.userQueryInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSubmit();
            }
        });
        
        // Clear button
        this.clearBtn.addEventListener('click', () => this.clearOutput());
        
        // Toggle logs
        this.toggleLogsBtn.addEventListener('click', () => this.toggleLogs());
        
        // Examples section toggle
        const examplesHeader = document.getElementById('examplesHeader');
        if (examplesHeader) {
            examplesHeader.addEventListener('click', () => this.toggleExamples());
        }
        
        // Example items - event delegation
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('example-item')) {
                const query = e.target.getAttribute('data-query');
                if (query) {
                    this.fillQuery(query);
                }
            }
        });
        
        // Listen for agent log events
        window.addEventListener('agentLog', (e) => this.handleLogEntry(e.detail));
    }

    /**
     * Initialize the agent
     */
    async initializeAgent() {
        try {
            this.agent = new SmartConverterAgent();
            
            // Check configuration status
            const status = this.agent.getStatus();
            if (!status.isConfigured) {
                this.displayConfigurationError(status.configurationError);
                this.updateStatus('Configuration Error', 'error');
            } else {
                this.updateStatus('Ready', 'ready');
            }
        } catch (error) {
            console.error('Failed to initialize agent:', error);
            this.updateStatus('Initialization Error', 'error');
        }
    }

    /**
     * Display configuration error message
     */
    displayConfigurationError(error) {
        const errorHTML = `
            <div class="config-error">
                <h4>🔧 Configuration Required</h4>
                <p><strong>Error:</strong> ${error}</p>
                <div class="config-steps">
                    <h5>📋 Setup Steps:</h5>
                    <ol>
                        <li>Get your API key from <a href="https://aistudio.google.com/app/apikey" target="_blank">Google AI Studio</a></li>
                        <li>Open <code>.env</code> file in the extension folder</li>
                        <li>Replace <code>your_gemini_api_key_here</code> with your actual API key</li>
                        <li>Run <code>node build-config.js</code> in the extension folder</li>
                        <li>Reload the extension in Chrome</li>
                    </ol>
                </div>
                <div class="quick-commands">
                    <h5>⚡ Quick Commands:</h5>
                    <code>cd "path/to/extension"</code><br>
                    <code>node build-config.js</code>
                </div>
            </div>
        `;
        
        this.outputArea.innerHTML = errorHTML;
    }

    /**
     * Handle form submission
     */
    async handleSubmit() {
        if (this.isProcessing) return;
        
        const query = this.userQueryInput.value.trim();
        if (!query) {
            this.userQueryInput.focus();
            return;
        }
        
        if (!this.agent) {
            this.updateStatus('Agent not initialized', 'error');
            return;
        }

        if (!this.agent.isConfigured()) {
            this.updateStatus('Configuration error - check console', 'error');
            this.displayConfigurationError(this.agent.configurationError);
            return;
        }

        this.startProcessing();
        
        try {
            const result = await this.agent.processQuery(query);
            this.displayResult(result);
            
            if (result.success) {
                this.updateStatus('Conversion completed', 'success');
            } else {
                this.updateStatus('Conversion failed', 'error');
            }
        } catch (error) {
            console.error('Processing error:', error);
            this.displayError(error.message);
            this.updateStatus('Processing error', 'error');
        } finally {
            this.stopProcessing();
        }
    }

    /**
     * Start processing state
     */
    startProcessing() {
        this.isProcessing = true;
        this.submitBtn.classList.add('loading');
        this.submitBtn.disabled = true;
        this.userQueryInput.disabled = true;
        this.updateStatus('Processing...', 'processing');
        this.clearLogs();
    }

    /**
     * Stop processing state
     */
    stopProcessing() {
        this.isProcessing = false;
        this.submitBtn.classList.remove('loading');
        this.submitBtn.disabled = false;
        this.userQueryInput.disabled = false;
        this.userQueryInput.value = '';
    }

    /**
     * Display conversion result
     */
    displayResult(result) {
        if (result.success) {
            // Log the full response for debugging
            console.log('[Debug] Full LLM Response:', result.finalResponse);
            
            // Extract just the final answer without LLM reasoning
            const cleanAnswer = this.extractCleanAnswer(result.finalResponse);
            console.log('[Debug] Clean Answer:', cleanAnswer);
            
            const resultHTML = `
                <div class="result-content fade-in">
                    <h4>✅ Smart Converter Agent Response:</h4>
                    <div class="result-text">
                        ${this.formatResponse(cleanAnswer)}
                    </div>
                    ${this.formatToolResults(result.toolResults)}
                </div>
            `;
            this.outputArea.innerHTML = resultHTML;
            
            // Store full response for agent process logs
            this.storeFullResponse(result);
        } else {
            this.displayError(result.finalResponse || result.error);
        }
    }

    /**
     * Extract clean answer from LLM response, removing thought process
     */
    extractCleanAnswer(response) {
        // Remove common LLM reasoning patterns and return clean answer
        let cleanAnswer = response
            // Remove "Here's how I'll process" type statements
            .replace(/^.*?(?:Here's how I'll|Here is how I will|I'll process|Let me process).*?\n/i, '')
            // Remove analysis steps
            .replace(/^.*?(?:Based on|According to|The tool results show|Looking at).*?[,:]\s*/i, '')
            .replace(/^.*?(?:Analysis|Thought Process|Step \d+).*?:\s*/gmi, '')
            .replace(/^\d+\.\s+.*?:\s*/gmi, '') // Remove numbered steps
            .replace(/^(Analyze|Identify|Evaluate|Extract).*?:\s*/gmi, '') // Remove process steps
            // Remove "formulate the response" type text
            .replace(/.*?formulate the response.*?\n/i, '')
            .trim();
        
        // Look for direct conversion answers
        const lines = cleanAnswer.split('\n').filter(line => line.trim());
        
        // Priority 1: Look for direct conversion statements
        for (const line of lines) {
            if (line.match(/\d+.*?(miles?|km|kilometers?|pounds?|kg|kilograms?|USD|EUR|GBP|degrees?|°[CF])/i) && 
                (line.includes('=') || line.includes('is') || line.includes('equals'))) {
                return line.trim();
            }
        }
        
        // Priority 2: Look for date/time answers
        for (const line of lines) {
            if (line.match(/(days? from now|will be|is a|until)/i) && 
                line.match(/(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|January|February|March|April|May|June|July|August|September|October|November|December)/i)) {
                return line.trim();
            }
        }
        
        // Priority 3: Look for currency conversion results
        for (const line of lines) {
            if (line.match(/\d+.*?(USD|EUR|GBP|JPY|CAD|AUD)/i) && line.includes('=')) {
                return line.trim();
            }
        }
        
        // Priority 4: Take the first substantial line that's not reasoning
        for (const line of lines) {
            if (line.length > 10 && 
                !line.match(/^(The|Based|According|Analysis|Step|Analyze|Identify|Evaluate|Extract|Looking)/i) &&
                !line.includes('tool results') &&
                !line.includes('process')) {
                return line.trim();
            }
        }
        
        // Fallback: return the cleaned response or original
        return cleanAnswer || response;
    }
    
    /**
     * Store full response for detailed logs
     */
    storeFullResponse(result) {
        this.lastFullResponse = result.finalResponse;
        this.lastAnalysis = result.analysis;
    }

    /**
     * Format response text with proper line breaks and formatting
     */
    formatResponse(response) {
        return response
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');
    }

    /**
     * Format tool results for display
     */
    formatToolResults(toolResults) {
        if (!toolResults || toolResults.length === 0) return '';
        
        const successResults = toolResults.filter(tr => tr.result.success);
        if (successResults.length === 0) return '';

        let html = '<div class="tool-results">';
        html += '<h5>🔧 Tool Results:</h5>';
        html += '<ul>';
        
        successResults.forEach(tr => {
            const icon = this.getToolIcon(tr.tool);
            const result = tr.result;
            html += `<li>${icon} <strong>${tr.tool.charAt(0).toUpperCase() + tr.tool.slice(1)}:</strong> ${result.formatted || 'Success'}</li>`;
        });
        
        html += '</ul>';
        html += '</div>';
        
        return html;
    }

    /**
     * Get icon for tool type
     */
    getToolIcon(toolType) {
        const icons = {
            unit: '📏',
            currency: '💱',
            datetime: '📅'
        };
        return icons[toolType] || '🔧';
    }

    /**
     * Display error message
     */
    displayError(errorMessage) {
        const errorHTML = `
            <div class="result-content error-content fade-in">
                <h4>❌ Error</h4>
                <div class="error-text">
                    ${this.formatResponse(errorMessage)}
                </div>
                <div class="error-help">
                    <p>Try:</p>
                    <ul>
                        <li>Checking your query format</li>
                        <li>Using specific unit names (e.g., "miles", "kilometers")</li>
                        <li>Including currency codes (e.g., "USD", "EUR")</li>
                        <li>Using clear date references</li>
                    </ul>
                </div>
            </div>
        `;
        this.outputArea.innerHTML = errorHTML;
    }

    /**
     * Clear output area
     */
    clearOutput() {
        this.outputArea.innerHTML = `
            <div class="placeholder">
                <span class="placeholder-icon">💡</span>
                <p>Enter your conversion query above to get started</p>
                <div class="examples">
                    <small>Try: "Convert 100 USD to EUR", "What's 25°C in Fahrenheit?", or "How many days until Christmas?"</small>
                </div>
            </div>
        `;
        this.clearLogs();
        
        if (this.agent) {
            this.agent.clearHistory();
        }
    }

    /**
     * Handle log entries from agent
     */
    handleLogEntry(logEntry) {
        this.logs.push(logEntry);
        
        // Add full LLM response at the end for detailed analysis
        if (logEntry.type === 'Final Answer' && this.lastFullResponse) {
            this.logs.push({
                type: 'LLM Thought Process',
                content: this.lastFullResponse,
                timestamp: logEntry.timestamp
            });
        }
        
        this.updateLogsDisplay();
    }

    /**
     * Update logs display
     */
    updateLogsDisplay() {
        const logHTML = this.logs.map(log => {
            const typeClass = this.getLogTypeClass(log.type);
            const time = new Date(log.timestamp).toLocaleTimeString();
            
            return `
                <div class="log-entry ${typeClass}">
                    <span class="log-label">[${log.type}]</span>
                    <span class="log-time">${time}</span>
                    <div class="log-content">${log.content}</div>
                </div>
            `;
        }).join('');
        
        this.logsArea.innerHTML = logHTML;
        this.logsArea.scrollTop = this.logsArea.scrollHeight;
    }

    /**
     * Get CSS class for log type
     */
    getLogTypeClass(logType) {
        const classes = {
            'Agent Thought': 'log-thought',
            'Tool Call': 'log-tool',
            'Tool Result': 'log-result',
            'Agent Observation': 'log-observation',
            'Final Answer': 'log-final',
            'LLM Thought Process': 'log-llm-detail',
            'User Query': 'log-query',
            'Error': 'log-error',
            'System': 'log-system'
        };
        return classes[logType] || 'log-default';
    }

    /**
     * Clear logs
     */
    clearLogs() {
        this.logs = [];
        this.lastFullResponse = null;
        this.lastAnalysis = null;
        this.logsArea.innerHTML = '<div class="no-logs">No process logs yet...</div>';
    }

    /**
     * Toggle logs visibility
     */
    toggleLogs() {
        const isCollapsed = this.logsContainer.classList.contains('collapsed');
        
        if (isCollapsed) {
            this.logsContainer.classList.remove('collapsed');
            this.toggleLogsBtn.textContent = 'Hide Details';
        } else {
            this.logsContainer.classList.add('collapsed');
            this.toggleLogsBtn.textContent = 'Show Details';
        }
    }

    /**
     * Update status display
     */
    updateStatus(message, type = '') {
        this.statusElement.textContent = message;
        this.statusElement.className = `status ${type}`;
    }

    /**
     * Toggle examples section
     */
    toggleExamples() {
        const content = document.getElementById('examplesContent');
        const icon = document.getElementById('toggleIcon');
        
        if (content && icon) {
            if (content.classList.contains('collapsed')) {
                content.classList.remove('collapsed');
                icon.classList.add('rotated');
                icon.textContent = '▲';
            } else {
                content.classList.add('collapsed');
                icon.classList.remove('rotated');
                icon.textContent = '▼';
            }
        }
    }

    /**
     * Fill query textarea with example
     */
    fillQuery(query) {
        if (this.userQueryInput) {
            this.userQueryInput.value = query;
            this.userQueryInput.focus();
            
            // Add a subtle animation to show the query was filled
            this.userQueryInput.style.background = 'rgba(102, 126, 234, 0.1)';
            setTimeout(() => {
                this.userQueryInput.style.background = '';
            }, 300);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PopupController();
});

// Add some demo functionality for testing without API key
window.addEventListener('load', () => {
    // Add example query buttons for easy testing
    setTimeout(() => {
        const examples = document.querySelector('.examples');
        if (examples) {
            const exampleQueries = [
                "Convert 5 miles to km",
                "What day is 30 days from now?",
                "100 USD to EUR"
            ];
            
            const exampleButtons = exampleQueries.map(query => 
                `<button class="example-btn" data-query="${query}">${query}</button>`
            ).join(' ');
            
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'example-buttons';
            buttonContainer.innerHTML = exampleButtons;
            examples.appendChild(buttonContainer);
            
            // Add event delegation for example buttons
            buttonContainer.addEventListener('click', (e) => {
                if (e.target.classList.contains('example-btn')) {
                    const query = e.target.getAttribute('data-query');
                    document.getElementById('userQuery').value = query;
                }
            });
        }
    }, 500);
});