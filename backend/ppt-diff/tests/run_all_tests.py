#!/usr/bin/env python
"""
Test runner for Git PPT - runs all test suites
"""
import os
import sys
import unittest

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from test_cli import (
    TestCLIIntegration,
    TestCommandParser,
    TestInstaller,
    TestMainFunction,
    TestUtilityFunctions,
)
from test_diff import TestPPTXDiffer, TestPPTXDifferIntegration

# Import all test modules
from test_extractor import TestPPTXExtractor, TestPPTXExtractorWithRealFile
from test_integration import (
    TestGitIntegration,
    TestPPTXCreation,
    TestPPTXDiffIntegration,
    TestRealFileIntegration,
)


def create_test_suite():
    """Create comprehensive test suite"""
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()

    # Add all test classes
    test_classes = [
        # Extractor tests
        TestPPTXExtractor,
        TestPPTXExtractorWithRealFile,
        # Diff tests
        TestPPTXDiffer,
        TestPPTXDifferIntegration,
        # CLI tests
        TestUtilityFunctions,
        TestInstaller,
        TestCommandParser,
        TestMainFunction,
        TestCLIIntegration,
        # Integration tests
        TestPPTXCreation,
        TestPPTXDiffIntegration,
        TestGitIntegration,
        TestRealFileIntegration,
    ]

    for test_class in test_classes:
        tests = loader.loadTestsFromTestCase(test_class)
        suite.addTests(tests)

    return suite


def run_tests(verbosity=2):
    """Run all tests with specified verbosity"""
    suite = create_test_suite()
    runner = unittest.TextTestRunner(verbosity=verbosity, stream=sys.stdout)
    result = runner.run(suite)

    # Print summary
    print("\n" + "=" * 70)
    print("TEST SUMMARY")
    print("=" * 70)
    print(f"Tests run: {result.testsRun}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    print(f"Skipped: {len(result.skipped) if hasattr(result, 'skipped') else 0}")

    if result.failures:
        print("\nFAILURES:")
        for test, traceback in result.failures:
            print(f"- {test}")

    if result.errors:
        print("\nERRORS:")
        for test, traceback in result.errors:
            print(f"- {test}")

    success = len(result.failures) == 0 and len(result.errors) == 0
    print(f"\nResult: {'PASSED' if success else 'FAILED'}")

    return success


def run_specific_test_module(module_name):
    """Run tests from a specific module"""
    module_map = {
        "extractor": [TestPPTXExtractor, TestPPTXExtractorWithRealFile],
        "diff": [TestPPTXDiffer, TestPPTXDifferIntegration],
        "cli": [
            TestUtilityFunctions,
            TestInstaller,
            TestCommandParser,
            TestMainFunction,
            TestCLIIntegration,
        ],
        "integration": [
            TestPPTXCreation,
            TestPPTXDiffIntegration,
            TestGitIntegration,
            TestRealFileIntegration,
        ],
    }

    if module_name not in module_map:
        print(f"Unknown module: {module_name}")
        print(f"Available modules: {', '.join(module_map.keys())}")
        return False

    loader = unittest.TestLoader()
    suite = unittest.TestSuite()

    for test_class in module_map[module_name]:
        tests = loader.loadTestsFromTestCase(test_class)
        suite.addTests(tests)

    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    return len(result.failures) == 0 and len(result.errors) == 0


def main():
    """Main entry point"""
    import argparse

    parser = argparse.ArgumentParser(description="Git PPT Test Runner")
    parser.add_argument(
        "--module",
        "-m",
        choices=["extractor", "diff", "cli", "integration"],
        help="Run tests for specific module only",
    )
    parser.add_argument("--verbose", "-v", action="store_true", help="Verbose output")
    parser.add_argument(
        "--quiet", "-q", action="store_true", help="Quiet output (minimal)"
    )

    args = parser.parse_args()

    # Determine verbosity
    if args.quiet:
        verbosity = 0
    elif args.verbose:
        verbosity = 2
    else:
        verbosity = 1

    print("Git PPT Test Suite")
    print("=" * 50)

    if args.module:
        print(f"Running {args.module} tests only...")
        success = run_specific_test_module(args.module)
    else:
        print("Running all tests...")
        success = run_tests(verbosity)

    # Exit with appropriate code
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
