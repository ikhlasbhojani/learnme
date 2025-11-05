#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// This script runs after npm install
// It ensures backend and frontend dependencies are installed

const rootDir = path.resolve(__dirname, '..');
const backendDir = path.join(rootDir, 'backend');
const frontendDir = path.join(rootDir, 'frontend');

console.log('LearnMe: Setting up dependencies...');

// Check if we're in the package directory or in node_modules
const isInstalled = __dirname.includes('node_modules');

if (isInstalled) {
  // If installed via npm/npx, we'll install deps on first run
  // This is handled by the CLI
  console.log('LearnMe: Dependencies will be installed on first run.');
} else {
  // If developing locally, install dependencies
  const { spawn } = require('child_process');
  
  if (fs.existsSync(path.join(backendDir, 'package.json'))) {
    console.log('Installing backend dependencies...');
    spawn('npm', ['install'], {
      cwd: backendDir,
      stdio: 'inherit',
      shell: true
    });
  }
  
  if (fs.existsSync(path.join(frontendDir, 'package.json'))) {
    console.log('Installing frontend dependencies...');
    spawn('npm', ['install'], {
      cwd: frontendDir,
      stdio: 'inherit',
      shell: true
    });
  }
}

