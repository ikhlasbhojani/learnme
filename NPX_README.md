# LearnMe - NPX Package

## Quick Start

Run LearnMe directly with NPX - no installation required!

```bash
npx learnme
```

On first run, you'll be asked to:
- Enter your Gemini API Key (for AI-powered quiz generation)
- Choose a port (default: 5000)

That's it! The application will start automatically.

## Commands

```bash
# Start LearnMe
npx learnme

# Run setup wizard (to update API key or port)
npx learnme --setup

# Show help
npx learnme --help
```

## What Happens

1. **First Run:**
   - Interactive setup wizard asks for your Gemini API Key
   - Dependencies are installed automatically
   - Frontend is built automatically
   - Database is created automatically (SQLite - no setup needed!)
   - Application starts on http://localhost:5000

2. **Subsequent Runs:**
   - Uses saved configuration
   - Starts immediately (no setup needed)

## Requirements

- Node.js 18 or higher
- Gemini API Key (get one from [Google AI Studio](https://makersuite.google.com/app/apikey))

## Features

- ✅ Zero configuration - no database setup needed
- ✅ Interactive setup - just enter your API key
- ✅ Automatic dependency installation
- ✅ Built-in SQLite database
- ✅ Beautiful modern UI
- ✅ AI-powered quiz generation
- ✅ Multiple learning modes

## Troubleshooting

**Port already in use?**
- The CLI will suggest an alternative port automatically

**API Key missing?**
- Run `npx learnme --setup` to add your API key

**Need to reset?**
- Delete the `.env` file in the current directory and run `npx learnme` again

## Publishing

To publish this package to npm:

```bash
npm login
npm publish
```

Users can then install and run:
```bash
npx learnme
```

