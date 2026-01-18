/**
 * Operation logging for undo functionality
 * @module logger
 */

const fs = require('fs/promises');
const path = require('path');

const LOG_FILE_NAME = '.segre-log.json';

/**
 * Save operation log for undo functionality
 * @param {string} targetDir - Target directory
 * @param {Array} operations - List of move operations
 */
async function saveLog(targetDir, operations) {
    const logPath = path.join(targetDir, LOG_FILE_NAME);
    let existingLog = [];

    try {
        const content = await fs.readFile(logPath, 'utf-8');
        existingLog = JSON.parse(content);
    } catch {
        // No existing log file
    }

    const newLog = {
        timestamp: new Date().toISOString(),
        operations: operations
    };

    existingLog.push(newLog);
    await fs.writeFile(logPath, JSON.stringify(existingLog, null, 2));
}

/**
 * Read operation log
 * @param {string} targetDir - Target directory
 * @returns {Promise<Array|null>} Log array or null if not found
 */
async function readLog(targetDir) {
    const logPath = path.join(targetDir, LOG_FILE_NAME);

    try {
        const content = await fs.readFile(logPath, 'utf-8');
        return JSON.parse(content);
    } catch {
        return null;
    }
}

/**
 * Update or remove log file
 * @param {string} targetDir - Target directory
 * @param {Array} log - Updated log array
 */
async function updateLog(targetDir, log) {
    const logPath = path.join(targetDir, LOG_FILE_NAME);

    if (log.length > 0) {
        await fs.writeFile(logPath, JSON.stringify(log, null, 2));
    } else {
        await fs.unlink(logPath);
    }
}

module.exports = {
    LOG_FILE_NAME,
    saveLog,
    readLog,
    updateLog
};
