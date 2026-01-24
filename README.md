# Segre

A CLI tool to organize (segregate) files into categories.
# Segre

![npm](https://img.shields.io/npm/v/segre)
![npm downloads](https://img.shields.io/npm/dw/segre)
![Node.js >= 18](https://img.shields.io/badge/node-%3E%3D18-brightgreen)
![License](https://img.shields.io/github/license/ShubhamSPawade/segre)
![Build Status](https://github.com/ShubhamSPawade/segre/actions/workflows/ci.yml/badge.svg)
![Coverage](https://img.shields.io/codecov/c/github/ShubhamSPawade/segre)
![GitHub issues](https://img.shields.io/github/issues/ShubhamSPawade/segre)
![GitHub stars](https://img.shields.io/github/stars/ShubhamSPawade/segre?style=social)
![GitHub last commit](https://img.shields.io/github/last-commit/ShubhamSPawade/segre)


## Features

- **Organize by Category**: Automatically sort files into folders like Images, Documents, Audio, Videos, Code, Archives, etc.
- **Organize by Date**: Sort files into Year/Month folders based on modification date
- **Dry Run Mode**: Preview what would happen without making changes
- **Interactive Mode**: Confirm each file move individually
- **Custom Config**: Define your own categories via JSON config file
- **Ignore Patterns**: Skip files matching specific patterns
- **Undo Support**: Revert the last organization operation
- **Progress Bar**: Visual feedback during organization
- **Professional Output**: Clean, professional CLI output

## Prerequisites

- Node.js >= 18 (Node 20 LTS recommended)
- npm >= 8

## Installation

### Quick Use (No Installation Required)

Run directly using npx - no installation needed:

```bash
npx segre ./my-folder
```

### Global Installation

Install once and use anywhere on your system:

```bash
npm install -g segre
```

After global installation, you can use `segre` command from any directory.

### Local Installation (For Development)

```bash
# Clone and install locally
npm install
npm link
```

## Usage

### Basic Usage

```bash
# Organize files in a directory
segre ./my-folder

# Preview changes without moving files
segre ./my-folder --dry-run

# Organize with verbose output
segre ./my-folder --verbose
```

### Organize by Date

```bash
# Sort files into Year/Month folders
segre ./my-folder --by-date
```

### Interactive Mode

```bash
# Confirm each file move
segre ./my-folder --interactive
```

### Ignore Files

```bash
# Ignore specific patterns
segre ./my-folder --ignore "*.log,*.tmp,node_modules"
```

### Custom Categories

```bash
# Generate a sample config file
segre init-config

# Use custom categories
segre ./my-folder --config ./segre.config.json
```

### View Categories

```bash
# Show default categories
segre categories

# Show custom categories
segre categories --config ./segre.config.json
```

### Undo Last Operation

```bash
# Restore files to original locations
segre undo ./my-folder
```

## Options

| Option | Alias | Description |
|--------|-------|-------------|
| `--config <path>` | `-c` | Path to custom categories config file (JSON) |
| `--dry-run` | `-d` | Show what would happen without moving files |
| `--interactive` | `-i` | Ask before moving each file |
| `--by-date` | `-b` | Organize files by modification date (Year/Month) |
| `--ignore <patterns>` | | Comma-separated patterns to ignore |
| `--verbose` | `-v` | Show detailed output |

## Commands

| Command | Description |
|---------|-------------|
| `segre <directory>` | Organize files in directory |
| `segre undo <directory>` | Undo last organization |
| `segre categories` | Show file categories |
| `segre init-config [path]` | Generate sample config file |

## Default Categories

- **Archives**: .zip, .tar, .gz, .rar, .7z, .bz2, .xz
- **Audio**: .mp3, .wav, .flac, .aac, .ogg, .wma, .m4a
- **Code**: .js, .ts, .css, .html, .py, .java, .cpp, .c, .h, .jsx, .tsx, .vue, .rb, .go, .rs, .php, .swift, .kt
- **Documents**: .pdf, .doc, .docx, .xls, .xlsx, .ppt, .pptx, .txt, .rtf, .odt, .ods, .odp, .md, .csv
- **Executables**: .exe, .msi, .dmg, .app, .deb, .rpm, .sh, .bat, .cmd
- **Fonts**: .ttf, .otf, .woff, .woff2, .eot
- **Images**: .jpg, .jpeg, .png, .gif, .bmp, .tiff, .svg, .webp, .ico, .raw, .psd, .ai
- **Videos**: .mp4, .mkv, .avi, .mov, .wmv, .flv, .webm, .m4v, .mpeg, .mpg
- **Others**: Files that don't match any category

## Custom Config Example

```json
{
  "Images": [".jpg", ".jpeg", ".png", ".gif", ".webp"],
  "Documents": [".pdf", ".doc", ".docx", ".txt", ".md"],
  "Audio": [".mp3", ".wav", ".flac"],
  "Videos": [".mp4", ".mkv", ".avi"],
  "Code": [".js", ".ts", ".py", ".java"],
  "Archives": [".zip", ".rar", ".7z"],
  "MyCustomCategory": [".custom", ".myext"],
  "Others": []
}
```

## Project Structure

```
segre/
├── bin/
│   └── segre.js          # CLI entry point
├── src/
│   ├── index.js          # Main exports
│   ├── categories.js     # Category definitions
│   ├── cli.js            # CLI commands
│   ├── config.js         # Config loading
│   ├── logger.js         # Operation logging
│   ├── organizer.js      # Core logic
│   ├── utils.js          # Utility functions
│   └── index.test.js     # Tests
├── package.json
└── README.md
```

## Development

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## License

MIT License - see [LICENSE](LICENSE) for details.

## Author

**Shubham Pawade**

---

Made with ❤️ by Shubham Pawade
