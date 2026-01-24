/**
 * Core file organization logic
 * @module organizer
 */

const fs = require('fs/promises');
const path = require('path');
const chalk = require('chalk');
const cliProgress = require('cli-progress');
const ora = require('ora');
const inquirer = require('inquirer');

const { defaultCategories, getCategory } = require('./categories');
const { getUniqueFilePath, getMonthName, shouldIgnore } = require('./utils');
const { loadConfig } = require('./config');
const { LOG_FILE_NAME, saveLog, readLog, updateLog } = require('./logger');

/**
 * Recursively collect all files from a directory
 * @param {string} dir - Directory to scan
 * @param {string} baseDir - Base directory for organization
 * @param {string[]} categoryFolders - Category folder names to skip
 * @param {string[]} ignorePatterns - Patterns to ignore
 * @param {Object} options - CLI options
 * @returns {Promise<Array>} Array of file objects
 */
async function collectFilesRecursively(dir, baseDir, categoryFolders, ignorePatterns, options) {
    const files = [];
    const entries = await fs.readdir(dir);

    for (const entry of entries) {
        const entryPath = path.join(dir, entry);

        // Skip log file
        if (entry === LOG_FILE_NAME) continue;

        // Skip ignored patterns
        if (shouldIgnore(entryPath, ignorePatterns)) {
            if (options.verbose) {
                console.log(chalk.gray(`  Ignoring: ${path.relative(baseDir, entryPath)}`));
            }
            continue;
        }

        // Skip category folders at base level
        if (dir === baseDir && categoryFolders.includes(entry)) {
            if (options.verbose) {
                console.log(chalk.gray(`  Skipping category folder: ${entry}`));
            }
            continue;
        }

        const stats = await fs.stat(entryPath);

        if (stats.isFile()) {
            files.push({
                name: entry,
                path: entryPath,
                stats: stats
            });
        } else if (stats.isDirectory() && options.recursive) {
            // Skip category folders during recursive scan
            if (categoryFolders.includes(entry)) {
                if (options.verbose) {
                    console.log(chalk.gray(`  Skipping category folder: ${path.relative(baseDir, entryPath)}`));
                }
                continue;
            }
            // Recursively collect files from subdirectories
            const subFiles = await collectFilesRecursively(entryPath, baseDir, categoryFolders, ignorePatterns, options);
            files.push(...subFiles);
        }
    }

    return files;
}

/**
 * Recursively clean up empty directories
 * @param {string} dir - Directory to clean
 * @param {string[]} categoryFolders - Category folders to skip
 */
async function cleanupEmptyDirectories(dir, categoryFolders) {
    const entries = await fs.readdir(dir);

    for (const entry of entries) {
        const entryPath = path.join(dir, entry);

        // Skip category folders
        if (categoryFolders.includes(entry)) continue;

        try {
            const stats = await fs.stat(entryPath);
            if (stats.isDirectory()) {
                // Recursively clean subdirectories first
                await cleanupEmptyDirectories(entryPath, categoryFolders);

                // Check if directory is now empty
                const contents = await fs.readdir(entryPath);
                if (contents.length === 0) {
                    await fs.rmdir(entryPath);
                }
            }
        } catch {
            // Directory may have been deleted already
        }
    }
}

/**
 * Main organize function
 * @param {string} targetDir - Directory to organize
 * @param {Object} options - CLI options
 */
async function organizeDirectory(targetDir, options = {}) {
    // Validate targetDir before starting spinner
    if (!targetDir || typeof targetDir !== 'string' || targetDir.trim() === '') {
        throw new Error('Target directory must be a non-empty string');
    }

    const spinner = ora({
        text: 'Scanning directory...',
        spinner: 'dots'
    }).start();

    try {
        // Resolve absolute path
        targetDir = path.resolve(targetDir);

        // Check if directory exists
        try {
            await fs.access(targetDir);
        } catch {
            throw new Error(`Directory does not exist: ${targetDir}`);
        }

        // Verify it's a directory
        const dirStats = await fs.stat(targetDir);
        if (!dirStats.isDirectory()) {
            throw new Error(`Path is not a directory: ${targetDir}`);
        }

        // Load categories (custom or default)
        let categories = defaultCategories;
        if (options.config) {
            categories = await loadConfig(options.config);
        }

        // Get category folder names for skipping
        const categoryFolders = Object.keys(categories);

        // Parse ignore patterns
        const ignorePatterns = options.ignore ? options.ignore.split(',').map(p => p.trim()) : [];

        // Collect files (recursively if enabled)
        let filesToProcess;

        if (options.recursive) {
            filesToProcess = await collectFilesRecursively(targetDir, targetDir, categoryFolders, ignorePatterns, options);
        } else {
            // Read directory contents (non-recursive)
            const files = await fs.readdir(targetDir);
            filesToProcess = [];

            for (const file of files) {
                const filePath = path.join(targetDir, file);

                // Skip log file
                if (file === LOG_FILE_NAME) continue;

                // Skip ignored patterns
                if (shouldIgnore(filePath, ignorePatterns)) {
                    if (options.verbose) {
                        console.log(chalk.gray(`  Ignoring: ${file}`));
                    }
                    continue;
                }

                // Skip category folders (prevent re-organizing)
                if (categoryFolders.includes(file)) {
                    if (options.verbose) {
                        console.log(chalk.gray(`  Skipping category folder: ${file}`));
                    }
                    continue;
                }

                const stats = await fs.stat(filePath);

                if (stats.isFile()) {
                    filesToProcess.push({
                        name: file,
                        path: filePath,
                        stats: stats
                    });
                }
            }
        }

        const modeText = options.recursive ? ' (recursive)' : '';
        spinner.stopAndPersist({
            symbol: chalk.green('[OK]'),
            text: chalk.green(`Found ${filesToProcess.length} files to organize${modeText}`)
        });

        if (filesToProcess.length === 0) {
            console.log(chalk.yellow('No files to organize.'));
            return;
        }

        // Process files
        const operations = [];
        let processedCount = 0;
        let skippedCount = 0;

        // Setup progress bar
        const progressBar = new cliProgress.SingleBar({
            format: 'Organizing |' + chalk.cyan('{bar}') + '| {percentage}% | {value}/{total} files',
            barCompleteChar: '\u2588',
            barIncompleteChar: '\u2591',
            hideCursor: true
        });

        if (!options.dryRun && !options.interactive) {
            progressBar.start(filesToProcess.length, 0);
        }

        for (const file of filesToProcess) {
            const ext = path.extname(file.name).toLowerCase();
            let targetSubDir;

            if (options.byDate) {
                // Organize by date
                const fileDate = file.stats.mtime;
                const year = fileDate.getFullYear().toString();
                const month = getMonthName(fileDate);
                targetSubDir = path.join(targetDir, year, month);
            } else {
                // Organize by category
                const category = getCategory(ext, categories);
                targetSubDir = path.join(targetDir, category);
            }

            const newFilePath = await getUniqueFilePath(path.join(targetSubDir, file.name));

            // Dry run mode
            if (options.dryRun) {
                const relativeSource = path.relative(targetDir, file.path);
                const relativeDest = path.relative(targetDir, newFilePath);
                console.log(chalk.blue(`  [DRY RUN] Would move: ${relativeSource} → ${relativeDest}`));
                continue;
            }

            // Interactive mode
            if (options.interactive) {
                const relativeSource = path.relative(targetDir, file.path);
                const relativeDest = path.relative(targetDir, path.dirname(newFilePath));
                const { confirm } = await inquirer.prompt([{
                    type: 'confirm',
                    name: 'confirm',
                    message: `Move ${chalk.cyan(relativeSource)} → ${chalk.yellow(relativeDest)}?`,
                    default: true
                }]);

                if (!confirm) {
                    skippedCount++;
                    continue;
                }
            }

            // Create target directory if it doesn't exist
            await fs.mkdir(targetSubDir, { recursive: true });

            // Move file
            try {
                await fs.rename(file.path, newFilePath);

                operations.push({
                    original: file.path,
                    movedTo: newFilePath
                });

                processedCount++;

                if (options.verbose && !options.interactive) {
                    progressBar.stop();
                    const relativeSource = path.relative(targetDir, file.path);
                    console.log(chalk.green(`  [OK] Moved: ${relativeSource} -> ${path.relative(targetDir, newFilePath)}`));
                    progressBar.start(filesToProcess.length, processedCount);
                }
            } catch (error) {
                /* istanbul ignore next */
                if (options.verbose) {
                    const relativeSource = path.relative(targetDir, file.path);
                    console.log(chalk.red(`  [ERROR] Moving ${relativeSource}: ${error.message}`));
                }
            }

            if (!options.interactive) {
                progressBar.update(processedCount + skippedCount);
            }
        }

        if (!options.dryRun && !options.interactive) {
            progressBar.stop();
        }

        // Save log for undo
        if (operations.length > 0 && !options.dryRun) {
            await saveLog(targetDir, operations);
        }

        // Clean up empty directories after recursive organization
        if (options.recursive && !options.dryRun && operations.length > 0) {
            await cleanupEmptyDirectories(targetDir, categoryFolders);
        }

        // Summary
        console.log('');
        console.log(chalk.bold('Summary:'));
        if (options.dryRun) {
            console.log(chalk.blue(`  Would move: ${filesToProcess.length} files`));
        } else {
            console.log(chalk.green(`  Moved: ${processedCount} files`));
            if (skippedCount > 0) {
                console.log(chalk.yellow(`  Skipped: ${skippedCount} files`));
            }
        }

    } catch (error) {
        spinner.stopAndPersist({
            symbol: chalk.red('[ERROR]'),
            text: chalk.red(`Error: ${error.message}`)
        });
        throw error;
    }
}

/**
 * Undo last organize operation
 * @param {string} targetDir - Directory with log file
 * @throws {Error} If undo operation fails
 */
async function undoOrganize(targetDir) {
    // Validate targetDir before starting spinner
    if (!targetDir || typeof targetDir !== 'string' || targetDir.trim() === '') {
        throw new Error('Target directory must be a non-empty string');
    }

    const spinner = ora({
        text: 'Reading operation log...',
        spinner: 'dots'
    }).start();

    try {
        targetDir = path.resolve(targetDir);

        const log = await readLog(targetDir);

        if (!log) {
            spinner.stopAndPersist({
                symbol: chalk.red('[ERROR]'),
                text: chalk.red('No operation log found. Nothing to undo.')
            });
            return;
        }

        if (log.length === 0) {
            spinner.stopAndPersist({
                symbol: chalk.red('[ERROR]'),
                text: chalk.red('No operations to undo.')
            });
            return;
        }

        // Get the last operation batch
        const lastBatch = log.pop();
        const operations = lastBatch.operations;

        spinner.stopAndPersist({
            symbol: chalk.green('[OK]'),
            text: chalk.green(`Found ${operations.length} operations from ${lastBatch.timestamp}`)
        });

        // Setup progress bar
        const progressBar = new cliProgress.SingleBar({
            format: 'Undoing |' + chalk.cyan('{bar}') + '| {percentage}% | {value}/{total} files',
            barCompleteChar: '\u2588',
            barIncompleteChar: '\u2591',
            hideCursor: true
        });

        progressBar.start(operations.length, 0);

        let restoredCount = 0;
        let errorCount = 0;

        for (let i = 0; i < operations.length; i++) {
            const op = operations[i];

            try {
                // Check if moved file still exists
                await fs.access(op.movedTo);

                // Get unique path if original location is blocked
                const restorePath = await getUniqueFilePath(op.original);

                // Move back to original location (or unique path)
                await fs.rename(op.movedTo, restorePath);
                restoredCount++;
            } catch (error) {
                errorCount++;
            }

            progressBar.update(i + 1);
        }

        progressBar.stop();

        // Update log file
        await updateLog(targetDir, log);

        // Cleanup empty category directories
        const categories = Object.keys(defaultCategories);
        for (const category of categories) {
            const categoryDir = path.join(targetDir, category);
            try {
                const files = await fs.readdir(categoryDir);
                if (files.length === 0) {
                    await fs.rmdir(categoryDir);
                }
            } catch {
                // Directory doesn't exist or not empty
            }
        }

        // Summary
        console.log('');
        console.log(chalk.bold('Undo Summary:'));
        console.log(chalk.green(`  Restored: ${restoredCount} files`));
        if (errorCount > 0) {
            console.log(chalk.red(`  Errors: ${errorCount} files`));
        }

    } catch (error) {
        /* istanbul ignore next */
        spinner.stopAndPersist({
            symbol: chalk.red('[ERROR]'),
            text: chalk.red(`Error: ${error.message}`)
        });
        /* istanbul ignore next */
        throw error;
    }
}

/**
 * Show current categories configuration
 * @param {string} configPath - Optional config file path
 */
async function showCategories(configPath) {
    let categories = defaultCategories;

    if (configPath) {
        categories = await loadConfig(configPath);
    }

    console.log(chalk.bold('\nFile Categories:\n'));

    for (const [category, extensions] of Object.entries(categories)) {
        if (extensions.length > 0) {
            console.log(chalk.cyan(`  ${category}:`));
            console.log(chalk.gray(`    ${extensions.join(', ')}`));
        } else {
            console.log(chalk.cyan(`  ${category}:`));
            console.log(chalk.gray(`    (fallback for unmatched files)`));
        }
    }
    console.log('');
}

module.exports = {
    organizeDirectory,
    undoOrganize,
    showCategories
};
