/**
 * CLI command definitions
 * @module cli
 */

const { Command } = require('commander');
const chalk = require('chalk');

const { organizeDirectory, undoOrganize, showCategories } = require('./organizer');
const { generateSampleConfig } = require('./config');

const VERSION = '1.0.0';

/**
 * Create and configure CLI program
 * @returns {Command} Configured commander program
 */
function createProgram() {
    const program = new Command();

    program
        .name('segre')
        .description('Professional CLI tool to organize files into categories')
        .version(VERSION);

    // Main organize command
    program
        .argument('<directory>', 'Directory to organize')
        .option('-c, --config <path>', 'Path to custom categories config file (JSON)')
        .option('-d, --dry-run', 'Show what would happen without moving files')
        .option('-i, --interactive', 'Ask before moving each file')
        .option('-b, --by-date', 'Organize files by modification date (Year/Month)')
        .option('--ignore <patterns>', 'Comma-separated patterns to ignore (e.g., node_modules,.git,*.log)')
        .option('-v, --verbose', 'Show detailed output')
        /* istanbul ignore next */
        .action(async (directory, options) => {
            try {
                console.log(chalk.bold(`\nSegre v${VERSION}\n`));
                await organizeDirectory(directory, options);
                console.log('');
            } catch (error) {
                process.exit(1);
            }
        });

    // Undo command
    program
        .command('undo <directory>')
        .description('Undo the last organize operation')
        /* istanbul ignore next */
        .action(async (directory) => {
            try {
                console.log(chalk.bold('\nSegre - Undo\n'));
                await undoOrganize(directory);
                console.log('');
            } catch (error) {
                process.exit(1);
            }
        });

    // Show categories command
    program
        .command('categories')
        .description('Show file categories and their extensions')
        .option('-c, --config <path>', 'Path to custom categories config file')
        /* istanbul ignore next */
        .action(async (options) => {
            try {
                await showCategories(options.config);
            } catch (error) {
                console.error(chalk.red(`Error: ${error.message}`));
                process.exit(1);
            }
        });

    // Generate sample config command
    program
        .command('init-config')
        .description('Generate a sample config file')
        .argument('[path]', 'Output path for config file', './segre.config.json')
        /* istanbul ignore next */
        .action(async (outputPath) => {
            try {
                await generateSampleConfig(outputPath);
            } catch (error) {
                console.error(chalk.red(`Error creating config: ${error.message}`));
                process.exit(1);
            }
        });

    return program;
}

/**
 * Run the CLI
 */
/* istanbul ignore next */
function run() {
    const program = createProgram();
    program.parse(process.argv);
}

module.exports = {
    VERSION,
    createProgram,
    run
};
