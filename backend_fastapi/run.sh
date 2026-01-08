#!/bin/bash
# Unix/Linux/Mac bash script to manage the FastAPI development environment

set -e

echo "==============================================="
echo "Society Management API - Development Helper"
echo "==============================================="
echo ""

show_menu() {
    echo "1. Setup environment"
    echo "2. Run development server"
    echo "3. Run tests"
    echo "4. Run tests with coverage"
    echo "5. Format code"
    echo "6. Lint code"
    echo "7. Run all checks"
    echo "8. Exit"
    echo ""
    read -p "Enter your choice (1-8): " choice
    echo ""
}

setup() {
    echo "[SETUP] Installing dependencies..."
    if [ ! -d "venv" ]; then
        echo "Creating virtual environment..."
        python3 -m venv venv
    fi
    source venv/bin/activate
    pip install -r requirements.txt
    if [ ! -f ".env" ]; then
        echo "Copying .env.example to .env"
        cp .env.example .env
        echo "⚠️  Please edit .env file with your configuration"
    fi
    echo "✅ Setup complete!"
}

serve() {
    echo "[SERVER] Starting development server..."
    echo "API: http://localhost:8000"
    echo "Docs: http://localhost:8000/api/docs"
    echo ""
    source venv/bin/activate
    python main.py
}

run_tests() {
    echo "[TEST] Running tests..."
    source venv/bin/activate
    pytest -v
}

run_tests_coverage() {
    echo "[TEST] Running tests with coverage..."
    source venv/bin/activate
    pytest --cov=app --cov-report=html --cov-report=term
    echo "📊 Coverage report: htmlcov/index.html"
}

format_code() {
    echo "[FORMAT] Formatting code..."
    source venv/bin/activate
    black .
    isort .
    echo "✅ Code formatted!"
}

lint_code() {
    echo "[LINT] Linting code..."
    source venv/bin/activate
    flake8 app tests
}

run_checks() {
    echo "[CHECK] Running all checks..."
    source venv/bin/activate
    echo "→ Formatting..."
    black .
    isort .
    echo "→ Linting..."
    flake8 app tests
    echo "→ Type checking..."
    mypy app
    echo "→ Testing..."
    pytest -v
    echo "✅ All checks complete!"
}

if [ $# -eq 0 ]; then
    # Interactive mode
    while true; do
        show_menu
        case $choice in
            1) setup ;;
            2) serve ;;
            3) run_tests ;;
            4) run_tests_coverage ;;
            5) format_code ;;
            6) lint_code ;;
            7) run_checks ;;
            8) echo "👋 Goodbye!"; exit 0 ;;
            *) echo "❌ Invalid option!" ;;
        esac
        echo ""
        read -p "Press Enter to continue..."
        echo ""
    done
else
    # Command line mode
    case "$1" in
        setup) setup ;;
        serve) serve ;;
        test) run_tests ;;
        coverage) run_tests_coverage ;;
        format) format_code ;;
        lint) lint_code ;;
        check) run_checks ;;
        *) echo "Unknown command: $1"; exit 1 ;;
    esac
fi
