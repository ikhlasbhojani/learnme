#!/usr/bin/env node

const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Get the project root directory (where package.json is)
const projectRoot = path.resolve(__dirname, '..');

// Change to project root
process.chdir(projectRoot);

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0] || 'help';

/**
 * Show help message
 */
function showHelp() {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║              🎓 LearnMe Command Line 🎓                 ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝

Usage: learnme <command>

Commands:
  start       Start all services (Python → Node.js → Frontend)
  stop        Stop all running services
  status      Check status of all services
  install     Run setup to install dependencies
  help        Show this help message

Examples:
  learnme start      # Start the application
  learnme status     # Check if services are running
  learnme install    # Install/update dependencies

For more information, visit: https://github.com/ikhlasbhojani/learnme
`);
}

/**
 * Start all services
 */
function start() {
  console.log('🚀 Starting LearnMe...\n');
  const startScript = path.join(projectRoot, 'scripts', 'start-sequential.js');
  
  if (!fs.existsSync(startScript)) {
    console.error('❌ Start script not found. Make sure you are in the LearnMe project directory.');
    process.exit(1);
  }
  
  // Run the sequential start script
  const child = spawn('node', [startScript], {
    cwd: projectRoot,
    stdio: 'inherit',
    shell: true
  });
  
  child.on('error', (error) => {
    console.error(`❌ Failed to start: ${error.message}`);
    process.exit(1);
  });
  
  // Handle Ctrl+C
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down...');
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
  console.log('🛑 Stopping LearnMe services...\n');
  
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
              console.log(`✅ Stopped ${serviceNames[index]} (port ${port})`);
            }
          } else {
            console.log(`ℹ️  ${serviceNames[index]} (port ${port}) is not running`);
          }
        } catch (e) {
          console.log(`ℹ️  ${serviceNames[index]} (port ${port}) is not running`);
        }
      } else {
        try {
          const result = execSync(`lsof -ti:${port}`, { encoding: 'utf8' });
          const pid = result.trim();
          if (pid) {
            execSync(`kill ${pid}`, { stdio: 'ignore' });
            console.log(`✅ Stopped ${serviceNames[index]} (port ${port})`);
          }
        } catch (e) {
          console.log(`ℹ️  ${serviceNames[index]} (port ${port}) is not running`);
        }
      }
    } catch (error) {
      console.log(`⚠️  Could not stop ${serviceNames[index]} (port ${port})`);
    }
  });
  
  console.log('\n✅ All services stopped.\n');
}

/**
 * Check status of services
 */
function status() {
  console.log('📊 Checking LearnMe services status...\n');
  
  const services = [
    { name: 'Python Backend', url: 'http://localhost:8000/health', port: 8000 },
    { name: 'Node.js Backend', url: 'http://localhost:5000/health', port: 5000 },
    { name: 'Frontend', url: 'http://localhost:5173', port: 5173 }
  ];
  
  const http = require('http');
  
  services.forEach((service, index) => {
    const req = http.get(service.url, (res) => {
      if (res.statusCode === 200) {
        console.log(`✅ ${service.name} (port ${service.port}) - Running`);
      } else {
        console.log(`⚠️  ${service.name} (port ${service.port}) - Responding but may have issues`);
      }
      
      if (index === services.length - 1) {
        console.log('');
        process.exit(0);
      }
    });
    
    req.on('error', () => {
      console.log(`❌ ${service.name} (port ${service.port}) - Not running`);
      
      if (index === services.length - 1) {
        console.log('');
        process.exit(0);
      }
    });
    
    req.setTimeout(2000, () => {
      req.destroy();
      console.log(`❌ ${service.name} (port ${service.port}) - Not responding`);
      
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
  console.log('📦 Running LearnMe setup...\n');
  
  const setupScript = path.join(projectRoot, 'scripts', 'setup.js');
  
  if (!fs.existsSync(setupScript)) {
    console.error('❌ Setup script not found. Make sure you are in the LearnMe project directory.');
    process.exit(1);
  }
  
  const child = spawn('node', [setupScript], {
    cwd: projectRoot,
    stdio: 'inherit',
    shell: true
  });
  
  child.on('error', (error) => {
    console.error(`❌ Setup failed: ${error.message}`);
    process.exit(1);
  });
  
  child.on('exit', (code) => {
    if (code === 0) {
      console.log('\n✅ Setup completed successfully!\n');
    } else {
      console.log('\n❌ Setup failed. Please check the errors above.\n');
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
    console.error(`❌ Unknown command: ${command}\n`);
    showHelp();
    process.exit(1);
}

