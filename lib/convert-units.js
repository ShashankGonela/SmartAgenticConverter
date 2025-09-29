/**
 * Simple Convert Units Library
 * A lightweight unit conversion library for the Chrome extension
 */

(function() {
    'use strict';

    // Unit conversion data
    const conversions = {
        // Length
        length: {
            m: { name: 'meter', ratio: 1 },
            km: { name: 'kilometer', ratio: 1000 },
            cm: { name: 'centimeter', ratio: 0.01 },
            mm: { name: 'millimeter', ratio: 0.001 },
            in: { name: 'inch', ratio: 0.0254 },
            ft: { name: 'foot', ratio: 0.3048 },
            yd: { name: 'yard', ratio: 0.9144 },
            mi: { name: 'mile', ratio: 1609.344 }
        },
        
        // Mass
        mass: {
            g: { name: 'gram', ratio: 1 },
            kg: { name: 'kilogram', ratio: 1000 },
            lb: { name: 'pound', ratio: 453.592 },
            oz: { name: 'ounce', ratio: 28.3495 },
            ton: { name: 'ton', ratio: 1000000 }
        },
        
        // Volume
        volume: {
            l: { name: 'liter', ratio: 1 },
            ml: { name: 'milliliter', ratio: 0.001 },
            gal: { name: 'gallon', ratio: 3.78541 },
            qt: { name: 'quart', ratio: 0.946353 },
            pt: { name: 'pint', ratio: 0.473176 },
            cup: { name: 'cup', ratio: 0.236588 },
            'fl-oz': { name: 'fluid ounce', ratio: 0.0295735 }
        },
        
        // Temperature (special handling required)
        temperature: {
            C: { name: 'Celsius' },
            F: { name: 'Fahrenheit' },
            K: { name: 'Kelvin' },
            R: { name: 'Rankine' }
        },
        
        // Time
        time: {
            s: { name: 'second', ratio: 1 },
            min: { name: 'minute', ratio: 60 },
            h: { name: 'hour', ratio: 3600 },
            d: { name: 'day', ratio: 86400 },
            week: { name: 'week', ratio: 604800 },
            month: { name: 'month', ratio: 2629746 },
            year: { name: 'year', ratio: 31556952 }
        },
        
        // Area
        area: {
            'm2': { name: 'square meter', ratio: 1 },
            'km2': { name: 'square kilometer', ratio: 1000000 },
            'cm2': { name: 'square centimeter', ratio: 0.0001 },
            'in2': { name: 'square inch', ratio: 0.00064516 },
            'ft2': { name: 'square foot', ratio: 0.092903 },
            'yd2': { name: 'square yard', ratio: 0.836127 },
            'mi2': { name: 'square mile', ratio: 2589988.11 },
            acre: { name: 'acre', ratio: 4046.86 },
            hectare: { name: 'hectare', ratio: 10000 }
        }
    };

    // Temperature conversion functions
    function convertTemperature(value, from, to) {
        if (from === to) return value;
        
        // Convert to Celsius first
        let celsius;
        switch (from) {
            case 'C':
                celsius = value;
                break;
            case 'F':
                celsius = (value - 32) * 5/9;
                break;
            case 'K':
                celsius = value - 273.15;
                break;
            case 'R':
                celsius = (value - 491.67) * 5/9;
                break;
            default:
                throw new Error(`Unknown temperature unit: ${from}`);
        }
        
        // Convert from Celsius to target
        switch (to) {
            case 'C':
                return celsius;
            case 'F':
                return celsius * 9/5 + 32;
            case 'K':
                return celsius + 273.15;
            case 'R':
                return celsius * 9/5 + 491.67;
            default:
                throw new Error(`Unknown temperature unit: ${to}`);
        }
    }

    // Main converter class
    class Convert {
        constructor(value) {
            this.value = value || 0;
        }

        from(unit) {
            this.fromUnit = unit;
            return this;
        }

        to(unit) {
            if (!this.fromUnit) {
                throw new Error('Must specify from unit before to unit');
            }

            const measure = this.findMeasure(this.fromUnit);
            if (!measure) {
                throw new Error(`Unknown unit: ${this.fromUnit}`);
            }

            if (measure === 'temperature') {
                return convertTemperature(this.value, this.fromUnit, unit);
            }

            const fromData = conversions[measure][this.fromUnit];
            const toData = conversions[measure][unit];

            if (!fromData || !toData) {
                throw new Error(`Cannot convert from ${this.fromUnit} to ${unit}`);
            }

            // Convert via base unit
            const baseValue = this.value * fromData.ratio;
            return baseValue / toData.ratio;
        }

        findMeasure(unit) {
            for (const [measure, units] of Object.entries(conversions)) {
                if (units[unit]) {
                    return measure;
                }
            }
            return null;
        }

        describe(unit) {
            const measure = this.findMeasure(unit);
            if (!measure) return null;

            return {
                measure: measure,
                unit: unit,
                ...conversions[measure][unit]
            };
        }

        list(measure) {
            if (!conversions[measure]) {
                return [];
            }
            
            return Object.keys(conversions[measure]).map(unit => ({
                abbr: unit,
                measure: measure,
                ...conversions[measure][unit]
            }));
        }

        measures() {
            return Object.keys(conversions);
        }
    }

    // Factory function
    function convert(value) {
        return new Convert(value);
    }

    // Static methods
    convert.describe = function(unit) {
        return new Convert().describe(unit);
    };

    convert.list = function(measure) {
        return new Convert().list(measure);
    };

    convert.measures = function() {
        return new Convert().measures();
    };

    // Export to global scope
    window.convert = convert;
})();