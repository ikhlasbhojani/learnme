#!/usr/bin/env node

const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');

// Get the project root directory (where package.json is)
const projectRoot = path.resolve(__dirname, '..');

// Change to project root
process.chdir(projectRoot);

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0] || 'help';

/**
 * Display beautiful LearnMe banner
 */
function showBanner() {
  console.log('');
  console.log(chalk.cyan.bold('  ╔══════════════════════════════════════════════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('  ║                                                                                                              ║'));
  console.log(chalk.cyan.bold('  ║') + chalk.white.bold('  ██╗     ███████╗ █████╗ ██████╗ ███╗   ██╗███╗   ███╗███████╗') + chalk.cyan.bold('  ║'));
  console.log(chalk.cyan.bold('  ║') + chalk.white.bold('  ██║     ██╔════╝██╔══██╗██╔══██╗████╗  ██║████╗ ████║██╔════╝') + chalk.cyan.bold('  ║'));
  console.log(chalk.cyan.bold('  ║') + chalk.white.bold('  ██║     █████╗  ███████║██████╔╝██╔██╗ ██║██╔████╔██║█████╗  ') + chalk.cyan.bold('  ║'));
  console.log(chalk.cyan.bold('  ║') + chalk.white.bold('  ██║     ██╔══╝  ██╔══██║██╔══██╗██║╚██╗██║██║╚██╔╝██║██╔══╝  ') + chalk.cyan.bold('  ║'));
  console.log(chalk.cyan.bold('  ║') + chalk.white.bold('  ███████╗███████╗██║  ██║██║  ██║██║ ╚████║██║ ╚═╝ ██║███████╗') + chalk.cyan.bold('  ║'));
  console.log(chalk.cyan.bold('  ║') + chalk.white.bold('  ╚══════╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝     ╚═╝╚══════╝') + chalk.cyan.bold('  ║'));
  console.log(chalk.cyan.bold('  ║                                                                                                    fff       ║'));
  console.log(chalk.cyan.bold('  ║') + chalk.white('              AI-Powered Learning Platform') + chalk.cyan.bold('                            ║'));
  console.log(chalk.cyan.bold('  ║                                                                                                    fffff     ║'));
  console.log(chalk.cyan.bold('  ╚══════════════════════════════════════════════════════════════════════════════════════════════════════════════╝'));
  console.log('');
}

/**
 * Show help message
 */
function showHelp() {
  showBanner();
  console.log(chalk.white('Usage: ') + chalk.cyan.bold('learnme <command>\n'));
  console.log(chalk.white('Commands:'));
  console.log(chalk.cyan('  start       ') + chalk.gray('Start all services (Python → Node.js → Frontend)'));
  console.log(chalk.cyan('  stop        ') + chalk.gray('Stop all running services'));
  console.log(chalk.cyan('  status      ') + chalk.gray('Check status of all services'));
  console.log(chalk.cyan('  install     ') + chalk.gray('Run setup to install dependencies'));
  console.log(chalk.cyan('  help        ') + chalk.gray('Show this help message\n'));
  console.log(chalk.white('Examples:'));
  console.log(chalk.gray('  learnme start      # Start the application'));
  console.log(chalk.gray('  learnme status     # Check if services are running'));
  console.log(chalk.gray('  learnme install    # Install/update dependencies\n'));
  console.log(chalk.gray('For more information, visit: ') + chalk.cyan.underline('https://github.com/ikhlasbhojani/learnme\n'));
}

/**
 * Start all services
 */
function start() {
  showBanner();
  console.log(chalk.cyan('🚀 Starting LearnMe...\n'));
  const startScript = path.join(projectRoot, 'scripts', 'start-sequential.js');
  
  if (!fs.existsSync(startScript)) {
    console.error(chalk.red('❌ Start script not found. Make sure you are in the LearnMe project directory.'));
    process.exit(1);
  }
  
  // Run the sequential start script
  const child = spawn('node', [startScript], {
    cwd: projectRoot,
    stdio: 'inherit',
    shell: true
  });
  
  child.on('error', (error) => {
    console.error(chalk.red(`❌ Failed to start: ${error.message}`));
    process.exit(1);
  });
  
  // Handle Ctrl+C
  process.on('SIGINT', () => {
    console.log(chalk.yellow('\n🛑 Shutting down...'));
    child.kill();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    child.kill();
    process.exit(0);
  });
}

/**
 * Stop all services (kill processes on ports)
 */
function stop() {
  showBanner();
  console.log(chalk.yellow('🛑 Stopping LearnMe services...\n'));
  
  const ports = [5173, 5000, 8000];
  const serviceNames = ['Frontend', 'Node.js Backend', 'Python Backend'];
  
  ports.forEach((port, index) => {
    try {
      // Windows: netstat to find PID, then taskkill
      // Mac/Linux: lsof to find PID, then kill
      if (process.platform === 'win32') {
        try {
          const result = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
          const lines = result.trim().split('\n');
          if (lines.length > 0) {
            const pid = lines[0].split(/\s+/).pop();
            if (pid) {
              execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
              console.log(chalk.green(`✅ Stopped ${serviceNames[index]} (port ${port})`));
            }
          } else {
            console.log(chalk.gray(`ℹ️  ${serviceNames[index]} (port ${port}) is not running`));
          }
        } catch (e) {
          console.log(chalk.gray(`ℹ️  ${serviceNames[index]} (port ${port}) is not running`));
        }
      } else {
        try {
          const result = execSync(`lsof -ti:${port}`, { encoding: 'utf8' });
          const pid = result.trim();
          if (pid) {
            execSync(`kill ${pid}`, { stdio: 'ignore' });
            console.log(chalk.green(`✅ Stopped ${serviceNames[index]} (port ${port})`));
          }
        } catch (e) {
          console.log(chalk.gray(`ℹ️  ${serviceNames[index]} (port ${port}) is not running`));
        }
      }
    } catch (error) {
      console.log(chalk.yellow(`⚠️  Could not stop ${serviceNames[index]} (port ${port})`));
    }
  });
  
  console.log(chalk.green('\n✅ All services stopped.\n'));
}

/**
 * Check status of services
 */
function status() {
  showBanner();
  console.log(chalk.blue('📊 Checking LearnMe services status...\n'));
  
  const services = [
    { name: 'Python Backend', url: 'http://localhost:8000/health', port: 8000 },
    { name: 'Node.js Backend', url: 'http://localhost:5000/health', port: 5000 },
    { name: 'Frontend', url: 'http://localhost:5173', port: 5173 }
  ];
  
  const http = require('http');
  
  services.forEach((service, index) => {
    const req = http.get(service.url, (res) => {
      if (res.statusCode === 200) {
        console.log(chalk.green(`✅ ${service.name} (port ${service.port}) - Running`));
      } else {
        console.log(chalk.yellow(`⚠️  ${service.name} (port ${service.port}) - Responding but may have issues`));
      }
      
      if (index === services.length - 1) {
        console.log('');
        process.exit(0);
      }
    });
    
    req.on('error', () => {
      console.log(chalk.red(`❌ ${service.name} (port ${service.port}) - Not running`));
      
      if (index === services.length - 1) {
        console.log('');
        process.exit(0);
      }
    });
    
    req.setTimeout(2000, () => {
      req.destroy();
      console.log(chalk.red(`❌ ${service.name} (port ${service.port}) - Not responding`));
      
      if (index === services.length - 1) {
        console.log('');
        process.exit(0);
      }
    });
  });
}

/**
 * Run setup/install
 */
function install() {
  showBanner();
  console.log(chalk.green('📦 Running LearnMe setup...\n'));
  
  const setupScript = path.join(projectRoot, 'scripts', 'setup.js');
  
  if (!fs.existsSync(setupScript)) {
    console.error(chalk.red('❌ Setup script not found. Make sure you are in the LearnMe project directory.'));
    process.exit(1);
  }
  
  const child = spawn('node', [setupScript], {
    cwd: projectRoot,
    stdio: 'inherit',
    shell: true
  });
  
  child.on('error', (error) => {
    console.error(chalk.red(`❌ Setup failed: ${error.message}`));
    process.exit(1);
  });
  
  child.on('exit', (code) => {
    if (code === 0) {
      console.log(chalk.green('\n✅ Setup completed successfully!\n'));
    } else {
      console.log(chalk.red('\n❌ Setup failed. Please check the errors above.\n'));
      process.exit(code);
    }
  });
}

// Route commands
switch (command) {
  case 'start':
    start();
    break;
  case 'stop':
    stop();
    break;
  case 'status':
    status();
    break;
  case 'install':
    install();
    break;
  case 'help':
  case '--help':
  case '-h':
    showHelp();
    break;
  default:
    console.error(chalk.red(`❌ Unknown command: ${command}\n`));
    showHelp();
    process.exit(1);
}

