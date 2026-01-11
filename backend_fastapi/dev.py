"""
Development utilities and helpers.

Run this script to perform common development tasks.
"""

import subprocess
import sys
import os
from pathlib import Path


def run_command(cmd, description):
    """Run a shell command and print result."""
    print(f"\n{'='*60}")
    print(f"🔧 {description}")
    print(f"{'='*60}")
    try:
        subprocess.run(
            cmd, shell=True, check=True, capture_output=False)
        print(f"✅ {description} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed with error: {e}")
        return False


def setup_environment():
    """Setup the development environment."""
    print("\n🚀 Setting up development environment...\n")

    # Check Python version
    if sys.version_info < (3, 10):
        print("❌ Python 3.10+ required")
        return False

    print(
        f"✅ Python {sys.version_info.major}.{sys.version_info.minor} detected")

    # Install requirements
    if not run_command("pip install -r requirements.txt", "Installing dependencies"):
        return False

    # Check if .env exists
    if not Path(".env").exists():
        if Path(".env.example").exists():
            print("\n⚠️  .env file not found. Copying from .env.example")
            import shutil
            shutil.copy(".env.example", ".env")
            print("⚠️  Please edit .env file with your configuration")
        else:
            print("❌ .env.example not found")
            return False

    print("\n✅ Environment setup complete!")
    return True


def run_tests():
    """Run all tests."""
    return run_command("pytest -v", "Running tests")


def run_tests_with_coverage():
    """Run tests with coverage."""
    success = run_command(
        "pytest --cov=app --cov-report=html --cov-report=term",
        "Running tests with coverage"
    )
    if success:
        print("\n📊 Coverage report generated in htmlcov/index.html")
    return success


def format_code():
    """Format code with Black and isort."""
    print("\n🎨 Formatting code...\n")
    run_command("black .", "Formatting with Black")
    run_command("isort .", "Sorting imports with isort")


def lint_code():
    """Lint code with flake8."""
    return run_command("flake8 app tests", "Linting with flake8")


def type_check():
    """Type check with mypy."""
    return run_command("mypy app", "Type checking with mypy")


def run_server():
    """Run development server."""
    print("\n🌐 Starting development server...\n")
    print("API will be available at: http://localhost:8000")
    print("Docs will be available at: http://localhost:8000/api/docs")
    print("\nPress Ctrl+C to stop\n")
    os.system("python main.py")


def show_menu():
    """Show interactive menu."""
    print("\n" + "="*60)
    print("🏘️  Society Management API - Developer Tools")
    print("="*60)
    print("\n1. Setup environment (install dependencies)")
    print("2. Run tests")
    print("3. Run tests with coverage")
    print("4. Format code (Black + isort)")
    print("5. Lint code (flake8)")
    print("6. Type check (mypy)")
    print("7. Run all checks (format + lint + type + test)")
    print("8. Start development server")
    print("9. Exit")
    print("\nEnter your choice (1-9): ", end="")


def run_all_checks():
    """Run all code quality checks."""
    print("\n🔍 Running all code quality checks...\n")

    format_code()
    lint_passed = lint_code()
    type_passed = type_check()
    tests_passed = run_tests()

    print("\n" + "="*60)
    print("📋 SUMMARY")
    print("="*60)
    print(f"Linting: {'✅ Passed' if lint_passed else '❌ Failed'}")
    print(f"Type checking: {'✅ Passed' if type_passed else '❌ Failed'}")
    print(f"Tests: {'✅ Passed' if tests_passed else '❌ Failed'}")
    print("="*60)

    return all([lint_passed, type_passed, tests_passed])


def main():
    """Main function."""
    if len(sys.argv) > 1:
        # Command line mode
        command = sys.argv[1]
        commands = {
            "setup": setup_environment,
            "test": run_tests,
            "coverage": run_tests_with_coverage,
            "format": format_code,
            "lint": lint_code,
            "type": type_check,
            "check": run_all_checks,
            "serve": run_server,
        }

        if command in commands:
            commands[command]()
        else:
            print(f"Unknown command: {command}")
            print(f"Available commands: {', '.join(commands.keys())}")
    else:
        # Interactive mode
        while True:
            show_menu()
            try:
                choice = input().strip()

                if choice == "1":
                    setup_environment()
                elif choice == "2":
                    run_tests()
                elif choice == "3":
                    run_tests_with_coverage()
                elif choice == "4":
                    format_code()
                elif choice == "5":
                    lint_code()
                elif choice == "6":
                    type_check()
                elif choice == "7":
                    run_all_checks()
                elif choice == "8":
                    run_server()
                    break
                elif choice == "9":
                    print("\n👋 Goodbye!")
                    break
                else:
                    print("\n❌ Invalid choice. Please enter 1-9.")

                if choice != "8":
                    input("\nPress Enter to continue...")

            except KeyboardInterrupt:
                print("\n\n👋 Goodbye!")
                break


if __name__ == "__main__":
    main()
