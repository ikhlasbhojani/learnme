#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');
const chalk = require('chalk');
const ora = require('ora');

// Get the root directory where the package is installed
const rootDir = __dirname.includes('node_modules') 
  ? path.resolve(__dirname, '../..')
  : path.resolve(__dirname, '..');

const backendDir = path.join(rootDir, 'backend');
const frontendDir = path.join(rootDir, 'frontend');
const envPath = path.join(rootDir, '.env');

// Check Node version
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
if (majorVersion < 18) {
  console.error(chalk.red('❌ Node.js version 18 or higher is required.'));
  console.error(chalk.yellow(`Current version: ${nodeVersion}`));
  process.exit(1);
}

// Generate random JWT secret
function generateJWTSecret() {
  return require('crypto').randomBytes(32).toString('hex');
}

// Check if port is available
function checkPort(port) {
  return new Promise((resolve) => {
    const net = require('net');
    const server = net.createServer();
    server.listen(port, () => {
      server.once('close', () => resolve(true));
      server.close();
    });
    server.on('error', () => resolve(false));
  });
}

// Read existing .env file
function readEnvFile() {
  const env = {};
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...values] = trimmed.split('=');
        if (key) {
          env[key.trim()] = values.join('=').trim();
        }
      }
    });
  }
  return env;
}

// Write .env file
function writeEnvFile(env) {
  const lines = [
    `PORT=${env.PORT || 5000}`,
    `DATABASE_PATH=${env.DATABASE_PATH || './data/learnme.db'}`,
    `JWT_SECRET=${env.JWT_SECRET || generateJWTSecret()}`,
    `CORS_ORIGIN=${env.CORS_ORIGIN || 'http://localhost:5173'}`,
    `NODE_ENV=${env.NODE_ENV || 'development'}`,
    `AI_PROVIDER=${env.AI_PROVIDER || 'openai'}`,
    `AI_MODEL=${env.AI_MODEL || 'gpt-4o-mini'}`,
    `AI_API_KEY=${env.AI_API_KEY || env.GEMINI_API_KEY || ''}`,
    // Legacy support
    `GEMINI_API_KEY=${env.GEMINI_API_KEY || env.AI_API_KEY || ''}`,
  ];
  fs.writeFileSync(envPath, lines.join('\n') + '\n');
}

// Setup wizard (minimal - no API key prompt)
async function runSetup() {
  const existingEnv = readEnvFile();
  
  // Ask for port if not set or default port is busy
  const defaultPort = parseInt(existingEnv.PORT) || 5000;
  const portAvailable = await checkPort(defaultPort);
  
  let port = defaultPort;
  if (!existingEnv.PORT || !portAvailable) {
    const questions = [{
      type: 'input',
      name: 'port',
      message: `Choose a port for the backend (default: ${defaultPort}):`,
      default: portAvailable ? defaultPort.toString() : '5001',
      validate: (input) => {
        const portNum = parseInt(input);
        if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
          return 'Please enter a valid port number (1-65535)';
        }
        return true;
      }
    }];
    
    const answers = await inquirer.prompt(questions);
    port = parseInt(answers.port || defaultPort);
  } else {
    port = parseInt(existingEnv.PORT);
  }

  // Update environment (no API key - will be set from frontend)
  const env = {
    ...existingEnv,
    PORT: port.toString(),
    JWT_SECRET: existingEnv.JWT_SECRET || generateJWTSecret(),
    DATABASE_PATH: existingEnv.DATABASE_PATH || './data/learnme.db',
    CORS_ORIGIN: existingEnv.CORS_ORIGIN || `http://localhost:${port + 1}`,
    NODE_ENV: existingEnv.NODE_ENV || 'development',
    GEMINI_API_KEY: existingEnv.GEMINI_API_KEY || '', // Empty by default
  };

  // Update CORS_ORIGIN based on frontend port
  const frontendPort = port + 1;
  env.CORS_ORIGIN = `http://localhost:${frontendPort}`;

  writeEnvFile(env);
  
  return env;
}

// Install dependencies
async function installDependencies() {
  const spinner = ora('Checking dependencies...').start();
  
  const backendNodeModules = path.join(backendDir, 'node_modules');
  const frontendNodeModules = path.join(frontendDir, 'node_modules');

  if (!fs.existsSync(backendNodeModules)) {
    spinner.text = 'Installing backend dependencies...';
    await new Promise((resolve, reject) => {
      const npm = spawn('npm', ['install'], {
        cwd: backendDir,
        stdio: 'pipe',
        shell: true
      });
      npm.on('close', (code) => code === 0 ? resolve() : reject(new Error(`Backend install failed with code ${code}`)));
    });
  }

  if (!fs.existsSync(frontendNodeModules)) {
    spinner.text = 'Installing frontend dependencies...';
    await new Promise((resolve, reject) => {
      const npm = spawn('npm', ['install'], {
        cwd: frontendDir,
        stdio: 'pipe',
        shell: true
      });
      npm.on('close', (code) => code === 0 ? resolve() : reject(new Error(`Frontend install failed with code ${code}`)));
    });
  }

  spinner.succeed('Dependencies ready');
}

// Recursively check if any files in a directory are newer than dist
function checkDirectoryNewer(dirPath, distMTime, maxDepth = 3, currentDepth = 0) {
  if (currentDepth > maxDepth) return false;
  
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      // Skip node_modules and dist directories
      if (entry.name === 'node_modules' || entry.name === 'dist') continue;
      
      try {
        const stats = fs.statSync(fullPath);
        
        if (entry.isDirectory()) {
          // Recursively check subdirectories
          if (checkDirectoryNewer(fullPath, distMTime, maxDepth, currentDepth + 1)) {
            return true;
          }
        } else {
          // Check if file is newer than dist
          if (stats.mtime > distMTime) {
            return true;
          }
        }
      } catch (e) {
        // Skip files we can't access
        continue;
      }
    }
  } catch (e) {
    // If we can't read directory, assume needs rebuild
    return true;
  }
  
  return false;
}

// Check if frontend needs to be rebuilt
function needsRebuild() {
  const distPath = path.join(frontendDir, 'dist');
  if (!fs.existsSync(distPath)) {
    return true; // No build exists, needs rebuild
  }

  // Check if any source files are newer than the dist folder
  const distStats = fs.statSync(distPath);
  const distMTime = distStats.mtime;

  // Check key source files and directories
  const sourcePaths = [
    path.join(frontendDir, 'src'),
    path.join(frontendDir, 'public'),
    path.join(frontendDir, 'index.html'),
    path.join(frontendDir, 'vite.config.ts'),
    path.join(frontendDir, 'tsconfig.json'),
    path.join(frontendDir, 'package.json'),
  ];

  for (const sourcePath of sourcePaths) {
    if (!fs.existsSync(sourcePath)) continue;
    
    const stats = fs.statSync(sourcePath);
    
    // If it's a file, check directly
    if (stats.isFile()) {
      if (stats.mtime > distMTime) {
        return true; // Source file is newer, needs rebuild
      }
    } else if (stats.isDirectory()) {
      // If it's a directory, check recursively
      if (checkDirectoryNewer(sourcePath, distMTime)) {
        return true;
      }
    }
  }

  return false; // No rebuild needed
}

// Build frontend
async function buildFrontend(force = false) {
  const distPath = path.join(frontendDir, 'dist');
  const shouldBuild = force || needsRebuild();
  
  if (!shouldBuild && fs.existsSync(distPath)) {
    console.log(chalk.gray('   Frontend build is up to date, skipping...'));
    return;
  }

  const spinner = ora('Building frontend...').start();
  await new Promise((resolve, reject) => {
    let output = '';
    const npm = spawn('npm', ['run', 'build'], {
      cwd: frontendDir,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true
    });
    
    npm.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    npm.stderr.on('data', (data) => {
      output += data.toString();
    });
    
    npm.on('close', (code) => {
      if (code === 0) {
        spinner.succeed('Frontend built');
        resolve();
      } else {
        spinner.fail('Frontend build failed');
        console.error(chalk.red('\nBuild error output:'));
        console.error(output);
        reject(new Error('Frontend build failed'));
      }
    });
  });
}

// Start backend server
function startBackend(env) {
  const backendProcess = spawn('npm', ['run', 'dev'], {
    cwd: backendDir,
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      ...env,
    }
  });

  backendProcess.on('error', (error) => {
    console.error(chalk.red('Failed to start backend:'), error);
  });

  return backendProcess;
}

// Start frontend dev server (for development)
function startFrontendDev(env) {
  const frontendPort = parseInt(env.PORT) + 1;
  const frontendProcess = spawn('npm', ['run', 'dev'], {
    cwd: frontendDir,
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      PORT: frontendPort,
      VITE_API_URL: `http://localhost:${env.PORT}/api`,
    }
  });

  frontendProcess.on('error', (error) => {
    console.error(chalk.red('Failed to start frontend:'), error);
  });

  return frontendProcess;
}

// Main function
async function main() {
  const args = process.argv.slice(2);

  // Handle commands
  if (args.includes('--setup') || args.includes('--config')) {
    await runSetup();
    return;
  }

  if (args.includes('--help') || args.includes('-h')) {
    console.log(chalk.cyan('\nLearnMe - Modern Learning Application\n'));
    console.log('Usage:');
    console.log('  learnme                 Start LearnMe');
    console.log('  learnme --setup         Run setup wizard');
    console.log('  learnme --rebuild       Force rebuild frontend');
    console.log('  learnme --skip-build    Skip frontend build');
    console.log('  learnme --help          Show this help\n');
    return;
  }

  try {
    // Run setup if .env doesn't exist (only for port, not API key)
    const existingEnv = readEnvFile();
    if (!fs.existsSync(envPath) || !existingEnv.PORT) {
      await runSetup();
    }

    const env = readEnvFile();
    
    // Note: API key will be set from frontend, not required to start
    if (!env.AI_API_KEY && !env.GEMINI_API_KEY) {
      console.log(chalk.yellow('\n💡 Note: AI API Key not set.'));
      console.log(chalk.yellow('   You can set it from the frontend setup page.\n'));
    }

    // Install dependencies
    await installDependencies();

    // Build frontend (check if rebuild needed, or force with --rebuild flag)
    const forceRebuild = args.includes('--rebuild');
    const skipBuild = args.includes('--skip-build');
    
    if (!skipBuild) {
      await buildFrontend(forceRebuild);
    } else {
      console.log(chalk.gray('   Skipping frontend build (--skip-build flag)\n'));
    }

    // Start servers
    console.log(chalk.cyan('\n🚀 Starting LearnMe...\n'));

    const backendPort = parseInt(env.PORT) || 5000;
    const frontendPort = backendPort + 1;

    // Set environment variables
    env.SERVE_FRONTEND = 'true';
    const frontendDistPath = path.join(frontendDir, 'dist');
    if (fs.existsSync(frontendDistPath)) {
      env.FRONTEND_DIST_PATH = frontendDistPath;
    }
    
    const backend = startBackend(env);
    
    // Check if we should serve frontend from backend or separate server
    const serveFromBackend = fs.existsSync(path.join(frontendDir, 'dist'));
    
    let frontend;
    if (serveFromBackend) {
      // Frontend is built, backend will serve it
      console.log(chalk.gray('   Serving frontend from backend...\n'));
    } else {
      // Frontend not built, start dev server
      frontend = startFrontendDev(env);
    }

    // Wait a bit for servers to start
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log(chalk.green('\n🎉 LearnMe is ready!\n'));
    if (serveFromBackend) {
      console.log(`   ${chalk.cyan('Application:')} http://localhost:${backendPort}\n`);
      console.log(chalk.yellow('   Open http://localhost:' + backendPort + ' in your browser\n'));
    } else {
      console.log(`   ${chalk.cyan('Backend:')}  http://localhost:${backendPort}`);
      console.log(`   ${chalk.cyan('Frontend:')} http://localhost:${frontendPort}\n`);
      console.log(chalk.yellow('   Open http://localhost:' + frontendPort + ' in your browser\n'));
    }
    console.log(chalk.gray('   Press Ctrl+C to stop\n'));

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log(chalk.yellow('\n\nShutting down gracefully...'));
      backend.kill();
      if (frontend) {
        frontend.kill();
      }
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      backend.kill();
      if (frontend) {
        frontend.kill();
      }
      process.exit(0);
    });

  } catch (error) {
    console.error(chalk.red('\n❌ Error:'), error.message);
    process.exit(1);
  }
}

main();

