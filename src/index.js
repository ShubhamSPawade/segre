/**
 * Segre - Main entry point
 * Re-exports all modules for easy importing
 * @module segre
 */

const { defaultCategories, getCategory } = require('./categories');
const { getUniqueFilePath, getMonthName, shouldIgnore } = require('./utils');
const { loadConfig, generateSampleConfig } = require('./config');
const { LOG_FILE_NAME, saveLog, readLog, updateLog } = require('./logger');
const { organizeDirectory, undoOrganize, showCategories } = require('./organizer');
const { VERSION, createProgram, run } = require('./cli');

module.exports = {
    // Categories
    defaultCategories,
    getCategory,

    // Utils
    getUniqueFilePath,
    getMonthName,
    shouldIgnore,

    // Config
    loadConfig,
    generateSampleConfig,

    // Logger
    LOG_FILE_NAME,
    saveLog,
    readLog,
    updateLog,

    // Organizer
    organizeDirectory,
    undoOrganize,
    showCategories,

    // CLI
    VERSION,
    createProgram,
    run
};
