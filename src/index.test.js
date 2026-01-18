const fs = require('fs/promises');
const fsSync = require('fs');
const path = require('path');
const os = require('os');

// Mock dependencies before requiring the modules
jest.mock('ora', () => {
    return jest.fn(() => ({
        start: jest.fn().mockReturnThis(),
        succeed: jest.fn().mockReturnThis(),
        fail: jest.fn().mockReturnThis(),
        stop: jest.fn().mockReturnThis(),
        stopAndPersist: jest.fn().mockReturnThis()
    }));
});

jest.mock('cli-progress', () => ({
    SingleBar: jest.fn(() => ({
        start: jest.fn(),
        update: jest.fn(),
        stop: jest.fn()
    }))
}));

jest.mock('chalk', () => ({
    red: jest.fn(str => str),
    green: jest.fn(str => str),
    blue: jest.fn(str => str),
    yellow: jest.fn(str => str),
    cyan: jest.fn(str => str),
    gray: jest.fn(str => str),
    bold: jest.fn(str => str)
}));

jest.mock('inquirer', () => ({
    prompt: jest.fn()
}));

// Import from modular structure
const {
    defaultCategories,
    getCategory,
    getUniqueFilePath,
    getMonthName,
    shouldIgnore,
    loadConfig,
    generateSampleConfig,
    LOG_FILE_NAME,
    saveLog,
    readLog,
    updateLog,
    organizeDirectory,
    undoOrganize,
    showCategories,
    VERSION,
    createProgram
} = require('./index');

const inquirer = require('inquirer');

// Test directory helper
let testDir;

async function createTestDir() {
    testDir = path.join(os.tmpdir(), `segre-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
    return testDir;
}

async function cleanupTestDir() {
    if (testDir && fsSync.existsSync(testDir)) {
        await fs.rm(testDir, { recursive: true, force: true });
    }
}

// ==================== VERSION Tests ====================
describe('VERSION', () => {
    test('should be defined', () => {
        expect(VERSION).toBe('1.0.2');
    });
});

// ==================== getCategory Tests ====================
describe('getCategory', () => {
    test('should return correct category for image extensions', () => {
        expect(getCategory('.jpg', defaultCategories)).toBe('Images');
        expect(getCategory('.jpeg', defaultCategories)).toBe('Images');
        expect(getCategory('.png', defaultCategories)).toBe('Images');
        expect(getCategory('.gif', defaultCategories)).toBe('Images');
        expect(getCategory('.svg', defaultCategories)).toBe('Images');
        expect(getCategory('.webp', defaultCategories)).toBe('Images');
    });

    test('should return correct category for document extensions', () => {
        expect(getCategory('.pdf', defaultCategories)).toBe('Documents');
        expect(getCategory('.doc', defaultCategories)).toBe('Documents');
        expect(getCategory('.docx', defaultCategories)).toBe('Documents');
        expect(getCategory('.txt', defaultCategories)).toBe('Documents');
        expect(getCategory('.md', defaultCategories)).toBe('Documents');
    });

    test('should return correct category for audio extensions', () => {
        expect(getCategory('.mp3', defaultCategories)).toBe('Audio');
        expect(getCategory('.wav', defaultCategories)).toBe('Audio');
        expect(getCategory('.flac', defaultCategories)).toBe('Audio');
    });

    test('should return correct category for video extensions', () => {
        expect(getCategory('.mp4', defaultCategories)).toBe('Videos');
        expect(getCategory('.mkv', defaultCategories)).toBe('Videos');
        expect(getCategory('.avi', defaultCategories)).toBe('Videos');
    });

    test('should return correct category for code extensions', () => {
        expect(getCategory('.js', defaultCategories)).toBe('Code');
        expect(getCategory('.ts', defaultCategories)).toBe('Code');
        expect(getCategory('.py', defaultCategories)).toBe('Code');
        expect(getCategory('.java', defaultCategories)).toBe('Code');
    });

    test('should return correct category for archive extensions', () => {
        expect(getCategory('.zip', defaultCategories)).toBe('Archives');
        expect(getCategory('.tar', defaultCategories)).toBe('Archives');
        expect(getCategory('.gz', defaultCategories)).toBe('Archives');
        expect(getCategory('.rar', defaultCategories)).toBe('Archives');
    });

    test('should return Others for unknown extensions', () => {
        expect(getCategory('.xyz', defaultCategories)).toBe('Others');
        expect(getCategory('.unknown', defaultCategories)).toBe('Others');
    });

    test('should return Others for empty extension', () => {
        expect(getCategory('', defaultCategories)).toBe('Others');
    });

    test('should return Others for null/undefined extension', () => {
        expect(getCategory(null, defaultCategories)).toBe('Others');
        expect(getCategory(undefined, defaultCategories)).toBe('Others');
    });

    test('should be case-insensitive', () => {
        expect(getCategory('.JPG', defaultCategories)).toBe('Images');
        expect(getCategory('.PDF', defaultCategories)).toBe('Documents');
        expect(getCategory('.Mp3', defaultCategories)).toBe('Audio');
    });
});

// ==================== getUniqueFilePath Tests ====================
describe('getUniqueFilePath', () => {
    beforeEach(async () => {
        await createTestDir();
    });

    afterEach(async () => {
        await cleanupTestDir();
    });

    test('should return original path if file does not exist', async () => {
        const targetPath = path.join(testDir, 'newfile.txt');
        const result = await getUniqueFilePath(targetPath);
        expect(result).toBe(targetPath);
    });

    test('should return unique path if file exists', async () => {
        const targetPath = path.join(testDir, 'existing.txt');
        await fs.writeFile(targetPath, 'content');

        const result = await getUniqueFilePath(targetPath);
        expect(result).toBe(path.join(testDir, 'existing(1).txt'));
    });

    test('should handle multiple existing files', async () => {
        const targetPath = path.join(testDir, 'file.txt');
        await fs.writeFile(targetPath, 'content');
        await fs.writeFile(path.join(testDir, 'file(1).txt'), 'content');
        await fs.writeFile(path.join(testDir, 'file(2).txt'), 'content');

        const result = await getUniqueFilePath(targetPath);
        expect(result).toBe(path.join(testDir, 'file(3).txt'));
    });

    test('should preserve file extension', async () => {
        const targetPath = path.join(testDir, 'document.pdf');
        await fs.writeFile(targetPath, 'content');

        const result = await getUniqueFilePath(targetPath);
        expect(result).toMatch(/document\(1\)\.pdf$/);
    });
});

// ==================== getMonthName Tests ====================
describe('getMonthName', () => {
    test('should return correct month names', () => {
        expect(getMonthName(new Date(2024, 0, 1))).toBe('Jan');
        expect(getMonthName(new Date(2024, 1, 1))).toBe('Feb');
        expect(getMonthName(new Date(2024, 2, 1))).toBe('Mar');
        expect(getMonthName(new Date(2024, 3, 1))).toBe('Apr');
        expect(getMonthName(new Date(2024, 4, 1))).toBe('May');
        expect(getMonthName(new Date(2024, 5, 1))).toBe('Jun');
        expect(getMonthName(new Date(2024, 6, 1))).toBe('Jul');
        expect(getMonthName(new Date(2024, 7, 1))).toBe('Aug');
        expect(getMonthName(new Date(2024, 8, 1))).toBe('Sep');
        expect(getMonthName(new Date(2024, 9, 1))).toBe('Oct');
        expect(getMonthName(new Date(2024, 10, 1))).toBe('Nov');
        expect(getMonthName(new Date(2024, 11, 1))).toBe('Dec');
    });
});

// ==================== loadConfig Tests ====================
describe('loadConfig', () => {
    beforeEach(async () => {
        await createTestDir();
    });

    afterEach(async () => {
        await cleanupTestDir();
    });

    test('should load valid config file', async () => {
        const configPath = path.join(testDir, 'config.json');
        const customConfig = { "CustomCategory": [".custom", ".test"] };
        await fs.writeFile(configPath, JSON.stringify(customConfig));

        const result = await loadConfig(configPath);
        expect(result.CustomCategory).toEqual([".custom", ".test"]);
        expect(result.Images).toBeDefined();
    });

    test('should merge with default categories', async () => {
        const configPath = path.join(testDir, 'config.json');
        const customConfig = { "Images": [".custom"] };
        await fs.writeFile(configPath, JSON.stringify(customConfig));

        const result = await loadConfig(configPath);
        expect(result.Images).toEqual([".custom"]);
        expect(result.Documents).toBeDefined();
    });

    test('should throw on invalid JSON', async () => {
        const configPath = path.join(testDir, 'bad-config.json');
        await fs.writeFile(configPath, 'not valid json {{{');

        await expect(loadConfig(configPath)).rejects.toThrow();
    });

    test('should throw on null config path', async () => {
        await expect(loadConfig(null)).rejects.toThrow('Config path must be a non-empty string');
    });

    test('should throw on empty config path', async () => {
        await expect(loadConfig('')).rejects.toThrow('Config path must be a non-empty string');
    });

    test('should throw on non-existent file', async () => {
        await expect(loadConfig('/non/existent/path.json')).rejects.toThrow();
    });

    test('should reject config with array instead of object', async () => {
        const configPath = path.join(testDir, 'array-config.json');
        await fs.writeFile(configPath, '["not", "an", "object"]');

        await expect(loadConfig(configPath)).rejects.toThrow('Config must be a valid JSON object');
    });

    test('should reject config with non-array category', async () => {
        const configPath = path.join(testDir, 'bad-category.json');
        await fs.writeFile(configPath, JSON.stringify({ "Images": "not an array" }));

        await expect(loadConfig(configPath)).rejects.toThrow('Category "Images" must have an array of extensions');
    });

    test('should reject config with non-string extensions', async () => {
        const configPath = path.join(testDir, 'bad-ext.json');
        await fs.writeFile(configPath, JSON.stringify({ "Images": [123, 456] }));

        await expect(loadConfig(configPath)).rejects.toThrow('Extensions in "Images" must be strings');
    });

    test('should reject null config object', async () => {
        const configPath = path.join(testDir, 'null-config.json');
        await fs.writeFile(configPath, 'null');

        await expect(loadConfig(configPath)).rejects.toThrow('Config must be a valid JSON object');
    });
});

// ==================== saveLog Tests ====================
describe('saveLog', () => {
    beforeEach(async () => {
        await createTestDir();
    });

    afterEach(async () => {
        await cleanupTestDir();
    });

    test('should create new log file', async () => {
        const operations = [{ from: 'a.txt', to: 'b.txt' }];
        await saveLog(testDir, operations);

        const logPath = path.join(testDir, LOG_FILE_NAME);
        expect(fsSync.existsSync(logPath)).toBe(true);

        const content = JSON.parse(await fs.readFile(logPath, 'utf-8'));
        expect(content).toHaveLength(1);
        expect(content[0].operations).toEqual(operations);
    });

    test('should append to existing log file', async () => {
        const logPath = path.join(testDir, LOG_FILE_NAME);
        const existingLog = [{ timestamp: '2024-01-01', operations: [] }];
        await fs.writeFile(logPath, JSON.stringify(existingLog));

        await saveLog(testDir, [{ from: 'new.txt', to: 'moved.txt' }]);

        const content = JSON.parse(await fs.readFile(logPath, 'utf-8'));
        expect(content).toHaveLength(2);
    });
});

// ==================== readLog Tests ====================
describe('readLog', () => {
    beforeEach(async () => {
        await createTestDir();
    });

    afterEach(async () => {
        await cleanupTestDir();
    });

    test('should return log contents', async () => {
        const logPath = path.join(testDir, LOG_FILE_NAME);
        const logData = [{ timestamp: '2024-01-01', operations: [] }];
        await fs.writeFile(logPath, JSON.stringify(logData));

        const result = await readLog(testDir);
        expect(result).toEqual(logData);
    });

    test('should return null if no log exists', async () => {
        const result = await readLog(testDir);
        expect(result).toBeNull();
    });
});

// ==================== updateLog Tests ====================
describe('updateLog', () => {
    beforeEach(async () => {
        await createTestDir();
    });

    afterEach(async () => {
        await cleanupTestDir();
    });

    test('should update existing log', async () => {
        const logPath = path.join(testDir, LOG_FILE_NAME);
        await fs.writeFile(logPath, '[]');

        const newLog = [{ timestamp: '2024-01-01', operations: [] }];
        await updateLog(testDir, newLog);

        const content = JSON.parse(await fs.readFile(logPath, 'utf-8'));
        expect(content).toEqual(newLog);
    });

    test('should delete log when empty', async () => {
        const logPath = path.join(testDir, LOG_FILE_NAME);
        await fs.writeFile(logPath, '[{"timestamp": "2024-01-01"}]');

        await updateLog(testDir, []);

        expect(fsSync.existsSync(logPath)).toBe(false);
    });
});

// ==================== shouldIgnore Tests ====================
describe('shouldIgnore', () => {
    test('should return false for empty patterns', () => {
        expect(shouldIgnore('/path/to/file.txt', [])).toBe(false);
        expect(shouldIgnore('/path/to/file.txt', null)).toBe(false);
        expect(shouldIgnore('/path/to/file.txt', undefined)).toBe(false);
    });

    test('should match exact filename', () => {
        expect(shouldIgnore('/path/to/file.txt', ['file.txt'])).toBe(true);
        expect(shouldIgnore('/path/to/other.txt', ['file.txt'])).toBe(false);
    });

    test('should match extension patterns', () => {
        expect(shouldIgnore('/path/to/file.log', ['*.log'])).toBe(true);
        expect(shouldIgnore('/path/to/file.txt', ['*.log'])).toBe(false);
    });

    test('should match path patterns', () => {
        expect(shouldIgnore('/path/to/node_modules/file.js', ['node_modules'])).toBe(true);
        expect(shouldIgnore('/path/to/src/file.js', ['node_modules'])).toBe(false);
    });

    test('should match multiple patterns', () => {
        const patterns = ['*.log', 'node_modules', '.git'];
        expect(shouldIgnore('/path/file.log', patterns)).toBe(true);
        expect(shouldIgnore('/path/node_modules/x.js', patterns)).toBe(true);
        expect(shouldIgnore('/path/.git/config', patterns)).toBe(true);
        expect(shouldIgnore('/path/src/app.js', patterns)).toBe(false);
    });
});

// ==================== organizeDirectory Tests ====================
describe('organizeDirectory', () => {
    beforeEach(async () => {
        await createTestDir();
    });

    afterEach(async () => {
        await cleanupTestDir();
    });

    test('should organize files by category', async () => {
        await fs.writeFile(path.join(testDir, 'photo.jpg'), 'image');
        await fs.writeFile(path.join(testDir, 'doc.pdf'), 'document');
        await fs.writeFile(path.join(testDir, 'song.mp3'), 'audio');

        await organizeDirectory(testDir, {});

        expect(fsSync.existsSync(path.join(testDir, 'Images', 'photo.jpg'))).toBe(true);
        expect(fsSync.existsSync(path.join(testDir, 'Documents', 'doc.pdf'))).toBe(true);
        expect(fsSync.existsSync(path.join(testDir, 'Audio', 'song.mp3'))).toBe(true);
    });

    test('should handle files without extension', async () => {
        await fs.writeFile(path.join(testDir, 'Makefile'), 'content');

        await organizeDirectory(testDir, {});

        expect(fsSync.existsSync(path.join(testDir, 'Others', 'Makefile'))).toBe(true);
    });

    test('should skip existing category folders', async () => {
        await fs.mkdir(path.join(testDir, 'Images'), { recursive: true });
        await fs.writeFile(path.join(testDir, 'photo.jpg'), 'image');

        await organizeDirectory(testDir, {});

        expect(fsSync.existsSync(path.join(testDir, 'Images', 'photo.jpg'))).toBe(true);
    });

    test('should create log file after organizing', async () => {
        await fs.writeFile(path.join(testDir, 'test.pdf'), 'content');

        await organizeDirectory(testDir, {});

        expect(fsSync.existsSync(path.join(testDir, LOG_FILE_NAME))).toBe(true);
    });

    test('should throw on non-existent directory', async () => {
        await expect(organizeDirectory('/non/existent/path', {}))
            .rejects.toThrow('Directory does not exist');
    });

    test('should throw on null directory', async () => {
        await expect(organizeDirectory(null, {}))
            .rejects.toThrow('Target directory must be a non-empty string');
    });

    test('should throw on empty directory', async () => {
        await expect(organizeDirectory('', {}))
            .rejects.toThrow('Target directory must be a non-empty string');
    });

    test('should throw when path is a file', async () => {
        const filePath = path.join(testDir, 'not-a-dir.txt');
        await fs.writeFile(filePath, 'content');

        await expect(organizeDirectory(filePath, {}))
            .rejects.toThrow('Path is not a directory');
    });

    test('should handle empty directory', async () => {
        await organizeDirectory(testDir, {});
    });

    test('should handle directory with only subdirectories', async () => {
        await fs.mkdir(path.join(testDir, 'subdir'), { recursive: true });
        await organizeDirectory(testDir, {});
    });

    test('should throw on whitespace-only directory', async () => {
        await expect(organizeDirectory('   ', {}))
            .rejects.toThrow('Target directory must be a non-empty string');
    });
});

// ==================== Dry Run Tests ====================
describe('Dry Run Mode', () => {
    beforeEach(async () => {
        await createTestDir();
    });

    afterEach(async () => {
        await cleanupTestDir();
    });

    test('should not move files in dry-run mode', async () => {
        await fs.writeFile(path.join(testDir, 'photo.jpg'), 'image');

        await organizeDirectory(testDir, { dryRun: true });

        expect(fsSync.existsSync(path.join(testDir, 'photo.jpg'))).toBe(true);
        expect(fsSync.existsSync(path.join(testDir, 'Images'))).toBe(false);
    });

    test('should not create log file in dry-run', async () => {
        await fs.writeFile(path.join(testDir, 'test.pdf'), 'content');

        await organizeDirectory(testDir, { dryRun: true });

        expect(fsSync.existsSync(path.join(testDir, LOG_FILE_NAME))).toBe(false);
    });

    test('should not create directories in dry-run', async () => {
        await fs.writeFile(path.join(testDir, 'photo.jpg'), 'image');

        await organizeDirectory(testDir, { dryRun: true });

        expect(fsSync.existsSync(path.join(testDir, 'Images'))).toBe(false);
    });
});

// ==================== Organize by Date Tests ====================
describe('Organize by Date', () => {
    beforeEach(async () => {
        await createTestDir();
    });

    afterEach(async () => {
        await cleanupTestDir();
    });

    test('should organize by year and month', async () => {
        const filePath = path.join(testDir, 'test.pdf');
        await fs.writeFile(filePath, 'content');

        await organizeDirectory(testDir, { byDate: true });

        const now = new Date();
        const year = now.getFullYear().toString();
        const month = getMonthName(now);

        expect(fsSync.existsSync(path.join(testDir, year, month, 'test.pdf'))).toBe(true);
    });
});

// ==================== Verbose Mode Tests ====================
describe('Verbose Mode', () => {
    beforeEach(async () => {
        await createTestDir();
    });

    afterEach(async () => {
        await cleanupTestDir();
    });

    test('should log moves in verbose mode', async () => {
        await fs.writeFile(path.join(testDir, 'test.pdf'), 'content');

        await organizeDirectory(testDir, { verbose: true });

        expect(fsSync.existsSync(path.join(testDir, 'Documents', 'test.pdf'))).toBe(true);
    });

    test('should log ignored files in verbose mode', async () => {
        await fs.writeFile(path.join(testDir, 'test.log'), 'log');
        await fs.writeFile(path.join(testDir, 'doc.pdf'), 'doc');

        await organizeDirectory(testDir, { verbose: true, ignore: '*.log' });

        expect(fsSync.existsSync(path.join(testDir, 'test.log'))).toBe(true);
        expect(fsSync.existsSync(path.join(testDir, 'Documents', 'doc.pdf'))).toBe(true);
    });

    test('should log skipped category folders in verbose mode', async () => {
        await fs.mkdir(path.join(testDir, 'Documents'), { recursive: true });
        await fs.writeFile(path.join(testDir, 'test.pdf'), 'content');

        await organizeDirectory(testDir, { verbose: true });

        expect(fsSync.existsSync(path.join(testDir, 'Documents', 'test.pdf'))).toBe(true);
    });
});

// ==================== Ignore Patterns Tests ====================
describe('Ignore Patterns', () => {
    beforeEach(async () => {
        await createTestDir();
    });

    afterEach(async () => {
        await cleanupTestDir();
    });

    test('should ignore files matching pattern', async () => {
        await fs.writeFile(path.join(testDir, 'debug.log'), 'log');
        await fs.writeFile(path.join(testDir, 'test.pdf'), 'doc');

        await organizeDirectory(testDir, { ignore: '*.log' });

        expect(fsSync.existsSync(path.join(testDir, 'debug.log'))).toBe(true);
        expect(fsSync.existsSync(path.join(testDir, 'Documents', 'test.pdf'))).toBe(true);
    });

    test('should handle multiple ignore patterns', async () => {
        await fs.writeFile(path.join(testDir, 'debug.log'), 'log');
        await fs.writeFile(path.join(testDir, 'temp.tmp'), 'temp');
        await fs.writeFile(path.join(testDir, 'test.pdf'), 'doc');

        await organizeDirectory(testDir, { ignore: '*.log,*.tmp' });

        expect(fsSync.existsSync(path.join(testDir, 'debug.log'))).toBe(true);
        expect(fsSync.existsSync(path.join(testDir, 'temp.tmp'))).toBe(true);
        expect(fsSync.existsSync(path.join(testDir, 'Documents', 'test.pdf'))).toBe(true);
    });
});

// ==================== Custom Config Tests ====================
describe('Custom Config', () => {
    beforeEach(async () => {
        await createTestDir();
    });

    afterEach(async () => {
        await cleanupTestDir();
    });

    test('should use custom categories', async () => {
        const configPath = path.join(testDir, 'config.json');
        await fs.writeFile(configPath, JSON.stringify({
            "CustomDocs": [".custom", ".myext"]
        }));
        await fs.writeFile(path.join(testDir, 'test.custom'), 'content');

        await organizeDirectory(testDir, { config: configPath });

        expect(fsSync.existsSync(path.join(testDir, 'CustomDocs', 'test.custom'))).toBe(true);
    });
});

// ==================== File Rename Tests ====================
describe('File Rename on Conflict', () => {
    beforeEach(async () => {
        await createTestDir();
    });

    afterEach(async () => {
        await cleanupTestDir();
    });

    test('should rename file if destination exists', async () => {
        await fs.mkdir(path.join(testDir, 'Documents'), { recursive: true });
        await fs.writeFile(path.join(testDir, 'Documents', 'test.pdf'), 'existing');
        await fs.writeFile(path.join(testDir, 'test.pdf'), 'new');

        await organizeDirectory(testDir, {});

        expect(fsSync.existsSync(path.join(testDir, 'Documents', 'test.pdf'))).toBe(true);
        expect(fsSync.existsSync(path.join(testDir, 'Documents', 'test(1).pdf'))).toBe(true);
    });
});

// ==================== undoOrganize Tests ====================
describe('undoOrganize', () => {
    beforeEach(async () => {
        await createTestDir();
    });

    afterEach(async () => {
        await cleanupTestDir();
    });

    test('should restore files to original locations', async () => {
        await fs.writeFile(path.join(testDir, 'test.pdf'), 'content');
        await organizeDirectory(testDir, {});

        expect(fsSync.existsSync(path.join(testDir, 'Documents', 'test.pdf'))).toBe(true);

        await undoOrganize(testDir);

        expect(fsSync.existsSync(path.join(testDir, 'test.pdf'))).toBe(true);
    });

    test('should handle no log file gracefully', async () => {
        await undoOrganize(testDir);
    });

    test('should throw on null directory', async () => {
        await expect(undoOrganize(null))
            .rejects.toThrow('Target directory must be a non-empty string');
    });

    test('should throw on empty directory', async () => {
        await expect(undoOrganize(''))
            .rejects.toThrow('Target directory must be a non-empty string');
    });

    test('should throw on whitespace-only directory', async () => {
        await expect(undoOrganize('   '))
            .rejects.toThrow('Target directory must be a non-empty string');
    });

    test('should clean up empty directories after undo', async () => {
        await fs.writeFile(path.join(testDir, 'test.pdf'), 'content');
        await organizeDirectory(testDir, {});

        await undoOrganize(testDir);

        expect(fsSync.existsSync(path.join(testDir, 'Documents'))).toBe(false);
    });

    test('should handle blocked original location', async () => {
        await fs.writeFile(path.join(testDir, 'test.pdf'), 'original');
        await organizeDirectory(testDir, {});

        await fs.writeFile(path.join(testDir, 'test.pdf'), 'blocking');

        await undoOrganize(testDir);

        expect(fsSync.existsSync(path.join(testDir, 'test.pdf'))).toBe(true);
        expect(fsSync.existsSync(path.join(testDir, 'test(1).pdf'))).toBe(true);
    });

    test('should handle empty operations log', async () => {
        const logPath = path.join(testDir, LOG_FILE_NAME);
        await fs.writeFile(logPath, JSON.stringify([{
            timestamp: new Date().toISOString(),
            operations: []
        }]));

        await undoOrganize(testDir);
    });

    test('should handle empty log array', async () => {
        const logPath = path.join(testDir, LOG_FILE_NAME);
        await fs.writeFile(logPath, JSON.stringify([]));

        await undoOrganize(testDir);
    });
});

// ==================== Interactive Mode Tests ====================
describe('Interactive Mode', () => {
    beforeEach(async () => {
        await createTestDir();
        inquirer.prompt.mockReset();
    });

    afterEach(async () => {
        await cleanupTestDir();
    });

    test('should prompt for each file', async () => {
        await fs.writeFile(path.join(testDir, 'test.pdf'), 'content');

        inquirer.prompt.mockResolvedValueOnce({ confirm: true });

        await organizeDirectory(testDir, { interactive: true });

        expect(inquirer.prompt).toHaveBeenCalled();
        expect(fsSync.existsSync(path.join(testDir, 'Documents', 'test.pdf'))).toBe(true);
    });

    test('should skip file when user declines', async () => {
        await fs.writeFile(path.join(testDir, 'test.pdf'), 'content');

        inquirer.prompt.mockResolvedValueOnce({ confirm: false });

        await organizeDirectory(testDir, { interactive: true });

        expect(fsSync.existsSync(path.join(testDir, 'test.pdf'))).toBe(true);
    });

    test('should handle multiple files with mixed responses', async () => {
        await fs.writeFile(path.join(testDir, 'test1.pdf'), 'content1');
        await fs.writeFile(path.join(testDir, 'test2.pdf'), 'content2');

        inquirer.prompt
            .mockResolvedValueOnce({ confirm: true })
            .mockResolvedValueOnce({ confirm: false });

        await organizeDirectory(testDir, { interactive: true });

        const docsDir = path.join(testDir, 'Documents');
        const movedCount = fsSync.existsSync(docsDir) ?
            fsSync.readdirSync(docsDir).length : 0;

        expect(movedCount).toBe(1);
    });
});

// ==================== showCategories Tests ====================
describe('showCategories', () => {
    beforeEach(async () => {
        await createTestDir();
    });

    afterEach(async () => {
        await cleanupTestDir();
    });

    test('should display default categories', async () => {
        await showCategories();
    });

    test('should display custom categories', async () => {
        const configPath = path.join(testDir, 'config.json');
        await fs.writeFile(configPath, JSON.stringify({
            "CustomCategory": [".custom"]
        }));

        await showCategories(configPath);
    });

    test('should throw on invalid config', async () => {
        await expect(showCategories('/non/existent/config.json')).rejects.toThrow();
    });
});

// ==================== generateSampleConfig Tests ====================
describe('generateSampleConfig', () => {
    beforeEach(async () => {
        await createTestDir();
    });

    afterEach(async () => {
        await cleanupTestDir();
    });

    test('should create valid config file', async () => {
        const configPath = path.join(testDir, 'sample.json');
        const result = await generateSampleConfig(configPath);

        expect(result).toBeDefined();
        expect(result.Images).toBeDefined();
        expect(result.Documents).toBeDefined();

        const content = JSON.parse(await fs.readFile(configPath, 'utf-8'));
        expect(content).toEqual(result);
    });

    test('should throw on null path', async () => {
        await expect(generateSampleConfig(null))
            .rejects.toThrow('Output path must be a non-empty string');
    });

    test('should throw on empty path', async () => {
        await expect(generateSampleConfig(''))
            .rejects.toThrow('Output path must be a non-empty string');
    });
});

// ==================== CLI Tests ====================
describe('CLI', () => {
    test('should create program with correct name', () => {
        const program = createProgram();
        expect(program.name()).toBe('segre');
    });

    test('should have correct version', () => {
        const program = createProgram();
        expect(program.version()).toBe('1.0.2');
    });

    test('should have all required commands', () => {
        const program = createProgram();
        const commands = program.commands.map(cmd => cmd.name());
        expect(commands).toContain('undo');
        expect(commands).toContain('categories');
        expect(commands).toContain('init-config');
    });

    test('should have all required options', () => {
        const program = createProgram();
        const optionFlags = program.options.map(opt => opt.long);
        expect(optionFlags).toContain('--config');
        expect(optionFlags).toContain('--dry-run');
        expect(optionFlags).toContain('--interactive');
        expect(optionFlags).toContain('--by-date');
        expect(optionFlags).toContain('--ignore');
        expect(optionFlags).toContain('--verbose');
    });
});

// ==================== Undo Error Count Tests ====================
describe('undoOrganize error handling', () => {
    test('should display error count when files cannot be restored', async () => {
        const testDir = await createTestDir();
        const logPath = path.join(testDir, '.segre-log.json');

        // Create a log with a file that doesn't exist (will cause error)
        // Log format is an array of batches
        const fakeLog = [{
            timestamp: new Date().toISOString(),
            operations: [
                {
                    original: path.join(testDir, 'nonexistent.txt'),
                    movedTo: path.join(testDir, 'fake', 'nonexistent.txt')
                }
            ]
        }];
        await fs.writeFile(logPath, JSON.stringify(fakeLog));

        // This should handle the error gracefully and show error count
        await undoOrganize(testDir);

        await cleanupTestDir();
    });
});
