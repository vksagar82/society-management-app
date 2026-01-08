@echo off
REM Windows batch script to manage the FastAPI development environment

echo ===============================================
echo Society Management API - Windows Helper
echo ===============================================
echo.

if "%1"=="" goto menu
if "%1"=="setup" goto setup
if "%1"=="serve" goto serve
if "%1"=="test" goto test
if "%1"=="format" goto format
if "%1"=="check" goto check
goto invalid

:menu
echo 1. Setup environment
echo 2. Run development server
echo 3. Run tests
echo 4. Format code
echo 5. Run all checks
echo 6. Exit
echo.
set /p choice="Enter your choice (1-6): "

if "%choice%"=="1" goto setup
if "%choice%"=="2" goto serve
if "%choice%"=="3" goto test
if "%choice%"=="4" goto format
if "%choice%"=="5" goto check
if "%choice%"=="6" goto end
goto invalid

:setup
echo.
echo [SETUP] Installing dependencies...
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)
call venv\Scripts\activate.bat
pip install -r requirements.txt
if not exist ".env" (
    echo Copying .env.example to .env
    copy .env.example .env
    echo Please edit .env file with your configuration
)
echo Setup complete!
goto end

:serve
echo.
echo [SERVER] Starting development server...
echo API: http://localhost:8000
echo Docs: http://localhost:8000/api/docs
echo.
call venv\Scripts\activate.bat
python main.py
goto end

:test
echo.
echo [TEST] Running tests...
call venv\Scripts\activate.bat
pytest -v
goto end

:format
echo.
echo [FORMAT] Formatting code...
call venv\Scripts\activate.bat
black .
isort .
echo Code formatted!
goto end

:check
echo.
echo [CHECK] Running all checks...
call venv\Scripts\activate.bat
black .
isort .
flake8 app tests
mypy app
pytest -v
echo All checks complete!
goto end

:invalid
echo Invalid option!
goto end

:end
echo.
pause
