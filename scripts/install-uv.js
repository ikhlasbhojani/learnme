#!/usr/bin/env node

const { execSync } = require('child_process');
const os = require('os');
let chalk;
try {
  chalk = require('chalk');
} catch (e) {
  // Fallback if chalk is not installed yet
  chalk = {
    yellow: (s) => s,
    cyan: (s) => s,
    green: (s) => s,
    red: (s) => s
  };
}

/**
 * Check if uv is installed
 */
function isUvInstalled() {
  try {
    execSync('uv --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Install uv based on platform
 */
async function installUv() {
  const platform = os.platform();
  
  console.log(chalk.yellow('\n📦 uv not found. Installing uv...'));
  
  try {
    if (platform === 'win32') {
      // Windows - Use PowerShell installer
      console.log(chalk.cyan('Installing uv for Windows...'));
      execSync('powershell -c "irm https://astral.sh/uv/install.ps1 | iex"', { 
        stdio: 'inherit',
        shell: 'powershell.exe'
      });
    } else {
      // macOS and Linux - Use shell installer
      console.log(chalk.cyan(`Installing uv for ${platform}...`));
      execSync('curl -LsSf https://astral.sh/uv/install.sh | sh', { 
        stdio: 'inherit',
        shell: '/bin/bash'
      });
    }
    
    console.log(chalk.green('✅ uv installed successfully!\n'));
    return true;
  } catch (error) {
    console.error(chalk.red('❌ Failed to install uv automatically.\n'));
    console.log(chalk.yellow('Please install uv manually:'));
    console.log(chalk.cyan('Visit: https://docs.astral.sh/uv/\n'));
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  if (isUvInstalled()) {
    console.log(chalk.green('✅ uv is already installed'));
    return true;
  }
  
  return await installUv();
}

// Run if called directly
if (require.main === module) {
  main().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { isUvInstalled, installUv };

