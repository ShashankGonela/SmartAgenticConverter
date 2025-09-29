/**
 * Unit Converter Module
 * Handles various unit conversions using convert-units library
 */

class UnitConverter {
    constructor() {
        // Initialize with convert-units library (will be loaded via script tag)
        this.convert = window.convert || null;
        this.supportedCategories = [
            'length', 'mass', 'volume', 'temperature', 'area', 'time',
            'speed', 'energy', 'power', 'pressure', 'angle', 'frequency'
        ];
    }

    /**
     * Check if conversion is possible between two units
     */
    canConvert(fromUnit, toUnit) {
        if (!this.convert) return false;
        
        try {
            // Try to find units in any category
            const fromMeasure = this.convert().describe(fromUnit);
            const toMeasure = this.convert().describe(toUnit);
            
            return fromMeasure && toMeasure && fromMeasure.measure === toMeasure.measure;
        } catch (error) {
            return false;
        }
    }

    /**
     * Convert between units
     */
    convertUnits(value, fromUnit, toUnit) {
        if (!this.convert) {
            throw new Error('Convert-units library not loaded');
        }

        try {
            const result = this.convert(value).from(fromUnit).to(toUnit);
            
            return {
                success: true,
                result: result,
                fromValue: value,
                fromUnit: fromUnit,
                toUnit: toUnit,
                formatted: `${value} ${fromUnit} = ${result.toFixed(6)} ${toUnit}`
            };
        } catch (error) {
            console.error(`[Unit Converter] Error: ${error.message}`);
            return {
                success: false,
                error: error.message,
                fromValue: value,
                fromUnit: fromUnit,
                toUnit: toUnit
            };
        }
    }

    /**
     * Get all available units for a specific measure/category
     */
    getUnitsForMeasure(measure) {
        if (!this.convert) return [];
        
        try {
            return this.convert().list(measure);
        } catch (error) {
            return [];
        }
    }

    /**
     * Get all supported measures/categories
     */
    getSupportedMeasures() {
        if (!this.convert) return [];
        
        try {
            return this.convert().measures();
        } catch (error) {
            return this.supportedCategories;
        }
    }

    /**
     * Parse unit conversion query from natural language
     */
    parseConversionQuery(query) {
        // Pre-process to extract unit-related portion
        const unitQuery = this.extractUnitPortion(query);
        
        const patterns = [
            // "5 miles to km", "convert 10 pounds to kg", "1,000 grams to kg"
            /(?:convert\s+)?(\d+(?:[,\.]\d+)*)\s*([a-zA-Z°]+)\s+(?:to|in|into)\s+([a-zA-Z°]+)/i,
            // "5 miles in km", "10 pounds as kg", "1,000 grams as kg"
            /(\d+(?:[,\.]\d+)*)\s*([a-zA-Z°]+)\s+(?:in|as)\s+([a-zA-Z°]+)/i,
            // "how many km in 5 miles", "how many kg in 1,000 grams"
            /how\s+many\s+([a-zA-Z°]+)\s+(?:in|are)\s+(\d+(?:[,\.]\d+)*)\s*([a-zA-Z°]+)/i
        ];

        // Try patterns on both extracted portion and original query
        const queriesToTry = [unitQuery, query];
        
        for (const queryToTest of queriesToTry) {
            for (const pattern of patterns) {
                const match = queryToTest.match(pattern);
                if (match) {
                    if (pattern.source.includes('how\\s+many')) {
                        // For "how many X in Y Z" format
                        const cleanValue = match[2].replace(/,/g, '');
                        return {
                            value: parseFloat(cleanValue),
                            fromUnit: match[3],
                            toUnit: match[1]
                        };
                    } else {
                        // For standard "X Y to Z" format
                        const cleanValue = match[1].replace(/,/g, '');
                        return {
                            value: parseFloat(cleanValue),
                            fromUnit: match[2],
                            toUnit: match[3]
                        };
                    }
                }
            }
        }

        return null;
    }

    /**
     * Extract unit-related portion from mixed queries
     */
    extractUnitPortion(query) {
        const unitPatterns = [
            // "convert X miles to km" (handles comma-separated numbers)
            /convert\s+\d+(?:[,\.]\d+)*\s*[a-zA-Z°]+\s+(?:to|in|into)\s+[a-zA-Z°]+/i,
            // "X miles to km" (handles comma-separated numbers)
            /\d+(?:[,\.]\d+)*\s*[a-zA-Z°]+\s+(?:to|in|into)\s+[a-zA-Z°]+/i,
            // "X miles in km" (handles comma-separated numbers)
            /\d+(?:[,\.]\d+)*\s*[a-zA-Z°]+\s+(?:in|as)\s+[a-zA-Z°]+/i,
            // "how many km in X miles" (handles comma-separated numbers)
            /how\s+many\s+[a-zA-Z°]+\s+(?:in|are)\s+\d+(?:[,\.]\d+)*\s*[a-zA-Z°]+/i,
            // Temperature patterns "X°F to °C" (handles comma-separated numbers)
            /\d+(?:[,\.]\d+)*\s*°[CFKcfk]\s+(?:to|in)\s+°?[CFKcfk]/i,
            // "what's X°F in °C" (handles comma-separated numbers)
            /what'?s\s+\d+(?:[,\.]\d+)*\s*°[CFKcfk]\s+in\s+°?[CFKcfk]/i
        ];

        for (const pattern of unitPatterns) {
            const match = query.match(pattern);
            if (match) {
                return match[0];
            }
        }

        return query;
    }

    /**
     * Handle temperature conversions with special notation
     */
    normalizeTemperatureUnit(unit) {
        const tempMappings = {
            '°c': 'C',
            'celsius': 'C',
            'c': 'C',
            '°f': 'F',
            'fahrenheit': 'F',
            'f': 'F',
            '°k': 'K',
            'kelvin': 'K',
            'k': 'K'
        };
        
        return tempMappings[unit.toLowerCase()] || unit;
    }

    /**
     * Normalize unit names to match convert-units library
     */
    normalizeUnit(unit) {
        const unitMappings = {
            // Length
            'meter': 'm',
            'meters': 'm',
            'metre': 'm',
            'metres': 'm',
            'kilometer': 'km',
            'kilometers': 'km',
            'kilometre': 'km',
            'kilometres': 'km',
            'mile': 'mi',
            'miles': 'mi',
            'foot': 'ft',
            'feet': 'ft',
            'inch': 'in',
            'inches': 'in',
            'yard': 'yd',
            'yards': 'yd',
            
            // Mass
            'kilogram': 'kg',
            'kilograms': 'kg',
            'gram': 'g',
            'grams': 'g',
            'pound': 'lb',
            'pounds': 'lb',
            'ounce': 'oz',
            'ounces': 'oz',
            
            // Volume
            'liter': 'l',
            'liters': 'l',
            'litre': 'l',
            'litres': 'l',
            'gallon': 'gal',
            'gallons': 'gal',
            'cup': 'cup',
            'cups': 'cup',
            
            // Temperature (handled separately)
            'celsius': 'C',
            'fahrenheit': 'F',
            'kelvin': 'K'
        };
        
        // First check temperature
        const tempUnit = this.normalizeTemperatureUnit(unit);
        if (tempUnit !== unit) {
            return tempUnit;
        }
        
        return unitMappings[unit.toLowerCase()] || unit;
    }

    /**
     * Main method to handle unit conversion requests
     */
    async handleConversion(query) {
        const parsed = this.parseConversionQuery(query);
        if (!parsed) {
            return {
                success: false,
                error: 'Could not parse unit conversion from query',
                query: query
            };
        }

        // Normalize units
        const fromUnit = this.normalizeUnit(parsed.fromUnit);
        const toUnit = this.normalizeUnit(parsed.toUnit);

        // Check if conversion is possible
        if (!this.canConvert(fromUnit, toUnit)) {
            return {
                success: false,
                error: `Cannot convert from ${fromUnit} to ${toUnit}. Units may be incompatible or not supported.`,
                query: query,
                parsed: { ...parsed, fromUnit, toUnit }
            };
        }

        return this.convertUnits(parsed.value, fromUnit, toUnit);
    }

    /**
     * Get conversion examples for demonstration
     */
    getExamples() {
        return [
            "Convert 5 miles to km",
            "10 pounds to kg",
            "100°F to °C",
            "2 gallons in liters",
            "How many inches in 1 meter"
        ];
    }
}

// Export for use in other modules
window.UnitConverter = UnitConverter;