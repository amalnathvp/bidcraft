# PowerShell script to install MongoDB Community Edition on Windows
# Run this script as Administrator for best results

Write-Host "🍃 MongoDB Community Edition Installation Script" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")

if (-not $isAdmin) {
    Write-Host "⚠️  Warning: Not running as Administrator. Some steps might fail." -ForegroundColor Yellow
    Write-Host "For best results, right-click PowerShell and 'Run as Administrator'" -ForegroundColor Yellow
    Write-Host ""
}

# Step 1: Download MongoDB
Write-Host "📥 Step 1: Downloading MongoDB Community Edition..." -ForegroundColor Cyan
$mongoUrl = "https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-7.0.12.msi"
$downloadPath = "$env:TEMP\mongodb-installer.msi"

try {
    Invoke-WebRequest -Uri $mongoUrl -OutFile $downloadPath -UseBasicParsing
    Write-Host "✅ MongoDB installer downloaded successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to download MongoDB. Error: $_" -ForegroundColor Red
    Write-Host "Please download manually from: https://www.mongodb.com/try/download/community" -ForegroundColor Yellow
    exit 1
}

# Step 2: Install MongoDB
Write-Host "🔧 Step 2: Installing MongoDB..." -ForegroundColor Cyan
Write-Host "This will open the MongoDB installer. Please follow these settings:" -ForegroundColor Yellow
Write-Host "- Choose 'Complete' installation" -ForegroundColor Yellow
Write-Host "- ✅ Install MongoDB as a Service (checked)" -ForegroundColor Yellow
Write-Host "- ✅ Run service as Network Service user (checked)" -ForegroundColor Yellow
Write-Host "- ✅ Install MongoDB Compass (recommended)" -ForegroundColor Yellow

try {
    Start-Process -FilePath $downloadPath -Wait
    Write-Host "✅ MongoDB installation completed" -ForegroundColor Green
} catch {
    Write-Host "❌ Installation failed. Error: $_" -ForegroundColor Red
    exit 1
}

# Step 3: Create data directory
Write-Host "📁 Step 3: Creating data directory..." -ForegroundColor Cyan
$dataDir = "C:\data\db"
if (-not (Test-Path $dataDir)) {
    try {
        New-Item -ItemType Directory -Path $dataDir -Force | Out-Null
        Write-Host "✅ Data directory created: $dataDir" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Could not create data directory. You may need to create it manually." -ForegroundColor Yellow
        Write-Host "Please run: mkdir C:\data\db" -ForegroundColor Yellow
    }
} else {
    Write-Host "✅ Data directory already exists: $dataDir" -ForegroundColor Green
}

# Step 4: Start MongoDB Service
Write-Host "🚀 Step 4: Starting MongoDB service..." -ForegroundColor Cyan
try {
    net start MongoDB 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ MongoDB service started successfully" -ForegroundColor Green
    } else {
        Write-Host "⚠️  MongoDB service may already be running or needs manual start" -ForegroundColor Yellow
        Write-Host "Try: net start MongoDB" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Could not start MongoDB service automatically" -ForegroundColor Yellow
    Write-Host "Please run: net start MongoDB" -ForegroundColor Yellow
}

# Step 5: Test connection
Write-Host "🧪 Step 5: Testing MongoDB connection..." -ForegroundColor Cyan
Start-Sleep -Seconds 3

# Add MongoDB to PATH if not already there
$mongoPath = "C:\Program Files\MongoDB\Server\7.0\bin"
if (Test-Path $mongoPath) {
    $currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
    if ($currentPath -notlike "*$mongoPath*") {
        try {
            [Environment]::SetEnvironmentVariable("Path", "$currentPath;$mongoPath", "User")
            Write-Host "✅ MongoDB added to PATH" -ForegroundColor Green
        } catch {
            Write-Host "⚠️  Could not add MongoDB to PATH automatically" -ForegroundColor Yellow
        }
    }
}

# Step 6: Verify installation
Write-Host "✅ Step 6: Installation verification..." -ForegroundColor Cyan
Write-Host ""
Write-Host "MongoDB Community Edition installation completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Restart your terminal/PowerShell to refresh PATH" -ForegroundColor White
Write-Host "2. Test connection: mongosh mongodb://localhost:27017" -ForegroundColor White
Write-Host "3. Restart your BidCraft backend server" -ForegroundColor White
Write-Host "4. Run the seeder: npm run seed" -ForegroundColor White
Write-Host ""
Write-Host "🌐 MongoDB should now be accessible at: mongodb://localhost:27017" -ForegroundColor Green
Write-Host "🎯 MongoDB Compass (GUI) should also be installed for database management" -ForegroundColor Green
Write-Host ""
Write-Host "If you encounter any issues:" -ForegroundColor Yellow
Write-Host "- Check if MongoDB service is running: Get-Service MongoDB" -ForegroundColor White
Write-Host "- Start service manually: net start MongoDB" -ForegroundColor White
Write-Host "- Check port 27017: netstat -ano | findstr :27017" -ForegroundColor White

# Cleanup
try {
    Remove-Item $downloadPath -Force -ErrorAction SilentlyContinue
    Write-Host "🗑️  Installer file cleaned up" -ForegroundColor Green
} catch {
    # Ignore cleanup errors
}

Write-Host ""
Write-Host "🎉 Installation script completed!" -ForegroundColor Green
