#!/usr/bin/env python3
"""
Simple test runner script for validating test files
This script checks that all test files can be imported without syntax errors
"""

import sys
import ast
import os
from pathlib import Path


def validate_python_file(file_path):
    """Validate that a Python file has correct syntax"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        ast.parse(content)
        return True, None
    except SyntaxError as e:
        return False, f"Syntax error: {e}"
    except Exception as e:
        return False, f"Error: {e}"


def main():
    """Main test validation function"""
    backend_dir = Path(__file__).parent
    test_dir = backend_dir / "tests"
    
    if not test_dir.exists():
        print("❌ Tests directory not found")
        return 1
    
    print("🔍 Validating test files...")
    
    # Find all Python test files
    test_files = list(test_dir.rglob("*.py"))
    
    if not test_files:
        print("❌ No test files found")
        return 1
    
    errors = []
    for test_file in test_files:
        print(f"  Checking {test_file.relative_to(backend_dir)}...", end=" ")
        valid, error = validate_python_file(test_file)
        if valid:
            print("✅")
        else:
            print("❌")
            errors.append(f"{test_file.relative_to(backend_dir)}: {error}")
    
    # Validate main app files too
    app_dir = backend_dir / "app"
    if app_dir.exists():
        print("\n🔍 Validating app files...")
        app_files = list(app_dir.rglob("*.py"))
        for app_file in app_files:
            print(f"  Checking {app_file.relative_to(backend_dir)}...", end=" ")
            valid, error = validate_python_file(app_file)
            if valid:
                print("✅")
            else:
                print("❌")
                errors.append(f"{app_file.relative_to(backend_dir)}: {error}")
    
    if errors:
        print(f"\n❌ Found {len(errors)} error(s):")
        for error in errors:
            print(f"  - {error}")
        return 1
    else:
        print(f"\n✅ All files validated successfully! ({len(test_files)} test files checked)")
        return 0


if __name__ == "__main__":
    sys.exit(main())