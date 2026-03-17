# Deploy frontend to server
$SSH_HOST = "176.108.247.249"
$SSH_USER = "user1"
$SSH_KEY = "d:\.ssh\free-tier-cloud_ru"
$PROJECT_ROOT = $PSScriptRoot
$REMOTE_PATH = "/home/user1/iot-rpc-rest-app/nginx/html"

Write-Host "========================================"
Write-Host "Starting frontend deploy..."
Write-Host "========================================"

# Step 1: Build
Write-Host "[1/4] Building application..."
Push-Location $PROJECT_ROOT
npm run build
Pop-Location
if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!"
    exit 1
}
Write-Host "Build completed"

# Determine actual dist location
$DIST_DIR = Join-Path $PROJECT_ROOT "dist"
if (-not (Test-Path $DIST_DIR)) {
    $DIST_DIR = Join-Path $PROJECT_ROOT "build\client"
}

Write-Host "Using dist folder: $DIST_DIR"

# Step 2: Check index.html exists
Write-Host "[2/4] Checking index.html..."
$indexPath = Join-Path $DIST_DIR "index.html"
if (-not (Test-Path $indexPath)) {
    Write-Host "ERROR: index.html not found at $indexPath"
    exit 1
}
Write-Host "index.html found"

# Step 3: Prepare login folder for /login route (optional for SPA)
Write-Host "[3/4] Preparing files..."
$loginDir = Join-Path $DIST_DIR "login"
if (-not (Test-Path $loginDir)) {
    New-Item -ItemType Directory -Path $loginDir -Force | Out-Null
}
$loginIndex = Join-Path $loginDir "index.html"
Copy-Item $indexPath $loginIndex -Force
Write-Host "Created login/index.html"

# Copy favicon.svg from public to dist (Vite doesn't copy public files to dist automatically)
$publicFavicon = Join-Path $PROJECT_ROOT "public\favicon.svg"
if (Test-Path $publicFavicon) {
    Copy-Item $publicFavicon $DIST_DIR -Force
    Write-Host "Copied favicon.svg to dist"
} else {
    Write-Host "WARNING: favicon.svg not found in public/"
}

# Step 4: Upload via SSH
Write-Host "[4/4] Uploading to server..."
Write-Host "Using remote path: $REMOTE_PATH"

# First create remote directory and clean old files
Write-Host "Cleaning remote directory..."
$chownCmd = "ssh -i `"$SSH_KEY`" -o StrictHostKeyChecking=no $SSH_USER@$SSH_HOST `"sudo chown -R ${SSH_USER}:${SSH_USER} $REMOTE_PATH`""
Invoke-Expression $chownCmd

# Upload files using scp
Write-Host "Uploading files..."
$scpSrc = "$DIST_DIR\*"
$scpDst = "$SSH_USER@$SSH_HOST`:$REMOTE_PATH"
& scp -r -i $SSH_KEY -o StrictHostKeyChecking=no $scpSrc $scpDst

if ($LASTEXITCODE -eq 0 -or $LASTEXITCODE -eq $null) {
    Write-Host "========================================"
    Write-Host "Deploy completed successfully!"
    Write-Host "========================================"
    Write-Host "Now restart Docker container:"
    Write-Host "  docker compose -f /home/user1/iot-rpc-rest-app/compose.yaml restart nginx"
}
else {
    Write-Host "Upload might have issues, but trying to continue..."
    Write-Host "========================================"
    Write-Host "Check files on server manually"
    Write-Host "========================================"
}
