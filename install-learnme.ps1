# LearnMe Installation Script
# This script clones the repository and sets up LearnMe

param(
    [string]$Branch = "main"
)

$repoUrl = "https://github.com/ikhlasbhojani/learnme.git"
$projectName = "learnme"

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "      LearnMe Installation" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if Git is installed
Write-Host "Checking prerequisites..." -ForegroundColor Yellow
try {
    $gitVersion = git --version 2>&1
    Write-Host "Git found: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "Git is not installed. Please install Git first." -ForegroundColor Red
    Write-Host "Download from: https://git-scm.com/download/win" -ForegroundColor Yellow
    exit 1
}

# Check if Node.js is installed
try {
    $nodeVersion = node --version 2>&1
    Write-Host "Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "Node.js is not installed. Please install Node.js 16+ first." -ForegroundColor Red
    Write-Host "Download from: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Check Node.js version
$nodeMajorVersion = [int](node --version).Substring(1).Split('.')[0]
if ($nodeMajorVersion -lt 16) {
    Write-Host "Node.js version 16+ is required. Current version: $nodeVersion" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 1: Cloning repository..." -ForegroundColor Cyan
$targetDir = Join-Path $PWD $projectName

if (Test-Path $targetDir) {
    Write-Host "Directory '$targetDir' already exists." -ForegroundColor Yellow
    $response = Read-Host "Do you want to remove it and re-clone? (y/N)"
    if ($response -eq 'y' -or $response -eq 'Y') {
        Write-Host "Removing existing directory..." -ForegroundColor Yellow
        Remove-Item -Recurse -Force $targetDir
    } else {
        Write-Host "Using existing directory..." -ForegroundColor Yellow
        Set-Location $targetDir
        if (Test-Path ".git") {
            Write-Host "Updating repository..." -ForegroundColor Yellow
            git pull origin $Branch
        } else {
            Write-Host "Directory exists but is not a git repository." -ForegroundColor Red
            exit 1
        }
    }
}

if (-not (Test-Path $targetDir)) {
    Write-Host "Cloning LearnMe repository..." -ForegroundColor Yellow
    git clone -b $Branch $repoUrl $targetDir
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to clone repository." -ForegroundColor Red
        exit 1
    }
    Write-Host "Repository cloned successfully!" -ForegroundColor Green
}

Set-Location $targetDir

Write-Host ""
Write-Host "Step 2: Running setup..." -ForegroundColor Cyan
Write-Host "This will install all dependencies (this may take a few minutes)..." -ForegroundColor Gray

npm run setup
if ($LASTEXITCODE -ne 0) {
    Write-Host "Setup failed. Please check the errors above." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 3: Creating global 'learnme' command..." -ForegroundColor Cyan
npm link
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to create global command. You can still use 'npm start' in the project directory." -ForegroundColor Yellow
} else {
    Write-Host "Global 'learnme' command created!" -ForegroundColor Green
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "      Installation Complete!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Navigate to the project: cd learnme" -ForegroundColor White
Write-Host "  2. Start the project:" -ForegroundColor White
Write-Host "     - Using global command: learnme start" -ForegroundColor Yellow
Write-Host "     - Or using npm: npm start" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Access the application:" -ForegroundColor White
Write-Host "     - Frontend:    http://localhost:5173" -ForegroundColor Gray
Write-Host "     - Node.js API: http://localhost:5000" -ForegroundColor Gray
Write-Host "     - Python API:  http://localhost:8000" -ForegroundColor Gray
Write-Host "     - API Docs:    http://localhost:8000/docs" -ForegroundColor Gray
Write-Host ""
Write-Host "  Important: Configure your AI API keys in the frontend on first launch!" -ForegroundColor Yellow
Write-Host ""
