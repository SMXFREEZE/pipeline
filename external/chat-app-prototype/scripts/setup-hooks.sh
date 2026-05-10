#!/bin/bash

# Setup script for git hooks
# Configures git to use local .githooks directory

echo "Setting up git hooks..."

# Configure git to use local .githooks directory
git config core.hooksPath .githooks

echo "[SUCCESS] Git hooks configured successfully"
echo "Pre-commit hook: Runs format, lint, type check, and secret scanning"
echo "Pre-push hook: Runs test suite before pushing"
echo "To bypass hooks (not recommended), use: git commit --no-verify or git push --no-verify"