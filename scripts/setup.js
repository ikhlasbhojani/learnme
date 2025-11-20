#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
let chalk;
try {
  chalk = require('chalk');
} catch (e) {
  // Fallback if chalk is not installed yet
  chalk = {
    cyan: { bold: (s) => s },
    white: (s) => s,
    gray: (s) => s,
    green: (s) => s,
    yellow: (s) => s,
    red: (s) => s,
    magenta: { bold: (s) => s }
  };
}

// Lazy require - will be loaded after root dependencies are installed
let isUvInstalled, installUv;
function loadInstallUv() {
  if (!isUvInstalled || !installUv) {
    const uvModule = require('./install-uv');
    isUvInstalled = uvModule.isUvInstalled;
    installUv = uvModule.installUv;
  }
  return { isUvInstalled, installUv };
}

/**
 * Display welcome banner
 */
function displayBanner() {
  console.log(chalk.cyan.bold('\n╔══════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('║                                                          ║'));
  console.log(chalk.cyan.bold('║              🎓 LearnMe Setup Wizard 🎓                 ║'));
  console.log(chalk.cyan.bold('║                                                          ║'));
  console.log(chalk.cyan.bold('║          AI-Powered Learning Platform Setup              ║'));
  console.log(chalk.cyan.bold('║                                                          ║'));
  console.log(chalk.cyan.bold('╚══════════════════════════════════════════════════════════╝\n'));
  
  console.log(chalk.white('This wizard will:\n'));
  console.log(chalk.gray('  1. ✅ Check prerequisites'));
  console.log(chalk.gray('  2. 📦 Install root dependencies'));
  console.log(chalk.gray('  3. 📦 Install uv (Python package manager)'));
  console.log(chalk.gray('  4. 📥 Install frontend dependencies'));
  console.log(chalk.gray('  5. 📥 Install Node.js backend dependencies'));
  console.log(chalk.gray('  6. 🐍 Install Python dependencies'));
  console.log(chalk.gray('  7. 🎭 Install Playwright browsers'));
  console.log(chalk.gray('  8. 🚀 You\'ll be ready to start!\n'));
}

/**
 * Check Node.js version
 */
function checkNodeVersion() {
  console.log(chalk.cyan('🔍 Checking Node.js version...'));
  
  try {
    const version = process.version;
    const majorVersion = parseInt(version.slice(1).split('.')[0]);
    
    if (majorVersion < 16) {
      console.error(chalk.red(`❌ Node.js ${version} is too old. Minimum required: v16.0.0`));
      console.log(chalk.yellow('Please upgrade Node.js: https://nodejs.org/\n'));
      return false;
    }
    
    console.log(chalk.green(`✅ Node.js ${version} detected\n`));
    return true;
  } catch (error) {
    console.error(chalk.red('❌ Could not detect Node.js version\n'));
    return false;
  }
}

/**
 * Check if npm is available
 */
function checkNpm() {
  console.log(chalk.cyan('🔍 Checking npm...'));
  
  try {
    const version = execSync('npm --version', { encoding: 'utf8' }).trim();
    console.log(chalk.green(`✅ npm ${version} detected\n`));
    return true;
  } catch (error) {
    console.error(chalk.red('❌ npm is not installed\n'));
    return false;
  }
}

/**
 * Check if root dependencies are installed
 */
function areRootDependenciesInstalled() {
  const nodeModulesPath = path.join(process.cwd(), 'node_modules');
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    return false;
  }
  
  // Check if node_modules exists and has required packages
  if (!fs.existsSync(nodeModulesPath)) {
    return false;
  }
  
  // Check for key dependencies
  const requiredPackages = ['chalk', 'concurrently', 'cross-env'];
  for (const pkg of requiredPackages) {
    const pkgPath = path.join(nodeModulesPath, pkg);
    if (!fs.existsSync(pkgPath)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Install root dependencies
 */
function installRootDependencies() {
  // Use plain console.log since chalk might not be installed yet
  console.log('\n📦 Installing root dependencies...\n');
  console.log('This is required for setup and start scripts...\n');
  
  try {
    execSync('npm install', {
      cwd: process.cwd(),
      stdio: 'inherit'
    });
    
    console.log('\n✅ Root dependencies installed successfully!\n');
    
    // Now require chalk properly after installation
    try {
      delete require.cache[require.resolve('chalk')];
      chalk = require('chalk');
    } catch (e) {
      // If still fails, use fallback
      console.warn('Warning: Could not load chalk module');
    }
    
    return true;
  } catch (error) {
    console.error('\n❌ Failed to install root dependencies\n');
    console.error(`Error: ${error.message}\n`);
    return false;
  }
}

/**
 * Check if git is available (optional warning)
 */
function checkGit() {
  console.log(chalk.cyan('🔍 Checking git...'));
  
  try {
    const version = execSync('git --version', { encoding: 'utf8' }).trim();
    console.log(chalk.green(`✅ ${version}\n`));
    return true;
  } catch (error) {
    console.log(chalk.yellow('⚠️  git is not installed (optional)\n'));
    return false;
  }
}

/**
 * Install dependencies for a service
 */
function installDependencies(serviceName, directory, command) {
  console.log(chalk.cyan(`\n📥 Installing ${serviceName} dependencies...\n`));
  
  try {
    execSync(command, {
      cwd: directory,
      stdio: 'inherit'
    });
    
    console.log(chalk.green(`\n✅ ${serviceName} dependencies installed successfully!\n`));
    return true;
  } catch (error) {
    console.error(chalk.red(`\n❌ Failed to install ${serviceName} dependencies\n`));
    console.error(chalk.red(`Error: ${error.message}\n`));
    return false;
  }
}

/**
 * Install Playwright browsers
 */
function installPlaywright() {
  console.log(chalk.cyan('\n🎭 Installing Playwright browsers...\n'));
  console.log(chalk.gray('This may take a few minutes on first run...\n'));
  
  try {
    execSync('uv run playwright install', {
      cwd: 'python-backend',
      stdio: 'inherit'
    });
    
    console.log(chalk.green('\n✅ Playwright browsers installed successfully!\n'));
    return true;
  } catch (error) {
    console.error(chalk.red('\n❌ Failed to install Playwright browsers'));
    console.log(chalk.yellow('You can install them later with:'));
    console.log(chalk.cyan('cd python-backend && uv run playwright install\n'));
    return false;
  }
}

/**
 * Display success message
 */
function displaySuccessMessage() {
  console.log(chalk.green.bold('\n╔══════════════════════════════════════════════════════════╗'));
  console.log(chalk.green.bold('║                                                          ║'));
  console.log(chalk.green.bold('║              🎉 Setup Completed Successfully! 🎉         ║'));
  console.log(chalk.green.bold('║                                                          ║'));
  console.log(chalk.green.bold('╚══════════════════════════════════════════════════════════╝\n'));
  
  console.log(chalk.white.bold('📋 Next Steps:\n'));
  
  console.log(chalk.cyan('1. Start all services:'));
  console.log(chalk.white.bold('   npm start\n'));
  
  console.log(chalk.cyan('2. Access the application:'));
  console.log(chalk.gray('   - Frontend:    ') + chalk.white.bold('http://localhost:5173'));
  console.log(chalk.gray('   - Node.js API: ') + chalk.white.bold('http://localhost:5000'));
  console.log(chalk.gray('   - Python API:  ') + chalk.white.bold('http://localhost:8000'));
  console.log(chalk.gray('   - API Docs:    ') + chalk.white.bold('http://localhost:8000/docs\n'));
  
  console.log(chalk.yellow('⚠️  Important: Make sure to add your AI API keys in the frontend after starting!\n'));
  console.log(chalk.green('Happy Learning! 🚀\n'));
}

/**
 * Main setup function
 */
async function main() {
  let step = 0;
  
  try {
    // Display banner
    displayBanner();
    
    // Step 1: Check prerequisites
    console.log(chalk.magenta.bold(`\n[${++step}/8] 🔍 Checking Prerequisites...\n`));
    
    if (!checkNodeVersion() || !checkNpm()) {
      console.error(chalk.red('❌ Prerequisites not met. Please install required software and try again.\n'));
      process.exit(1);
    }
    
    checkGit(); // Optional
    
    // Step 2: Install root dependencies (if needed)
    console.log(`\n[${++step}/8] 📦 Installing Root Dependencies...\n`);
    
    if (!areRootDependenciesInstalled()) {
      const installed = installRootDependencies();
      if (!installed) {
        console.error('❌ Failed to install root dependencies. Please run "npm install" manually and try again.\n');
        process.exit(1);
      }
      // Reload chalk after installation
      try {
        delete require.cache[require.resolve('chalk')];
        chalk = require('chalk');
      } catch (e) {
        console.warn('Warning: Could not reload chalk module');
      }
    } else {
      console.log('✅ Root dependencies already installed\n');
      // Ensure chalk is loaded
      try {
        chalk = require('chalk');
      } catch (e) {
        // If still can't load, try installing
        installRootDependencies();
        try {
          chalk = require('chalk');
        } catch (e2) {
          console.warn('Warning: Could not load chalk module');
        }
      }
    }
    
    // Step 3: Install uv
    console.log(chalk.magenta.bold(`\n[${++step}/8] 📦 Setting up uv (Python Package Manager)...\n`));
    
    // Load install-uv module now that root dependencies are installed
    const { isUvInstalled: checkUv, installUv: installUvFn } = loadInstallUv();
    
    if (!checkUv()) {
      const uvInstalled = await installUvFn();
      if (!uvInstalled) {
        console.error(chalk.red('\n❌ uv installation failed. Please install manually and run setup again.\n'));
        process.exit(1);
      }
    } else {
      console.log(chalk.green('✅ uv is already installed\n'));
    }
    
    // Step 4: Install frontend dependencies
    console.log(chalk.magenta.bold(`\n[${++step}/8] 📥 Installing Frontend Dependencies...\n`));
    const frontendSuccess = installDependencies('Frontend', 'frontend', 'npm install');
    if (!frontendSuccess) {
      console.error(chalk.red('⚠️  Frontend installation failed, but continuing...\n'));
    }
    
    // Step 5: Install Node.js backend dependencies
    console.log(chalk.magenta.bold(`\n[${++step}/8] 📥 Installing Node.js Backend Dependencies...\n`));
    const nodejsSuccess = installDependencies('Node.js Backend', 'nodejs-backend', 'npm install');
    if (!nodejsSuccess) {
      console.error(chalk.red('⚠️  Node.js backend installation failed, but continuing...\n'));
    }
    
    // Step 6: Install Python dependencies
    console.log(chalk.magenta.bold(`\n[${++step}/8] 🐍 Installing Python Dependencies...\n`));
    console.log(chalk.gray('Note: uv will automatically install Python 3.13 if not present...\n'));
    const pythonSuccess = installDependencies('Python Backend', 'python-backend', 'uv sync');
    if (!pythonSuccess) {
      console.error(chalk.red('⚠️  Python backend installation failed, but continuing...\n'));
    }
    
    // Step 7: Install Playwright browsers
    console.log(chalk.magenta.bold(`\n[${++step}/8] 🎭 Installing Playwright Browsers...\n`));
    installPlaywright(); // Non-critical, continue even if fails
    
    // Display success message
    displaySuccessMessage();
    
  } catch (error) {
    console.error(chalk.red('\n❌ Setup failed with error:'));
    console.error(chalk.red(error.message));
    console.log(chalk.yellow('\nPlease check the error above and try again.'));
    console.log(chalk.cyan('For help, visit: https://github.com/ikhlasbhojani/learnme/issues\n'));
    process.exit(1);
  }
}

// Run setup
main();

