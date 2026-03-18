# Upload only - for re-deploying built files to server
# Run this after deploy.ps1 has been executed (or build already done)
$SSH_HOST = "176.108.247.249"
$SSH_USER = "user1"
$SSH_KEY = "d:\.ssh\free-tier-cloud_ru"
$PROJECT_ROOT = $PSScriptRoot
$REMOTE_PATH = "/home/user1/iot-rpc-rest-app/nginx/html"

Write-Host "========================================"
Write-Host "Starting upload-only deploy..."
Write-Host "========================================"

# Determine dist location
$DIST_DIR = Join-Path $PROJECT_ROOT "dist"
if (-not (Test-Path $DIST_DIR)) {
    $DIST_DIR = Join-Path $PROJECT_ROOT "build\client"
}

if (-not (Test-Path $DIST_DIR)) {
    Write-Host "ERROR: dist folder not found!"
    Write-Host "Please run deploy.ps1 first to build the application"
    exit 1
}

Write-Host "Using dist folder: $DIST_DIR"

# Check index.html exists
$indexPath = Join-Path $DIST_DIR "index.html"
if (-not (Test-Path $indexPath)) {
    Write-Host "ERROR: index.html not found at $indexPath"
    exit 1
}

# Step 1: Check nginx config and prepare files accordingly
Write-Host "[1/3] Checking nginx configuration..."

# Check nginx config for SPA routing support
$nginxCheckCmd = "ssh -i `"$SSH_KEY`" -o StrictHostKeyChecking=no $SSH_USER@$SSH_HOST 'cd /home/user1/iot-rpc-rest-app && sudo docker compose exec nginx nginx -T'"
$nginxConfig = Invoke-Expression $nginxCheckCmd

$needsLoginIndex = $true
$hasTryFiles = $nginxConfig -like "*try_files*index.html*"

if ($hasTryFiles) {
    Write-Host "Nginx has SPA try_files config - login/index.html not needed"
    $needsLoginIndex = $false
} elseif ($nginxConfig -eq "NOT_FOUND" -or $nginxConfig -eq "") {
    Write-Host "WARNING: Could not verify nginx config - will create login/index.html for safety"
    $needsLoginIndex = $true
} else {
    Write-Host "Nginx does not have SPA try_files - creating login/index.html for compatibility"
    $needsLoginIndex = $true
}

# Prepare login folder for /login route if needed
if ($needsLoginIndex) {
    Write-Host "Preparing login/index.html..."
    $loginDir = Join-Path $DIST_DIR "login"
    if (-not (Test-Path $loginDir)) {
        New-Item -ItemType Directory -Path $loginDir -Force | Out-Null
    }
    $loginIndex = Join-Path $loginDir "index.html"
    Copy-Item $indexPath $loginIndex -Force
    Write-Host "Created login/index.html"
}

# Copy favicon.svg from public to dist
$publicFavicon = Join-Path $PROJECT_ROOT "public\favicon.svg"
if (Test-Path $publicFavicon) {
    Copy-Item $publicFavicon $DIST_DIR -Force
    Write-Host "Copied favicon.svg to dist"
}

# Step 2: Upload via SSH
Write-Host "[2/3] Uploading to server..."
Write-Host "Using remote path: $REMOTE_PATH"

# First create remote directory and clean old files
Write-Host "Setting ownership..."
$chownCmd = "ssh -i `"$SSH_KEY`" -o StrictHostKeyChecking=no $SSH_USER@$SSH_HOST `"sudo chown -R ${SSH_USER}:${SSH_USER} $REMOTE_PATH`""
Invoke-Expression $chownCmd

# Upload files using scp
Write-Host "Uploading files..."
$scpSrc = "$DIST_DIR\*"
$scpDst = "$SSH_USER@$SSH_HOST`:$REMOTE_PATH"
& scp -r -i $SSH_KEY -o StrictHostKeyChecking=no $scpSrc $scpDst

if ($LASTEXITCODE -ne 0 -and $LASTEXITCODE -ne $null) {
    Write-Host "ERROR: Upload failed!"
    exit 1
}

Write-Host "Files uploaded successfully"

# Step 3: Restart nginx container
Write-Host "[3/3] Restarting nginx container..."
$restartCmd = "ssh -i `"$SSH_KEY`" -o StrictHostKeyChecking=no $SSH_USER@$SSH_HOST `"sudo docker compose -f /home/user1/iot-rpc-rest-app/compose.yaml restart nginx`""
Invoke-Expression $restartCmd

if ($LASTEXITCODE -eq 0 -or $LASTEXITCODE -eq $null) {
    Write-Host "========================================"
    Write-Host "Deploy completed successfully!"
    Write-Host "========================================"
    Write-Host "Frontend is now live at: https://dev.leo4.ru"
}
else {
    Write-Host "ERROR: Failed to restart nginx!"
    Write-Host "Please restart manually:"
    Write-Host "  docker compose -f /home/user1/iot-rpc-rest-app/compose.yaml restart nginx"
    exit 1
}
