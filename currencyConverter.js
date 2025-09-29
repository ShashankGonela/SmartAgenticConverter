/**
 * Currency Converter Module
 * Handles real-time currency conversions using exchangerate.host API
 */

class CurrencyConverter {
    constructor() {
        this.apiBaseUrl = 'https://api.exchangerate-api.com/v4/latest'; // Free API, no key required
        this.fallbackApiUrl = 'https://api.fixer.io/latest'; // Backup option
        this.cache = new Map();
        this.cacheTimeout = 10 * 60 * 1000; // 10 minutes
        this.supportedCurrencies = new Set();
        
        // Initialize with common currencies immediately
        this.initializeCommonCurrencies();
        
        // Load additional currencies from API (async, non-blocking)
        this.loadSupportedCurrencies().catch(err => {
            console.warn('[Currency Converter] Could not load additional currencies:', err.message);
        });
    }

    /**
     * Initialize with common currencies that are always supported
     */
    initializeCommonCurrencies() {
        const commonCurrencies = [
            'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'KRW',
            'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'BGN', 'RON', 'HRK',
            'RUB', 'TRY', 'BRL', 'MXN', 'ARS', 'CLP', 'COP', 'PEN',
            'ZAR', 'EGP', 'MAD', 'NGN', 'KES', 'GHS',
            'AED', 'SAR', 'QAR', 'KWD', 'BHD', 'OMR',
            'SGD', 'HKD', 'TWD', 'THB', 'MYR', 'IDR', 'PHP', 'VND'
        ];
        
        commonCurrencies.forEach(currency => {
            this.supportedCurrencies.add(currency.toLowerCase());
        });
    }

    /**
     * Load supported currencies from API
     */
    async loadSupportedCurrencies() {
        try {
            console.log('[Currency Converter] Loading additional currencies from API...');
            // Try to get currencies from exchange rate API response
            const response = await fetch(`${this.apiBaseUrl}/USD`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.rates) {
                let addedCount = 0;
                Object.keys(data.rates).forEach(currency => {
                    if (!this.supportedCurrencies.has(currency.toLowerCase())) {
                        this.supportedCurrencies.add(currency.toLowerCase());
                        addedCount++;
                    }
                });
                // Add the base currency too
                if (!this.supportedCurrencies.has('usd')) {
                    this.supportedCurrencies.add('usd');
                    addedCount++;
                }
                console.log(`[Currency Converter] Added ${addedCount} additional currencies from API`);
            } else {
                throw new Error('API response format invalid');
            }
        } catch (error) {
            console.warn('[Currency Converter] Could not load additional currencies:', error.message);
            console.log('[Currency Converter] Using common currencies only');
        }
    }

    /**
     * Get current exchange rate from cache or API
     */
    async getExchangeRate(fromCurrency, toCurrency) {
        const cacheKey = `${fromCurrency.toLowerCase()}-${toCurrency.toLowerCase()}`;
        const cached = this.cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.rate;
        }

        try {
            // Use the free exchangerate-api.com which doesn't require API key
            const response = await fetch(`${this.apiBaseUrl}/${fromCurrency.toUpperCase()}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.rates && data.rates[toCurrency.toUpperCase()]) {
                const rate = data.rates[toCurrency.toUpperCase()];
                this.cache.set(cacheKey, {
                    rate: rate,
                    timestamp: Date.now()
                });
                
                return rate;
            } else {
                throw new Error(`Exchange rate not available for ${fromCurrency} to ${toCurrency}`);
            }
        } catch (error) {
            console.error(`[Currency Converter] API Error: ${error.message}`);
            
            // Try fallback with hardcoded rates for common pairs (for demo purposes)
            const fallbackRate = this.getFallbackRate(fromCurrency, toCurrency);
            if (fallbackRate) {
                return fallbackRate;
            }
            
            throw error;
        }
    }

    /**
     * Get fallback exchange rates for common currency pairs (for demo purposes)
     */
    getFallbackRate(fromCurrency, toCurrency) {
        const from = fromCurrency.toUpperCase();
        const to = toCurrency.toUpperCase();
        
        // Sample rates (these would be outdated in real use, but work for demo)
        const fallbackRates = {
            'USD-EUR': 0.85,
            'EUR-USD': 1.18,
            'USD-GBP': 0.73,
            'GBP-USD': 1.37,
            'USD-JPY': 110.0,
            'JPY-USD': 0.009,
            'EUR-GBP': 0.86,
            'GBP-EUR': 1.16,
            'USD-CAD': 1.25,
            'CAD-USD': 0.80,
            'USD-AUD': 1.35,
            'AUD-USD': 0.74
        };
        
        const key = `${from}-${to}`;
        return fallbackRates[key] || null;
    }

    /**
     * Convert currency amount
     */
    async convertCurrency(amount, fromCurrency, toCurrency) {
        try {
            // Handle same currency
            if (fromCurrency.toLowerCase() === toCurrency.toLowerCase()) {
                return {
                    success: true,
                    result: amount,
                    rate: 1,
                    fromAmount: amount,
                    fromCurrency: fromCurrency.toUpperCase(),
                    toCurrency: toCurrency.toUpperCase(),
                    formatted: `${amount} ${fromCurrency.toUpperCase()} = ${amount} ${toCurrency.toUpperCase()}`
                };
            }

            const rate = await this.getExchangeRate(fromCurrency, toCurrency);
            const result = amount * rate;
            
            const formatted = `${amount} ${fromCurrency.toUpperCase()} = ${result.toFixed(2)} ${toCurrency.toUpperCase()}`;
            
            return {
                success: true,
                result: result,
                rate: rate,
                fromAmount: amount,
                fromCurrency: fromCurrency.toUpperCase(),
                toCurrency: toCurrency.toUpperCase(),
                formatted: formatted,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error(`[Currency Converter] Error: ${error.message}`);
            return {
                success: false,
                error: error.message,
                fromAmount: amount,
                fromCurrency: fromCurrency,
                toCurrency: toCurrency
            };
        }
    }

    /**
     * Parse currency conversion query from natural language
     */
    parseCurrencyQuery(query) {
        // Pre-process to extract currency-related portion
        const currencyQuery = this.extractCurrencyPortion(query);
        
        const patterns = [
            // "100 USD to EUR", "convert 50 dollars to euros", "10,000 JPY to INR"
            /(?:convert\s+)?(\d+(?:[,\.]\d+)*)\s*(USD|EUR|GBP|JPY|CAD|AUD|CHF|CNY|INR|KRW|dollars?|euros?|pounds?|yen|yuan|won|rupees?)\s+(?:to|in|into)\s+(USD|EUR|GBP|JPY|CAD|AUD|CHF|CNY|INR|KRW|dollars?|euros?|pounds?|yen|yuan|won|rupees?)/i,
            // "how much is 100 USD in EUR", "how much is 10,000 JPY in INR"
            /how\s+much\s+is\s+(\d+(?:[,\.]\d+)*)\s*(USD|EUR|GBP|JPY|CAD|AUD|CHF|CNY|INR|KRW|dollars?|euros?|pounds?|yen|yuan|won|rupees?)\s+in\s+(USD|EUR|GBP|JPY|CAD|AUD|CHF|CNY|INR|KRW|dollars?|euros?|pounds?|yen|yuan|won|rupees?)/i,
            // "100 USD in EUR", "10,000 JPY in INR"
            /(\d+(?:[,\.]\d+)*)\s*(USD|EUR|GBP|JPY|CAD|AUD|CHF|CNY|INR|KRW|dollars?|euros?|pounds?|yen|yuan|won|rupees?)\s+in\s+(USD|EUR|GBP|JPY|CAD|AUD|CHF|CNY|INR|KRW|dollars?|euros?|pounds?|yen|yuan|won|rupees?)/i
        ];

        // Try patterns on both extracted portion and original query
        const queriesToTry = [currencyQuery, query];
        
        for (const queryToTest of queriesToTry) {
            for (const pattern of patterns) {
                const match = queryToTest.match(pattern);
                if (match) {
                    // Remove commas from number and parse
                    const cleanAmount = match[1].replace(/,/g, '');
                    return {
                        amount: parseFloat(cleanAmount),
                        fromCurrency: this.normalizeCurrency(match[2]),
                        toCurrency: this.normalizeCurrency(match[3])
                    };
                }
            }
        }

        return null;
    }

    /**
     * Extract currency-related portion from mixed queries
     */
    extractCurrencyPortion(query) {
        const currencyPatterns = [
            // "convert X USD to EUR" (handles comma-separated numbers)
            /convert\s+\d+(?:[,\.]\d+)*\s*(?:USD|EUR|GBP|JPY|CAD|AUD|CHF|CNY|INR|KRW|dollars?|euros?|pounds?|yen|yuan|won|rupees?)\s+(?:to|in|into)\s+(?:USD|EUR|GBP|JPY|CAD|AUD|CHF|CNY|INR|KRW|dollars?|euros?|pounds?|yen|yuan|won|rupees?)/i,
            // "how much is X USD in EUR" (handles comma-separated numbers)
            /how\s+much\s+is\s+\d+(?:[,\.]\d+)*\s*(?:USD|EUR|GBP|JPY|CAD|AUD|CHF|CNY|INR|KRW|dollars?|euros?|pounds?|yen|yuan|won|rupees?)\s+in\s+(?:USD|EUR|GBP|JPY|CAD|AUD|CHF|CNY|INR|KRW|dollars?|euros?|pounds?|yen|yuan|won|rupees?)/i,
            // "X USD in EUR" or "X USD to EUR" (handles comma-separated numbers)
            /\d+(?:[,\.]\d+)*\s*(?:USD|EUR|GBP|JPY|CAD|AUD|CHF|CNY|INR|KRW|dollars?|euros?|pounds?|yen|yuan|won|rupees?)\s+(?:to|in)\s+(?:USD|EUR|GBP|JPY|CAD|AUD|CHF|CNY|INR|KRW|dollars?|euros?|pounds?|yen|yuan|won|rupees?)/i
        ];

        for (const pattern of currencyPatterns) {
            const match = query.match(pattern);
            if (match) {
                return match[0];
            }
        }

        return query;
    }

    /**
     * Normalize currency names to standard codes
     */
    normalizeCurrency(currency) {
        const currencyMappings = {
            'dollar': 'USD',
            'dollars': 'USD',
            'euro': 'EUR',
            'euros': 'EUR',
            'pound': 'GBP',
            'pounds': 'GBP',
            'yen': 'JPY',
            'yuan': 'CNY',
            'won': 'KRW',
            'rupee': 'INR',
            'rupees': 'INR'
        };
        
        const normalized = currencyMappings[currency.toLowerCase()];
        return normalized || currency.toUpperCase();
    }

    /**
     * Check if currency is supported
     */
    isCurrencySupported(currency) {
        const normalizedCurrency = this.normalizeCurrency(currency);
        const isSupported = this.supportedCurrencies.has(normalizedCurrency.toLowerCase()) ||
                           this.supportedCurrencies.has(currency.toLowerCase());
        
        return isSupported;
    }

    /**
     * Get popular currency pairs for examples
     */
    getPopularPairs() {
        return [
            { from: 'USD', to: 'EUR' },
            { from: 'USD', to: 'GBP' },
            { from: 'EUR', to: 'USD' },
            { from: 'USD', to: 'JPY' },
            { from: 'GBP', to: 'USD' }
        ];
    }

    /**
     * Main method to handle currency conversion requests
     */
    async handleConversion(query) {
        const parsed = this.parseCurrencyQuery(query);
        if (!parsed) {
            return {
                success: false,
                error: 'Could not parse currency conversion from query',
                query: query
            };
        }

        // Validate currencies
        if (!this.isCurrencySupported(parsed.fromCurrency) || !this.isCurrencySupported(parsed.toCurrency)) {
            return {
                success: false,
                error: `Unsupported currency. From: ${parsed.fromCurrency}, To: ${parsed.toCurrency}`,
                query: query,
                parsed: parsed
            };
        }

        return await this.convertCurrency(parsed.amount, parsed.fromCurrency, parsed.toCurrency);
    }

    /**
     * Get conversion examples for demonstration
     */
    getExamples() {
        return [
            "Convert 100 USD to EUR",
            "50 dollars to pounds",
            "How much is 1000 JPY in USD",
            "200 EUR in GBP",
            "500 CAD to AUD"
        ];
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        console.log('[Currency Converter] Cache cleared');
    }
}

// Export for use in other modules
window.CurrencyConverter = CurrencyConverter;