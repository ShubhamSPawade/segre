/**
 * Configuration loading and generation
 * @module config
 */

const fs = require('fs/promises');
const chalk = require('chalk');
const { defaultCategories } = require('./categories');

/**
 * Load custom categories from config file
 * @param {string} configPath - Path to config file
 * @returns {Promise<Object>} Categories configuration
 * @throws {Error} If config file cannot be loaded or parsed
 */
async function loadConfig(configPath) {
    if (!configPath || typeof configPath !== 'string') {
        throw new Error('Config path must be a non-empty string');
    }

    const configContent = await fs.readFile(configPath, 'utf-8');
    const customCategories = JSON.parse(configContent);

    // Validate config structure
    if (typeof customCategories !== 'object' || customCategories === null || Array.isArray(customCategories)) {
        throw new Error('Config must be a valid JSON object');
    }

    // Validate each category has an array of extensions
    for (const [category, extensions] of Object.entries(customCategories)) {
        if (!Array.isArray(extensions)) {
            throw new Error(`Category "${category}" must have an array of extensions`);
        }
        for (const ext of extensions) {
            if (typeof ext !== 'string') {
                throw new Error(`Extensions in "${category}" must be strings`);
            }
        }
    }

    return { ...defaultCategories, ...customCategories };
}

/**
 * Generate a sample config file
 * @param {string} outputPath - Path to save config file
 * @returns {Promise<Object>} The generated config
 * @throws {Error} If file cannot be written
 */
async function generateSampleConfig(outputPath) {
    if (!outputPath || typeof outputPath !== 'string') {
        throw new Error('Output path must be a non-empty string');
    }

    const sampleConfig = {
        "Images": [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".svg", ".webp"],
        "Documents": [".pdf", ".doc", ".docx", ".txt", ".md"],
        "Audio": [".mp3", ".wav", ".flac", ".aac"],
        "Videos": [".mp4", ".mkv", ".avi", ".mov"],
        "Code": [".js", ".ts", ".py", ".java", ".cpp", ".html", ".css"],
        "Archives": [".zip", ".rar", ".7z", ".tar", ".gz"],
        "Others": []
    };

    await fs.writeFile(outputPath, JSON.stringify(sampleConfig, null, 2));
    console.log(chalk.green(`\nSample config created: ${outputPath}\n`));
    console.log(chalk.gray('Edit this file to customize your categories.\n'));
    return sampleConfig;
}

module.exports = {
    loadConfig,
    generateSampleConfig
};
