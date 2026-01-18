/**
 * File category definitions and utilities
 * @module categories
 */

const defaultCategories = {
    'Archives': ['.zip', '.tar', '.gz', '.rar', '.7z', '.bz2', '.xz'],
    'Audio': ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma', '.m4a'],
    'Code': ['.js', '.ts', '.css', '.html', '.py', '.java', '.cpp', '.c', '.h', '.jsx', '.tsx', '.vue', '.rb', '.go', '.rs', '.php', '.swift', '.kt'],
    'Documents': ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.rtf', '.odt', '.ods', '.odp', '.md', '.csv'],
    'Images': ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.svg', '.webp', '.ico', '.raw', '.psd', '.ai'],
    'Videos': ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm', '.m4v', '.mpeg', '.mpg'],
    'Executables': ['.exe', '.msi', '.dmg', '.app', '.deb', '.rpm', '.sh', '.bat', '.cmd'],
    'Fonts': ['.ttf', '.otf', '.woff', '.woff2', '.eot'],
    'Others': []
};

/**
 * Get category for a file based on its extension
 * @param {string} extension - File extension (e.g., '.pdf')
 * @param {Object} categories - Categories configuration
 * @returns {string} Category name
 */
function getCategory(extension, categories) {
    if (!extension) return 'Others';

    for (const [category, extensions] of Object.entries(categories)) {
        if (extensions.includes(extension.toLowerCase())) {
            return category;
        }
    }
    return 'Others';
}

module.exports = {
    defaultCategories,
    getCategory
};
