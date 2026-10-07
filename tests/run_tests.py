#!/usr/bin/env python3
"""
Educational Tools Hub - Test Runner CLI
Usage:
    python tests/run_tests.py --quick     # Run fast smoke test suite (minor changes)
    python tests/run_tests.py --full      # Run complete regression test suite (major changes)
"""

import sys
import os
import unittest
import time
import argparse

# Ensure UTF-8 output encoding on Windows consoles
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Add tests directory to python path
sys.path.insert(0, os.path.dirname(__file__))

import test_hub
import test_networks
import test_regression

# Terminal color helpers
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
CYAN = '\033[96m'
BOLD = '\033[1m'
RESET = '\033[0m'

def print_header(title, subtitle=""):
    print(f"\n{BOLD}{CYAN}{'='*64}{RESET}")
    print(f"{BOLD}{CYAN}  {title}{RESET}")
    if subtitle:
        print(f"{CYAN}  {subtitle}{RESET}")
    print(f"{BOLD}{CYAN}{'='*64}{RESET}\n")

def run_suite(suite_name, test_classes):
    loader = unittest.TestLoader()
    combined_suite = unittest.TestSuite()

    for cls in test_classes:
        combined_suite.addTests(loader.loadTestsFromTestCase(cls))

    start_time = time.time()
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(combined_suite)
    elapsed = time.time() - start_time

    print(f"\n{BOLD}Test Summary for [{suite_name}]:{RESET}")
    print(f"  * Total Tests Run: {result.testsRun}")
    print(f"  * Duration:       {elapsed:.3f}s")

    if result.wasSuccessful():
        print(f"  * Status:         {BOLD}{GREEN}[PASS] ALL TESTS PASSED SUCCESSFULLY{RESET}\n")
        return True
    else:
        print(f"  * Failures:       {BOLD}{RED}{len(result.failures)}{RESET}")
        print(f"  * Errors:         {BOLD}{RED}{len(result.errors)}{RESET}")
        print(f"  * Status:         {BOLD}{RED}[FAIL] TESTS FAILED{RESET}\n")
        return False

def main():
    parser = argparse.ArgumentParser(description="Educational Tools Test Runner")
    parser.add_argument(
        '--quick', '-q',
        action='store_true',
        help='Run fast smoke checks (files, schema, asset links, branding)'
    )
    parser.add_argument(
        '--full', '-f',
        action='store_true',
        help='Run full regression suite (algorithms, statistical precision, button IDs, DOM)'
    )

    args = parser.parse_args()

    # Default to full if neither specified
    is_quick = args.quick and not args.full

    if is_quick:
        print_header(
            "Educational Tools - Quick Smoke Test Suite (Minor Changes)",
            "Testing file structure, links, schema, branding, and theme tokens"
        )
        classes = [test_hub.TestHubIntegrity]
        success = run_suite("Minor / Quick Checks", classes)
    else:
        print_header(
            "Educational Tools - Full Regression Test Suite (Major Changes)",
            "Testing algorithms, mathematics precision, button IDs, links, and schemas"
        )
        classes = [
            test_hub.TestHubIntegrity,
            test_networks.TestNetworkStudio,
            test_regression.TestRegressionStudio
        ]
        success = run_suite("Major / Full Regression", classes)

    sys.exit(0 if success else 1)

if __name__ == '__main__':
    main()
