# Publishing LearnMe as NPX Package

## Pre-Publishing Checklist

- [x] Root `package.json` created with `bin` field
- [x] CLI entry point (`bin/learnme.js`) created
- [x] Interactive setup wizard implemented
- [x] Environment file auto-generation
- [x] Dependencies installation on first run
- [x] Frontend build automation
- [x] Backend serves frontend static files
- [x] `.npmignore` configured
- [x] SQLite database (no MongoDB needed)

## How to Publish

### 1. Test Locally First

```bash
# Test the CLI locally
npm link

# From another directory, test
npx learnme

# Or test with the local package
learnme
```

### 2. Prepare for Publishing

```bash
# Make sure you're logged in
npm login

# Check package name availability
npm view learnme

# If name is taken, use a scoped package:
# Change "name" in package.json to "@yourusername/learnme"
```

### 3. Publish

```bash
# Publish to npm
npm publish

# For scoped packages (if using @yourusername/learnme):
npm publish --access public
```

### 4. Test Published Package

```bash
# From a different directory
npx learnme

# Or install globally
npm install -g learnme
learnme
```

## Package Structure

```
learnme/
├── bin/
│   ├── learnme.js          # CLI entry point
│   └── postinstall.js      # Post-install script
├── backend/                # Backend code
├── frontend/               # Frontend code
├── package.json            # Root package.json
├── .npmignore             # Files to exclude
└── README.md              # Documentation
```

## What Users Will Experience

1. **First Run:**
   ```
   $ npx learnme
   
   Welcome to LearnMe! 🎓
   
   ? Enter your Gemini API Key: [user types key]
   ? Choose a port (default: 5000): [user presses Enter]
   
   ✓ Configuration saved!
   ✓ Installing dependencies...
   ✓ Building frontend...
   ✓ Starting servers...
   
   🎉 LearnMe is ready!
      Application: http://localhost:5000
   ```

2. **Subsequent Runs:**
   ```
   $ npx learnme
   
   ✓ Using saved configuration...
   ✓ Starting servers...
   
   🎉 LearnMe is ready!
      Application: http://localhost:5000
   ```

## Version Management

When updating the package:

```bash
# Update version
npm version patch  # 1.0.0 -> 1.0.1
npm version minor  # 1.0.0 -> 1.1.0
npm version major  # 1.0.0 -> 2.0.0

# Publish new version
npm publish
```

## Important Notes

1. **Package Size:** The package includes source code but not `node_modules`. Dependencies are installed on first run.

2. **Environment Files:** The `.env` file is created in the user's current directory, not in the package directory.

3. **Database:** SQLite database is created automatically at `./data/learnme.db` relative to where the user runs the command.

4. **Port Conflicts:** The CLI automatically detects port conflicts and suggests alternatives.

5. **API Key:** Users must provide their own Gemini API key. The app will work without it but quiz generation features won't function.

## Troubleshooting

**Issue:** Package name already taken
- Solution: Use a scoped package name: `@yourusername/learnme`

**Issue:** Users can't find the CLI
- Solution: Make sure `bin` field in package.json points to the correct file

**Issue:** Dependencies not installing
- Solution: Check that `postinstall.js` and dependency installation logic is correct

**Issue:** Frontend not serving
- Solution: Verify `FRONTEND_DIST_PATH` environment variable is set correctly

