"""
Run all API tests with automatic cleanup.

This script runs the comprehensive test suite and shows detailed output.
"""

import subprocess
import sys
from pathlib import Path


def run_tests():
    """Run pytest with all endpoint tests."""
    print("="*70)
    print("🚀 SOCIETY MANAGEMENT API - COMPREHENSIVE TEST SUITE")
    print("="*70)
    print("\n📝 Running tests for all endpoints with automatic cleanup...")
    print("   - Authentication endpoints")
    print("   - User management endpoints")
    print("   - Society management endpoints")
    print("   - Issue/Complaint endpoints")
    print("   - Asset management endpoints")
    print("   - AMC management endpoints")
    print("   - System health endpoints")
    print("\n" + "="*70)
    print()

    test_files = [
        "tests/test_auth.py",
        "tests/test_users.py",
        "tests/test_societies.py",
        "tests/test_issues.py",
        "tests/test_assets.py",
        "tests/test_amcs.py",
    ]

    result = subprocess.run(
        [sys.executable, "-m", "pytest", *test_files, "-v", "-s", "--color=yes"],
        cwd=Path(__file__).parent,
        shell=True,
    )

    print("\n" + "="*70)
    if result.returncode == 0:
        print("✅ ALL TESTS PASSED!")
        print("🧹 All test data has been automatically cleaned up.")
    else:
        print("❌ SOME TESTS FAILED")
        print("🧹 Test data has been automatically cleaned up (including failed tests).")
    print("="*70)

    return result.returncode


if __name__ == "__main__":
    sys.exit(run_tests())
