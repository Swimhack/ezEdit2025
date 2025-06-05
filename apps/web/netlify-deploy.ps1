# ezEdit Frontend Deployment Script
Write-Host "Starting ezEdit frontend deployment..." -ForegroundColor Cyan

# Ensure we're in the correct directory
Set-Location -Path "C:\STRICKLAND\Strickland Technology Marketing\ezedit.co\apps\web"

# Clean the dist folder if it exists
if (Test-Path -Path "dist") {
    Write-Host "Cleaning existing dist folder..." -ForegroundColor Yellow
    Remove-Item -Path "dist" -Recurse -Force
}

# Build the frontend
Write-Host "Building frontend with build:netlify script..." -ForegroundColor Cyan
pnpm run build:netlify

# Check if build was successful
if (-not (Test-Path -Path "dist\index.html")) {
    Write-Host "Build failed! Check for errors above." -ForegroundColor Red
    exit 1
}

# Deploy to Netlify
Write-Host "Deploying to Netlify..." -ForegroundColor Green
npx netlify deploy --prod --dir=dist

Write-Host "Deployment process completed!" -ForegroundColor Green
