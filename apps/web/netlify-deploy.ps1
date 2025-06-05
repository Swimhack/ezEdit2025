# ezEdit Frontend Deployment Script
Write-Host "Starting ezEdit frontend deployment..." -ForegroundColor Cyan

# Ensure we're in the correct directory
Set-Location -Path "C:\STRICKLAND\Strickland Technology Marketing\ezedit.co\apps\web"

# Clean dist folder if it exists
Write-Host "Cleaning existing dist folder..." -ForegroundColor Yellow
if (Test-Path -Path "dist") {
    Remove-Item -Path "dist" -Recurse -Force
}

# Build the frontend
Write-Host "Building frontend with build:netlify script..." -ForegroundColor Cyan
pnpm run build:netlify

# Check if build was successful
if (Test-Path -Path "dist\index.html") {
    Write-Host "Build successful! Ready to deploy." -ForegroundColor Green
    
    # Deploy to Netlify
    Write-Host "Deploying to Netlify..." -ForegroundColor Green
    npx netlify deploy --prod --dir=dist
    
    Write-Host "Deployment process completed!" -ForegroundColor Green
} else {
    Write-Host "Build failed. Check for errors above." -ForegroundColor Red
    exit 1
}
# Script ends here
