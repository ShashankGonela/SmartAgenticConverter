/**
 * Smart Converter Agent - Main Orchestrator
 * Handles LLM integration with Google Gemini and agentic loop
 */

class SmartConverterAgent {
    constructor() {
        // Initialize tool modules
        this.unitConverter = new UnitConverter();
        this.currencyConverter = new CurrencyConverter();
        this.dateTimeHelper = new DateTimeHelper();
        
        // LLM Configuration from config.js
        this.apiKey = window.CONFIG?.GEMINI_API_KEY || null;
        this.modelName = window.CONFIG?.GEMINI_MODEL || 'gemini-2.0-flash-exp';
        this.apiBaseUrl = window.CONFIG?.GEMINI_API_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta';
        this.apiUrl = `${this.apiBaseUrl}/models/${this.modelName}:generateContent`;
        
        // Conversation history
        this.conversationHistory = [];
        
        // System prompt
        this.systemPrompt = `You are a Smart Converter Agent specialized in unit conversions, currency conversions, and date/time calculations.

Your role is to:
1. Analyze user queries to determine which conversion tools to use
2. Make tool calls to get accurate results
3. Interpret and integrate tool results into natural, helpful responses

Available tools:
- Unit Converter: For length, weight, volume, temperature, and other unit conversions
- Currency Converter: For real-time currency conversions using current exchange rates
- DateTime Helper: For timezone conversions, date calculations, day finding, and date arithmetic

Guidelines:
- Always use tools to get accurate results rather than guessing
- If a query involves multiple conversions, use multiple tools
- Provide clear, natural language responses that integrate tool results
- If you cannot determine what conversion is needed, ask for clarification
- Always show your reasoning process step by step

Format your responses as structured thoughts that will be processed by an agentic system.`;

        // Validate API key configuration
        this.validateConfiguration();
    }

    /**
     * Validate configuration from config.js
     */
    validateConfiguration() {
        if (!this.apiKey || this.apiKey === 'your_gemini_api_key_here') {
            console.error('[Agent] ❌ Gemini API key not configured!');
            console.error('[Agent] 📖 Please update your .env file and run: node build-config.js');
            this.configurationError = 'API key not configured. Please update .env file and rebuild.';
        } else {
            console.log('[Agent] ✅ API key loaded successfully');
            this.configurationError = null;
        }
    }

    /**
     * Check if configuration is valid
     */
    isConfigured() {
        return !this.configurationError && this.apiKey && this.apiKey !== 'your_gemini_api_key_here';
    }

    /**
     * Make LLM call to Gemini
     */
    async callLLM(prompt, context = []) {
        if (!this.isConfigured()) {
            throw new Error(this.configurationError || 'Configuration error. Please update .env file and rebuild.');
        }

        const messages = [
            {
                role: 'user',
                parts: [{ text: this.systemPrompt }]
            },
            ...context,
            {
                role: 'user',
                parts: [{ text: prompt }]
            }
        ];

        const requestBody = {
            contents: messages,
            generationConfig: {
                temperature: 0.1,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1024,
            }
        };

        try {
            const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorText = await response.text();
                
                // Provide user-friendly error messages
                let errorMessage = `LLM API error: ${response.status}`;
                if (response.status === 503) {
                    errorMessage += ' - The Gemini API service is temporarily unavailable. Please try again in a few minutes.';
                } else if (response.status === 429) {
                    errorMessage += ' - Rate limit exceeded. Please wait before making more requests.';
                } else if (response.status === 401) {
                    errorMessage += ' - Invalid API key. Please check your configuration.';
                } else if (response.status === 400) {
                    errorMessage += ' - Bad request. Please check your query format.';
                } else {
                    errorMessage += ` - ${errorText}`;
                }
                
                throw new Error(errorMessage);
            }

            const data = await response.json();
            
            if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                return data.candidates[0].content.parts[0].text;
            } else {
                throw new Error('Invalid response format from LLM API');
            }
        } catch (error) {
            console.error('[Agent] LLM call error:', error);
            throw error;
        }
    }

    /**
     * Log step in agentic process
     */
    logStep(type, content) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            type: type,
            content: content,
            timestamp: timestamp
        };

        // Clean, single console log per step
        const timeStr = new Date(timestamp).toLocaleTimeString();
        console.log(`🤖 [${type}] ${content} (${timeStr})`);
        
        // Dispatch event for UI updates
        window.dispatchEvent(new CustomEvent('agentLog', { 
            detail: logEntry 
        }));
        
        return logEntry;
    }

    /**
     * Determine which tools to use based on query analysis
     */
    async analyzeQuery(query) {
        this.logStep('Agent Thought', `Analyzing query: "${query}"`);
        
        const analysisPrompt = `
Analyze this user query and determine which conversion tools to use: "${query}"

Respond with a JSON object indicating which tools to use and why:
{
  "needsUnitConversion": boolean,
  "needsCurrencyConversion": boolean, 
  "needsDateTimeCalculation": boolean,
  "reasoning": "explanation of what tools are needed and why"
}

Examples:
- "Convert 5 miles to km" -> {"needsUnitConversion": true, "needsCurrencyConversion": false, "needsDateTimeCalculation": false, "reasoning": "This is a length unit conversion"}
- "What's 100 USD in EUR" -> {"needsUnitConversion": false, "needsCurrencyConversion": true, "needsDateTimeCalculation": false, "reasoning": "This is a currency conversion"}
- "What day is 30 days from now and convert 5 kg to pounds" -> {"needsUnitConversion": true, "needsCurrencyConversion": false, "needsDateTimeCalculation": true, "reasoning": "This requires both date calculation and mass unit conversion"}
`;

        try {
            const response = await this.callLLM(analysisPrompt, this.conversationHistory);
            this.logStep('Agent Thought', `LLM Analysis: ${response}`);
            
            // Extract JSON from response
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            } else {
                // Fallback analysis based on keywords
                return this.fallbackAnalysis(query);
            }
        } catch (error) {
            console.error('[Agent] Query analysis error:', error);
            return this.fallbackAnalysis(query);
        }
    }

    /**
     * Fallback analysis if LLM fails
     */
    fallbackAnalysis(query) {
        const lowerQuery = query.toLowerCase();
        
        const unitKeywords = ['convert', 'miles', 'km', 'pounds', 'kg', 'celsius', 'fahrenheit', 'feet', 'meters', 'liters', 'gallons'];
        const currencyKeywords = ['usd', 'eur', 'gbp', 'jpy', 'dollars', 'euros', 'pounds', 'currency'];
        const dateTimeKeywords = ['days', 'date', 'time', 'ago', 'from now', 'until', 'timezone', 'christmas', 'today'];

        return {
            needsUnitConversion: unitKeywords.some(keyword => lowerQuery.includes(keyword)),
            needsCurrencyConversion: currencyKeywords.some(keyword => lowerQuery.includes(keyword)),
            needsDateTimeCalculation: dateTimeKeywords.some(keyword => lowerQuery.includes(keyword)),
            reasoning: "Fallback keyword-based analysis"
        };
    }

    /**
     * Execute tool calls based on analysis
     */
    async executeToolCalls(query, analysis) {
        const results = [];

        // Unit conversion
        if (analysis.needsUnitConversion) {
            this.logStep('Tool Call', 'Calling Unit Converter');
            const unitResult = await this.unitConverter.handleConversion(query);
            this.logStep('Tool Result', `Unit conversion: ${JSON.stringify(unitResult, null, 2)}`);
            results.push({ tool: 'unit', result: unitResult });
        }

        // Currency conversion
        if (analysis.needsCurrencyConversion) {
            this.logStep('Tool Call', 'Calling Currency Converter');
            const currencyResult = await this.currencyConverter.handleConversion(query);
            this.logStep('Tool Result', `Currency conversion: ${JSON.stringify(currencyResult, null, 2)}`);
            results.push({ tool: 'currency', result: currencyResult });
        }

        // DateTime calculation
        if (analysis.needsDateTimeCalculation) {
            this.logStep('Tool Call', 'Calling DateTime Helper');
            const dateTimeResult = await this.dateTimeHelper.handleDateTimeRequest(query);
            this.logStep('Tool Result', `DateTime calculation: ${JSON.stringify(dateTimeResult, null, 2)}`);
            results.push({ tool: 'datetime', result: dateTimeResult });
        }

        return results;
    }

    /**
     * Generate final response using LLM
     */
    async generateFinalResponse(query, toolResults) {
        this.logStep('Agent Observation', 'Processing tool results and generating final response');

        const responsePrompt = `
User Query: "${query}"

Tool Results:
${toolResults.map(tr => `${tr.tool.toUpperCase()} TOOL: ${JSON.stringify(tr.result, null, 2)}`).join('\n\n')}

Provide a direct, concise answer to the user's question. 

Requirements:
- Give the final conversion result immediately 
- Be conversational but brief
- Don't explain your process or reasoning
- Don't say "Based on the tool results" or similar phrases
- Just state the answer clearly

Examples:
- For "Convert 5 miles to km": "5 miles equals 8.047 kilometers."
- For "What day is 30 days from now": "30 days from now will be Wednesday, October 29, 2025."
- For "100 USD to EUR": "100 USD equals approximately 85.23 EUR."

Your response:`;

        try {
            const response = await this.callLLM(responsePrompt, this.conversationHistory);
            this.logStep('Final Answer', response);
            return response;
        } catch (error) {
            console.error('[Agent] Response generation error:', error);
            
            // Fallback response
            const fallbackResponse = this.generateFallbackResponse(toolResults);
            this.logStep('Final Answer', fallbackResponse);
            return fallbackResponse;
        }
    }

    /**
     * Generate fallback response if LLM fails
     */
    generateFallbackResponse(toolResults) {
        const successResults = toolResults.filter(tr => tr.result.success);
        
        if (successResults.length === 0) {
            return "I'm sorry, I couldn't process your conversion request. Please check your query format and try again.";
        }

        return successResults.map(tr => {
            if (tr.result.formatted) {
                return tr.result.formatted;
            } else {
                return `${tr.tool.charAt(0).toUpperCase() + tr.tool.slice(1)} result: ${JSON.stringify(tr.result)}`;
            }
        }).join('\n\n');
    }

    /**
     * Main agentic loop
     */
    async processQuery(userQuery) {
        this.logStep('User Query', userQuery);
        
        try {
            // Step 1: Analyze query to determine needed tools
            const analysis = await this.analyzeQuery(userQuery);
            
            // Step 2: Execute tool calls
            const toolResults = await this.executeToolCalls(userQuery, analysis);
            
            // Step 3: Generate final response
            const finalResponse = await this.generateFinalResponse(userQuery, toolResults);
            
            // Update conversation history
            this.conversationHistory.push(
                { role: 'user', parts: [{ text: userQuery }] },
                { role: 'model', parts: [{ text: finalResponse }] }
            );
            
            // Keep history manageable
            if (this.conversationHistory.length > 10) {
                this.conversationHistory = this.conversationHistory.slice(-10);
            }
            
            return {
                success: true,
                query: userQuery,
                analysis: analysis,
                toolResults: toolResults,
                finalResponse: finalResponse
            };
            
        } catch (error) {
            const errorMessage = `I encountered an error processing your request: ${error.message}`;
            this.logStep('Error', errorMessage);
            
            return {
                success: false,
                query: userQuery,
                error: error.message,
                finalResponse: errorMessage
            };
        }
    }

    /**
     * Get example queries for demonstration
     */
    getExampleQueries() {
        return [
            "What day is 50 days from now and convert 5 miles to km?",
            "Convert 100 USD to EUR and what's 25°C in Fahrenheit?",
            "How many days until Christmas and convert 10 pounds to kg?",
            "Convert 3 PM PST to EST and 500 ml to cups",
            "What's 1000 JPY in USD and what day was 30 days ago?"
        ];
    }

    /**
     * Clear conversation history
     */
    clearHistory() {
        this.conversationHistory = [];
        this.logStep('System', 'Conversation history cleared');
    }

    /**
     * Get agent status
     */
    getStatus() {
        return {
            isConfigured: this.isConfigured(),
            hasApiKey: !!this.apiKey,
            configurationError: this.configurationError,
            modelName: this.modelName,
            historyLength: this.conversationHistory.length,
            toolsLoaded: {
                unitConverter: !!this.unitConverter,
                currencyConverter: !!this.currencyConverter,
                dateTimeHelper: !!this.dateTimeHelper
            }
        };
    }
}

// Export for use in other modules
window.SmartConverterAgent = SmartConverterAgent;