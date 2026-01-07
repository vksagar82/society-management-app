# Database initialization script for Society Management System (PowerShell)

# Load environment variables from .env file
$envFile = "..\backend_fastapi\.env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]*?)\s*=\s*(.*)$') {
            $name = $matches[1]
            $value = $matches[2]
            Set-Item -Path "env:$name" -Value $value
        }
    }
}

# Check if DATABASE_URL is set
if (-not $env:DATABASE_URL) {
    Write-Host "Error: DATABASE_URL not set" -ForegroundColor Red
    Write-Host "Please set DATABASE_URL environment variable or create .env file"
    exit 1
}

Write-Host "Initializing database schema..." -ForegroundColor Cyan
Write-Host "Using database: $env:DATABASE_URL"
Write-Host ""

# Run schema files in order
Write-Host "1. Creating tables and indexes..." -ForegroundColor Yellow
psql $env:DATABASE_URL -f schema.sql

Write-Host ""
Write-Host "2. Running authentication migrations..." -ForegroundColor Yellow
psql $env:DATABASE_URL -f AUTH_MIGRATIONS.sql

Write-Host ""
Write-Host "3. Initializing role scopes..." -ForegroundColor Yellow
psql $env:DATABASE_URL -f INITIALIZE_ROLE_SCOPES.sql

Write-Host ""
Write-Host "Database initialization complete!" -ForegroundColor Green
Write-Host ""
Write-Host "You can now start the FastAPI application:"
Write-Host "  cd ..\backend_fastapi"
Write-Host "  python main.py"
