#!/usr/bin/env node

const { spawn } = require('child_process');
const http = require('http');
const chalk = require('chalk');

/**
 * Wait for a service to be ready by checking HTTP endpoint
 */
function waitForService(name, url, maxAttempts = 30, delay = 1000) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    
    const check = () => {
      attempts++;
      if (attempts % 5 === 0 || attempts === 1) {
        console.log(chalk.cyan(`[${name}] Checking if service is ready... (attempt ${attempts}/${maxAttempts})`));
      }
      
      const req = http.get(url, (res) => {
        if (res.statusCode === 200) {
          console.log(chalk.green(`[${name}] ✅ Service is ready!`));
          resolve();
        } else {
          // Not ready yet, continue checking
          if (attempts >= maxAttempts) {
            reject(new Error(`${name} service returned status ${res.statusCode}`));
          } else {
            setTimeout(check, delay);
          }
        }
      });
      
      req.on('error', (err) => {
        if (attempts >= maxAttempts) {
          console.error(chalk.red(`[${name}] ❌ Service failed to start after ${maxAttempts} attempts`));
          reject(new Error(`${name} service did not start in time`));
        } else {
          setTimeout(check, delay);
        }
      });
      
      req.setTimeout(2000, () => {
        req.destroy();
        if (attempts >= maxAttempts) {
          reject(new Error(`${name} service did not respond in time`));
        } else {
          setTimeout(check, delay);
        }
      });
    };
    
    check();
  });
}

/**
 * Start a service and return the process
 */
function startService(name, command, args, cwd, color) {
  console.log(chalk[color](`\n[${name}] Starting ${name}...`));
  console.log(chalk.gray(`[${name}] Command: ${command} ${args.join(' ')}`));
  
  const process = spawn(command, args, {
    cwd: cwd || process.cwd(),
    shell: true,
    stdio: 'inherit'
  });
  
  process.on('error', (error) => {
    console.error(chalk.red(`[${name}] ❌ Failed to start: ${error.message}`));
  });
  
  return process;
}

/**
 * Main startup sequence
 */
async function main() {
  console.log(chalk.cyan.bold('\n╔══════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('║                                                          ║'));
  console.log(chalk.cyan.bold('║              🚀 LearnMe Sequential Startup 🚀           ║'));
  console.log(chalk.cyan.bold('║                                                          ║'));
  console.log(chalk.cyan.bold('╚══════════════════════════════════════════════════════════╝\n'));
  
  const processes = [];
  
  try {
    // Step 1: Start Python backend
    console.log(chalk.yellow.bold('\n[STEP 1/3] Starting Python Backend...\n'));
    const pythonProcess = startService(
      'PYTHON',
      'uv',
      ['run', 'uvicorn', 'app.core.app:app', '--reload'],
      'python-backend',
      'yellow'
    );
    processes.push({ name: 'PYTHON', process: pythonProcess });
    
    // Wait for Python to be ready
    console.log(chalk.yellow('\n[PYTHON] Waiting for service to be ready...'));
    await waitForService('PYTHON', 'http://localhost:8000/health', 60, 2000);
    console.log(chalk.green.bold('\n✅ Python Backend is ready!\n'));
    
    // Step 2: Start Node.js backend
    console.log(chalk.green.bold('\n[STEP 2/3] Starting Node.js Backend...\n'));
    const nodejsProcess = startService(
      'NODEJS',
      'npm',
      ['run', 'dev'],
      'nodejs-backend',
      'green'
    );
    processes.push({ name: 'NODEJS', process: nodejsProcess });
    
    // Wait for Node.js to be ready
    console.log(chalk.green('\n[NODEJS] Waiting for service to be ready...'));
    await waitForService('NODEJS', 'http://localhost:5000/health', 30, 1000);
    console.log(chalk.green.bold('\n✅ Node.js Backend is ready!\n'));
    
    // Step 3: Start Frontend
    console.log(chalk.cyan.bold('\n[STEP 3/3] Starting Frontend...\n'));
    const frontendProcess = startService(
      'FRONTEND',
      'npm',
      ['run', 'dev'],
      'frontend',
      'cyan'
    );
    processes.push({ name: 'FRONTEND', process: frontendProcess });
    
    console.log(chalk.green.bold('\n╔══════════════════════════════════════════════════════════╗'));
    console.log(chalk.green.bold('║                                                          ║'));
    console.log(chalk.green.bold('║              🎉 All Services Started! 🎉                  ║'));
    console.log(chalk.green.bold('║                                                          ║'));
    console.log(chalk.green.bold('╚══════════════════════════════════════════════════════════╝\n'));
    
    console.log(chalk.white('📋 Services:'));
    console.log(chalk.yellow('   🐍 Python API:    http://localhost:8000'));
    console.log(chalk.yellow('   📚 API Docs:      http://localhost:8000/docs'));
    console.log(chalk.green('   🔧 Node.js API:   http://localhost:5000'));
    console.log(chalk.cyan('   🎨 Frontend:       http://localhost:5173\n'));
    
    console.log(chalk.gray('Press Ctrl+C to stop all services\n'));
    
    // Handle cleanup on exit
    process.on('SIGINT', () => {
      console.log(chalk.yellow('\n\n🛑 Shutting down all services...\n'));
      processes.forEach(({ name, process }) => {
        console.log(chalk.gray(`[${name}] Stopping...`));
        process.kill();
      });
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      processes.forEach(({ name, process }) => {
        process.kill();
      });
      process.exit(0);
    });
    
  } catch (error) {
    console.error(chalk.red(`\n❌ Startup failed: ${error.message}\n`));
    console.log(chalk.yellow('🛑 Stopping all services...\n'));
    processes.forEach(({ name, process }) => {
      process.kill();
    });
    process.exit(1);
  }
}

// Run startup
main();

