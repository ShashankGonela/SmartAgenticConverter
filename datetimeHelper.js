/**
 * DateTime Helper Module
 * Handles date/time calculations, timezone conversions, and date arithmetic
 * Uses Day.js library for robust date operations
 */

class DateTimeHelper {
    constructor() {
        // Initialize Day.js library
        this.dayjs = window.dayjs || null;
        if (!this.dayjs) {
            console.error('[DateTime Helper] Day.js library not loaded');
        }
        
        // Timezone mappings for common abbreviations
        this.timezones = this.getTimezoneList();
        
        // Keep original arrays for compatibility
        this.monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        this.dayNames = [
            'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
        ];
    }

    /**
     * Get list of common timezones
     */
    getTimezoneList() {
        return {
            'utc': 'UTC',
            'gmt': 'UTC',
            'est': 'America/New_York',
            'eastern': 'America/New_York',
            'cst': 'America/Chicago',
            'central': 'America/Chicago',
            'mst': 'America/Denver',
            'mountain': 'America/Denver',
            'pst': 'America/Los_Angeles',
            'pacific': 'America/Los_Angeles',
            'bst': 'Europe/London',
            'cet': 'Europe/Paris',
            'jst': 'Asia/Tokyo',
            'ist': 'Asia/Kolkata',
            'cst_china': 'Asia/Shanghai',
            'aest': 'Australia/Sydney',
            // Major cities
            'tokyo': 'Asia/Tokyo',
            'japan': 'Asia/Tokyo',
            'london': 'Europe/London',
            'paris': 'Europe/Paris',
            'berlin': 'Europe/Berlin',
            'sydney': 'Australia/Sydney',
            'melbourne': 'Australia/Melbourne',
            'shanghai': 'Asia/Shanghai',
            'beijing': 'Asia/Shanghai',
            'mumbai': 'Asia/Kolkata',
            'delhi': 'Asia/Kolkata',
            'dubai': 'Asia/Dubai',
            'moscow': 'Europe/Moscow',
            'singapore': 'Asia/Singapore',
            'hongkong': 'Asia/Hong_Kong',
            'seoul': 'Asia/Seoul',
            'bangkok': 'Asia/Bangkok',
            'jakarta': 'Asia/Jakarta'
        };
    }

    /**
     * Normalize timezone string
     */
    normalizeTimezone(timezone) {
        if (!timezone) return 'UTC';
        
        const normalized = this.timezones[timezone.toLowerCase()];
        return normalized || timezone;
    }

    /**
     * Convert between timezones using library
     */
    convertTimezone(dateTime, fromTimezone, toTimezone) {
        if (!this.dayjs) {
            return {
                success: false,
                error: 'Day.js library not available',
                dateTime: dateTime,
                fromTimezone: fromTimezone,
                toTimezone: toTimezone
            };
        }

        try {
            // Parse input date using Day.js
            let date = this.dayjs(dateTime);
            
            if (!date.isValid()) {
                throw new Error('Invalid date format');
            }

            const fromTz = this.normalizeTimezone(fromTimezone);
            const toTz = this.normalizeTimezone(toTimezone);

            // Use Intl.DateTimeFormat for timezone conversion (Day.js doesn't include timezone plugin)
            const fromOptions = { timeZone: fromTz, timeZoneName: 'short' };
            const toOptions = { timeZone: toTz, timeZoneName: 'short' };

            const fromFormatted = new Intl.DateTimeFormat('en-US', {
                ...fromOptions,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            }).format(date.toDate());

            const toFormatted = new Intl.DateTimeFormat('en-US', {
                ...toOptions,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            }).format(date.toDate());

            return {
                success: true,
                originalDate: date.toISOString(),
                fromTimezone: fromTz,
                toTimezone: toTz,
                fromFormatted: fromFormatted,
                toFormatted: toFormatted,
                formatted: `${fromFormatted} (${fromTz}) = ${toFormatted} (${toTz})`
            };

        } catch (error) {
            console.error(`[DateTime Helper] Timezone conversion error: ${error.message}`);
            return {
                success: false,
                error: error.message,
                dateTime: dateTime,
                fromTimezone: fromTimezone,
                toTimezone: toTimezone
            };
        }
    }

    /**
     * Calculate date difference using Day.js
     */
    calculateDateDifference(date1, date2, unit = 'days') {
        if (!this.dayjs) {
            return {
                success: false,
                error: 'Day.js library not available'
            };
        }

        try {
            const d1 = this.dayjs(date1);
            const d2 = this.dayjs(date2);

            if (!d1.isValid() || !d2.isValid()) {
                throw new Error('Invalid date format');
            }

            // Calculate the difference (d2 - d1, so positive means d2 is in the future)
            const result = d2.diff(d1, unit);

            // Format the result properly
            const absoluteResult = Math.abs(result);
            const isInFuture = result > 0;
            
            let formattedMessage;
            if (isInFuture) {
                formattedMessage = `There are ${absoluteResult} ${unit} until ${d2.format('MMM DD, YYYY')}`;
            } else {
                formattedMessage = `${d2.format('MMM DD, YYYY')} was ${absoluteResult} ${unit} ago`;
            }

            return {
                success: true,
                date1: d1.toISOString(),
                date2: d2.toISOString(),
                difference: absoluteResult,
                unit: unit,
                isInFuture: isInFuture,
                formatted: formattedMessage
            };

        } catch (error) {
            console.error(`[DateTime Helper] Date difference error: ${error.message}`);
            return {
                success: false,
                error: error.message,
                date1: date1,
                date2: date2,
                unit: unit
            };
        }
    }

    /**
     * Add or subtract days using Day.js
     */
    addSubtractDays(date, days, operation = 'add') {
        if (!this.dayjs) {
            return {
                success: false,
                error: 'Day.js library not available'
            };
        }

        try {
            const baseDate = this.dayjs(date);
            
            if (!baseDate.isValid()) {
                throw new Error('Invalid date format');
            }

            // Use Day.js add/subtract methods
            const resultDate = operation === 'subtract' 
                ? baseDate.subtract(days, 'days')
                : baseDate.add(days, 'days');

            return {
                success: true,
                originalDate: baseDate.toISOString(),
                resultDate: resultDate.toISOString(),
                days: days,
                operation: operation,
                formatted: `${baseDate.format('MMM DD, YYYY')} ${operation === 'add' ? '+' : '-'} ${days} days = ${resultDate.format('MMM DD, YYYY')}`
            };

        } catch (error) {
            console.error(`[DateTime Helper] Add/subtract days error: ${error.message}`);
            return {
                success: false,
                error: error.message,
                date: date,
                days: days,
                operation: operation
            };
        }
    }

    /**
     * Find what day of the week a date falls on using Day.js
     */
    findDayOfWeek(date) {
        if (!this.dayjs) {
            return {
                success: false,
                error: 'Day.js library not available'
            };
        }

        try {
            const targetDate = this.dayjs(date);
            
            if (!targetDate.isValid()) {
                throw new Error('Invalid date format');
            }

            // Use Day.js format method to get day name
            const dayName = targetDate.format('dddd');
            const dayOfWeek = targetDate.day();

            return {
                success: true,
                date: targetDate.toISOString(),
                dayOfWeek: dayOfWeek,
                dayName: dayName,
                formatted: `${targetDate.format('MMM DD, YYYY')} is a ${dayName}`
            };

        } catch (error) {
            console.error(`[DateTime Helper] Find day error: ${error.message}`);
            return {
                success: false,
                error: error.message,
                date: date
            };
        }
    }

    /**
     * Parse various date/time queries (Manual - LLM-friendly parsing)
     */
    parseDateTimeQuery(query) {
        // Pre-process query to extract date-related portions
        const dateQuery = this.extractDatePortion(query);
        
        const patterns = [
            // "What day is the day before today" / "What day is yesterday"
            {
                pattern: /what\s+day\s+(?:is\s+)?(?:the\s+day\s+before\s+today|yesterday)(?:[?!.]|$)/i,
                type: 'pastDay',
                extract: () => ({ days: 1, operation: 'subtract' })
            },
            // "What day is the day after today" / "What day is tomorrow"
            {
                pattern: /what\s+day\s+(?:is\s+)?(?:the\s+day\s+after\s+today|tomorrow)(?:[?!.]|$)/i,
                type: 'futureDay',
                extract: () => ({ days: 1, operation: 'add' })
            },
            // "What day is 2 days before today"
            {
                pattern: /what\s+day\s+(?:is\s+)?(\d+)\s+days?\s+before\s+today(?:[?!.]|$)/i,
                type: 'pastDay',
                extract: (match) => ({ days: parseInt(match[1]), operation: 'subtract' })
            },
            // "What day is 2 days after today"
            {
                pattern: /what\s+day\s+(?:is\s+)?(\d+)\s+days?\s+after\s+today(?:[?!.]|$)/i,
                type: 'futureDay',
                extract: (match) => ({ days: parseInt(match[1]), operation: 'add' })
            },
            // "What day is 50 days from now"
            { 
                pattern: /what\s+day\s+(?:is\s+)?(\d+)\s+days?\s+from\s+(?:now|today)(?:[?!.]|$)/i,
                type: 'futureDay',
                extract: (match) => ({ days: parseInt(match[1]), operation: 'add' })
            },
            // "What day was 30 days ago"
            {
                pattern: /what\s+day\s+was\s+(\d+)\s+days?\s+ago(?:[?!.]|$)/i,
                type: 'pastDay',
                extract: (match) => ({ days: parseInt(match[1]), operation: 'subtract' })
            },
            // "What day will it be in 5 days"
            {
                pattern: /what\s+day\s+will\s+it\s+be\s+in\s+(\d+)\s+days?(?:[?!.]|$)/i,
                type: 'futureDay',
                extract: (match) => ({ days: parseInt(match[1]), operation: 'add' })
            },
            // "What day was it 5 days ago"
            {
                pattern: /what\s+day\s+was\s+it\s+(\d+)\s+days?\s+ago(?:[?!.]|$)/i,
                type: 'pastDay',
                extract: (match) => ({ days: parseInt(match[1]), operation: 'subtract' })
            },
            // "How many days until Christmas" / "How many days between today and Christmas"
            {
                pattern: /how\s+many\s+days\s+(?:until|to|between\s+(?:today|now)\s+and)\s+([^?!.]+)/i,
                type: 'daysBetween',
                extract: (match) => ({ targetDate: match[1].trim() })
            },
            // "Convert 3 PM PST to EST"
            {
                pattern: /convert\s+(\d{1,2}(?::\d{2})?\s*(?:AM|PM)?)\s+([\w\s]+?)\s+to\s+([\w\s]+?)(?:[?!.]|$)/i,
                type: 'timezone',
                extract: (match) => ({ 
                    time: match[1].trim(), 
                    fromTimezone: match[2].trim(), 
                    toTimezone: match[3].trim() 
                })
            },
            // "What time is it in Tokyo"
            {
                pattern: /what\s+time\s+is\s+it\s+in\s+([\w\s]+?)(?:[?!.]|$)/i,
                type: 'currentTime',
                extract: (match) => ({ timezone: match[1].trim() })
            }
        ];

        // Try patterns on both original query and extracted date portion
        const queriesToTry = [dateQuery, query];
        
        for (const queryToTest of queriesToTry) {
            for (const { pattern, type, extract } of patterns) {
                const match = queryToTest.match(pattern);
                if (match) {
                    const result = {
                        type: type,
                        ...extract(match)
                    };
                    console.log(`[DateTime Helper] Parsed as type: ${type}`, result);
                    return result;
                }
            }
        }

        console.log(`[DateTime Helper] Could not parse query pattern`);
        return null;
    }

    /**
     * Extract date/time related portion from mixed queries
     */
    extractDatePortion(query) {
        // Common date/time phrases to extract
        const dateTimePatterns = [
            // "What day is X days from now"
            /what\s+day\s+(?:is\s+)?(\d+)\s+days?\s+from\s+(?:now|today)/i,
            // "What day was X days ago"
            /what\s+day\s+was\s+(\d+)\s+days?\s+ago/i,
            // "What day will it be in X days"
            /what\s+day\s+will\s+it\s+be\s+in\s+(\d+)\s+days?/i,
            // "How many days until X"
            /how\s+many\s+days\s+until\s+[^?!.]+/i,
            // "What time is it in X"
            /what\s+time\s+is\s+it\s+in\s+[^?!.]+/i,
            // "Convert X to Y" (for time zones)
            /convert\s+\d{1,2}(?::\d{2})?\s*(?:AM|PM)?\s+[\w\s]+?\s+to\s+[\w\s]+/i,
            // "What day is yesterday/tomorrow"
            /what\s+day\s+(?:is\s+)?(?:yesterday|tomorrow)/i,
            // "What day is today"
            /what\s+day\s+(?:is\s+)?today/i
        ];

        for (const pattern of dateTimePatterns) {
            const match = query.match(pattern);
            if (match) {
                return match[0];
            }
        }

        // If no specific pattern found, return original query
        return query;
    }

    /**
     * Handle special date names (Manual - Holiday calculations)
     */
    parseSpecialDates(dateString) {
        console.log(`[DateTime Helper] Parsing special date: "${dateString}"`);
        
        const now = new Date();
        const currentYear = now.getFullYear();
        
        // Helper function to get next occurrence of a holiday
        const getNextOccurrence = (month, day) => {
            let date = new Date(currentYear, month, day);
            // If the date has already passed this year, use next year
            if (date < now) {
                date = new Date(currentYear + 1, month, day);
            }
            return date;
        };
        
        const specialDates = {
            'christmas': getNextOccurrence(11, 25), // December 25
            'new year': new Date(currentYear + 1, 0, 1), // Always next year
            'new years': new Date(currentYear + 1, 0, 1),
            'halloween': getNextOccurrence(9, 31), // October 31
            'valentine': getNextOccurrence(1, 14), // February 14
            'valentines': getNextOccurrence(1, 14),
            'thanksgiving': this.getNextThanksgiving(currentYear)
        };

        const normalized = dateString.toLowerCase().trim();
        const result = specialDates[normalized] || null;
        
        if (result) {
            console.log(`[DateTime Helper] Special date resolved: ${normalized} = ${result.toDateString()}`);
        }
        
        return result;
    }

    /**
     * Get Thanksgiving date (4th Thursday of November) - Manual calculation
     */
    getThanksgiving(year) {
        console.log(`[DateTime Helper] Calculating Thanksgiving for ${year}`);
        
        const november = new Date(year, 10, 1); // November 1st
        const firstThursday = 4 - november.getDay() + (november.getDay() === 0 ? -3 : 1);
        const thanksgiving = new Date(year, 10, firstThursday + 21); // 4th Thursday
        
        console.log(`[DateTime Helper] Thanksgiving ${year}: ${thanksgiving.toDateString()}`);
        return thanksgiving;
    }

    /**
     * Get next Thanksgiving date - either this year or next year
     */
    getNextThanksgiving(currentYear) {
        const now = new Date();
        let thanksgiving = this.getThanksgiving(currentYear);
        
        // If this year's Thanksgiving has passed, get next year's
        if (thanksgiving < now) {
            thanksgiving = this.getThanksgiving(currentYear + 1);
        }
        
        return thanksgiving;
    }

    /**
     * Main method to handle date/time requests - LLM Integration Point
     */
    async handleDateTimeRequest(query) {
        // Step 1: Parse natural language query (Manual)
        const parsed = this.parseDateTimeQuery(query);
        if (!parsed) {
            return {
                success: false,
                error: 'Could not parse date/time request from query',
                query: query
            };
        }

        console.log(`[DateTime Helper] Query parsed successfully. Executing ${parsed.type} operation.`);

        // Step 2: Execute operations using Day.js library
        const now = this.dayjs ? this.dayjs() : new Date();

        switch (parsed.type) {
            case 'futureDay':
            case 'pastDay':
                console.log(`[DateTime Helper] Tool call: addSubtractDays with ${parsed.days} days, operation: ${parsed.operation}`);
                const futureResult = this.addSubtractDays(now, parsed.days, parsed.operation);
                if (futureResult.success) {
                    console.log(`[DateTime Helper] Tool call: findDayOfWeek for result date`);
                    const dayResult = this.findDayOfWeek(futureResult.resultDate);
                    const finalResult = {
                        success: true,
                        type: parsed.type,
                        ...futureResult,
                        dayInfo: dayResult,
                        formatted: `${parsed.days} days ${parsed.operation === 'add' ? 'from now' : 'ago'} will be ${dayResult.dayName}, ${this.dayjs ? this.dayjs(futureResult.resultDate).format('MMMM DD, YYYY') : new Date(futureResult.resultDate).toDateString()}`
                    };
                    console.log(`[DateTime Helper] Final result: ${finalResult.formatted}`);
                    return finalResult;
                }
                return futureResult;

            case 'daysBetween':
                console.log(`[DateTime Helper] Parsing target date: ${parsed.targetDate}`);
                const specialDate = this.parseSpecialDates(parsed.targetDate);
                const targetDate = specialDate || new Date(parsed.targetDate);
                
                if (isNaN(targetDate.getTime())) {
                    return {
                        success: false,
                        error: `Could not parse date: ${parsed.targetDate}`,
                        query: query
                    };
                }
                
                console.log(`[DateTime Helper] Tool call: calculateDateDifference between now and ${targetDate.toDateString()}`);
                return this.calculateDateDifference(now, targetDate, 'days');

            case 'timezone':
                console.log(`[DateTime Helper] Tool call: convertTimezone from ${parsed.fromTimezone} to ${parsed.toTimezone}`);
                // Create a date with the specified time today
                const timeStr = parsed.time + (parsed.time.includes('M') ? '' : ' PM');
                const todayWithTime = new Date();
                const timeParts = timeStr.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/i);
                
                if (timeParts) {
                    let hours = parseInt(timeParts[1]);
                    const minutes = parseInt(timeParts[2] || '0');
                    const period = timeParts[3]?.toUpperCase();
                    
                    if (period === 'PM' && hours !== 12) hours += 12;
                    if (period === 'AM' && hours === 12) hours = 0;
                    
                    todayWithTime.setHours(hours, minutes, 0, 0);
                }
                
                return this.convertTimezone(todayWithTime, parsed.fromTimezone, parsed.toTimezone);

            case 'currentTime':
                console.log(`[DateTime Helper] Tool call: convertTimezone to ${parsed.timezone}`);
                return this.convertTimezone(now, 'UTC', parsed.timezone);

            default:
                return {
                    success: false,
                    error: 'Unsupported date/time operation',
                    query: query,
                    parsed: parsed
                };
        }
    }

    /**
     * Get examples for demonstration
     */
    getExamples() {
        return [
            "What day is 50 days from now?",
            "How many days until Christmas?",
            "Convert 3 PM PST to EST",
            "What time is it in Tokyo?",
            "What day was 30 days ago?"
        ];
    }
}

// Export for use in other modules
window.DateTimeHelper = DateTimeHelper;