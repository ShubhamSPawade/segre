/**
 * Utility functions for file operations
 * @module utils
 */

const fs = require('fs/promises');
const path = require('path');

/**
 * Generate a unique filename if file already exists
 * @param {string} targetPath - Target file path
 * @returns {Promise<string>} Unique file path
 */
async function getUniqueFilePath(targetPath) {
    let uniquePath = targetPath;
    let counter = 1;

    while (true) {
        try {
            await fs.access(uniquePath);
            // File exists, generate new name
            const dir = path.dirname(targetPath);
            const ext = path.extname(targetPath);
            const baseName = path.basename(targetPath, ext);
            uniquePath = path.join(dir, `${baseName}(${counter})${ext}`);
            counter++;
        } catch {
            // File doesn't exist, use this path
            break;
        }
    }

    return uniquePath;
}

/**
 * Get month name from date
 * @param {Date} date 
 * @returns {string} Month name
 */
function getMonthName(date) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[date.getMonth()];
}

/**
 * Check if a path should be ignored
 * @param {string} filePath - File path to check
 * @param {Array<string>} ignorePatterns - Patterns to ignore
 * @returns {boolean} True if should be ignored
 */
function shouldIgnore(filePath, ignorePatterns) {
    if (!ignorePatterns || ignorePatterns.length === 0) return false;

    const fileName = path.basename(filePath);
    return ignorePatterns.some(pattern => {
        if (pattern.startsWith('*.')) {
            // Extension pattern
            return fileName.endsWith(pattern.slice(1));
        }
        return fileName === pattern || filePath.includes(pattern);
    });
}

module.exports = {
    getUniqueFilePath,
    getMonthName,
    shouldIgnore
};
