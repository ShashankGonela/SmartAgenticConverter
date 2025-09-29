/**
 * Build Configuration Script
 * Reads .env file and generates config.js with API key
 */

const fs = require('fs');
const path = require('path');

// Read .env file
function loadEnvFile() {
    const envPath = path.join(__dirname, '.env');
    
    if (!fs.existsSync(envPath)) {
        console.error('❌ .env file not found!');
        console.log('📝 Please create a .env file with your GEMINI_API_KEY');
        process.exit(1);
    }

    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};

    envContent.split('\n').forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) {
            const [key, ...valueParts] = trimmedLine.split('=');
            const value = valueParts.join('=').trim();
            envVars[key.trim()] = value;
        }
    });

    return envVars;
}

// Generate config.js
function generateConfig() {
    const envVars = loadEnvFile();
    
    // Validate required API key
    if (!envVars.GEMINI_API_KEY || envVars.GEMINI_API_KEY === 'your_gemini_api_key_here') {
        console.error('❌ GEMINI_API_KEY not set in .env file!');
        console.log('📖 Please add your Gemini API key to .env file');
        console.log('   Get one from: https://aistudio.google.com/app/apikey');
        process.exit(1);
    }

    // Set defaults
    const config = {
        GEMINI_API_KEY: envVars.GEMINI_API_KEY,
        GEMINI_MODEL: envVars.GEMINI_MODEL || 'gemini-2.0-flash-exp',
        GEMINI_API_BASE_URL: envVars.GEMINI_API_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta'
    };

    const configContent = `/**
 * Configuration for Chrome Extension
 * Generated from .env file - DO NOT EDIT MANUALLY
 */

window.CONFIG = ${JSON.stringify(config, null, 4)};

console.log('✅ Smart Converter Agent configured successfully');
console.log('🔑 API key loaded:', window.CONFIG.GEMINI_API_KEY.substring(0, 10) + '...');
`;

    fs.writeFileSync(path.join(__dirname, 'config.js'), configContent);
    console.log('✅ config.js generated successfully!');
    console.log('🚀 Extension ready to use with API key');
}

// Run the build
try {
    generateConfig();
} catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
}