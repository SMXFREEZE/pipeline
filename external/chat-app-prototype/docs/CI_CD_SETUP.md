# CI/CD Setup Documentation

This document describes the comprehensive CI/CD setup implemented for the iMessage Prototype project.

## Overview

The project now has a robust CI/CD pipeline with:

- Automated testing with Jest
- Security scanning (GitHub-native secret scanning + push protection, CodeQL, Dependabot)
- Code quality checks (ESLint, Prettier, TypeScript)
- Build validation and bundle size monitoring
- Automated versioning with semantic-release
- Optimized caching for faster builds

## Local Development Hooks

### Pre-commit Hook

Runs on every commit to catch issues early:

- **Secret scanning** with Gitleaks (prevents API keys from being committed)
- **Format check** with Prettier
- **Lint check** with ESLint
- **Type check** with TypeScript
- **Expo compatibility check**

Location: `.githooks/pre-commit`

### Pre-push Hook

Runs before pushing to remote:

- **Test suite** execution with Jest

Location: `.githooks/pre-push`

### Setup Hooks

Run this command to activate the hooks:

```bash
npm run setup-hooks
```

Or manually:

```bash
chmod +x scripts/setup-hooks.sh .githooks/pre-commit .githooks/pre-push
./scripts/setup-hooks.sh
```

### Bypassing Hooks

Only use when absolutely necessary:

```bash
git commit --no-verify
git push --no-verify
```

## GitHub Actions Workflows

### 1. CI/CD Pipeline (`ci.yml`)

Main workflow that runs on all pushes and pull requests.

**Jobs:**

1. **Code Quality**

   - Prettier format check
   - ESLint
   - TypeScript type check
   - TypeScript strict check (non-blocking)

2. **Test**

   - Jest unit tests
   - Coverage reporting to Codecov
   - Coverage artifact upload

3. **Build Validation**

   - Expo dependency check
   - iOS prebuild validation
   - Production bundle creation
   - Bundle size monitoring (warns if >50MB)

4. **Summary**
   - Aggregates all job statuses
   - Fails if any job fails

**Features:**

- Concurrency groups (auto-cancels redundant runs)
- Dependency caching (npm, Expo, Metro)
- Parallel job execution
- Artifact retention (7 days)

### 2. CodeQL Security Analysis (`codeql.yml`)

Automated security scanning for JavaScript/TypeScript.

**Runs:**

- On push to main/master/develop
- On pull requests
- Weekly on Mondays at 6am UTC

**Features:**

- Detects security vulnerabilities (SQL injection, XSS, etc.)
- Scans code for quality issues
- Results visible in GitHub Security tab

### 3. Semantic Release (`release.yml`)

Automated versioning and changelog generation.

**Triggers:**

- Push to main/master branch
- Skips if commit message contains `chore(release)`

**Actions:**

- Analyzes commit messages (conventional commits)
- Determines version bump (major/minor/patch)
- Generates CHANGELOG.md
- Updates package.json version
- Creates GitHub release
- Tags commit

**Commit Message Format:**

```text
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**

- `feat`: New feature (minor bump)
- `fix`: Bug fix (patch bump)
- `perf`: Performance improvement (patch bump)
- `refactor`: Code refactoring (patch bump)
- `build`: Build system changes (patch bump)
- `docs`: Documentation only (no release)
- `style`: Code style changes (no release)
- `test`: Test changes (no release)
- `chore`: Maintenance (no release)
- `ci`: CI changes (no release)

**Example Commits:**

```bash
feat: add dark mode support
fix: resolve message timestamp bug
perf: optimize bundle size
refactor: improve AI service architecture
```

### 4. Dependabot (`dependabot.yml`)

Automated dependency updates.

**Schedule:**

- Weekly on Mondays at 9am
- Max 10 open PRs at once

**Grouping:**

- Expo packages
- React Native packages
- Storybook packages
- AI SDKs (Anthropic, OpenAI)
- Dev dependencies (minor/patch)

**Features:**

- Security vulnerability scanning
- Automatic PR creation
- Grouped updates for related packages

## Testing Setup

### Jest Configuration

- **Framework:** Jest with jest-expo preset
- **Testing Library:** @testing-library/react-native
- **Coverage Threshold:** 70% (branches, functions, lines, statements)

### Running Tests

```bash
npm test              # Run tests
npm run test:watch    # Watch mode
npm run test:coverage # Generate coverage report
npm run test:ci       # CI mode (coverage + no watch)
```

### Test Location

Create tests in:

- `__tests__/` directories
- Files named `*.test.ts`, `*.test.tsx`, `*.spec.ts`, `*.spec.tsx`

### Example Test

See `components/__tests__/example.test.tsx` for a basic example.

## Required GitHub Secrets

### For CI/CD

- `EXPO_TOKEN` - Expo access token for EAS/prebuild
  - Get from: <https://expo.dev/settings/access-tokens>
  - Required for: Build validation workflow

### For Codecov (Optional)

- `CODECOV_TOKEN` - Codecov upload token
  - Get from: <https://codecov.io/>
  - Optional: Uploads work without token for public repos

### For Semantic Release (Auto-provided)

- `GITHUB_TOKEN` - Automatically provided by GitHub Actions
  - Used for: Creating releases and tags

## Setting Up a New Environment

1. **Install Dependencies**

```bash
npm install
```

1. **Set Up Git Hooks**

```bash
npm run setup-hooks
```

1. **Install Gitleaks (for secret scanning)**

```bash
# macOS
brew install gitleaks

# Windows (Chocolatey)
choco install gitleaks

# Linux
https://github.com/gitleaks/gitleaks#installing
```

1. **Configure GitHub Secrets**

Go to repository Settings → Secrets and variables → Actions

Add required secrets (see above).

1. **Enable Workflows**

Workflows are automatically enabled when merged to main branch.

## Monitoring and Reports

### Code Coverage

- View in CI artifacts
- Upload to Codecov (if configured)
- Local: `npm run test:coverage` then open `coverage/lcov-report/index.html`

### Bundle Size

- Monitored in CI build-validation job
- Warnings if exceeds 50MB
- Artifacts available for download

### Security Scanning

- GitHub native secret scanning + push protection (configured in repo settings)
- CodeQL results in Security tab
- Dependabot alerts in Security tab
- Local pre-commit hook runs Gitleaks before commits land

### Release History

- View in GitHub Releases
- CHANGELOG.md in repository

## Best Practices

### Commit Messages

Follow conventional commits for automatic versioning:

```text
feat(ai): add support for GPT-4 Turbo
fix(chat): resolve message duplication bug
perf(bundle): reduce app size by 2MB
docs: update CI/CD setup documentation
```

### Branch Strategy

- `main` - Production branch (triggers releases)
- `develop` - Development branch (runs CI only)
- Feature branches - Created from develop

### Testing

- Write tests for new features
- Maintain 70% coverage threshold
- Run tests locally before pushing

### Security

- Never commit secrets (.env files are gitignored)
- Review Dependabot PRs promptly
- Address CodeQL alerts

## Troubleshooting

### Pre-commit Hook Fails

Check specific failure:

- Format: Run `npm run format`
- Lint: Run `npm run lint:fix`
- Types: Fix TypeScript errors
- Secrets: Remove secrets or use `.gitignore`

### Pre-push Hook Fails

Tests are failing:

- Run `npm test` locally
- Fix failing tests
- Ensure coverage meets threshold

### CI Fails

1. Check specific job that failed
2. Review logs in GitHub Actions
3. Run same check locally
4. Fix and push again

### Gitleaks Not Installed

Pre-commit will warn but not fail. Install with:

```bash
brew install gitleaks  # macOS
```

### Bundle Size Warning

If bundle exceeds 50MB:

1. Analyze what's included
2. Check for large dependencies
3. Consider code splitting
4. Review asset sizes

## Migration Notes

### Breaking Changes

- Old workflow `lint-and-format.yml` removed (replaced by `ci.yml`)
- Semantic versioning requires conventional commit messages
- Coverage threshold enforced at 70%

### Backward Compatibility

- All existing npm scripts still work
- Git workflow unchanged
- No changes to app code required

## Additional Resources

- [Jest Documentation](https://jestjs.io/)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Release](https://semantic-release.gitbook.io/)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Gitleaks](https://github.com/gitleaks/gitleaks)
- [CodeQL](https://codeql.github.com/)

## Summary of Files Added/Modified

### Added Files

- `.github/dependabot.yml` - Dependabot configuration
- `.github/workflows/ci.yml` - Main CI/CD pipeline
- `.github/workflows/codeql.yml` - CodeQL security scanning
- `.github/workflows/release.yml` - Semantic release workflow
- `.githooks/pre-push` - Pre-push hook with tests
- `.releaserc.json` - Semantic release configuration
- `jest.config.js` - Jest configuration
- `jest.setup.js` - Jest setup file
- `components/__tests__/example.test.tsx` - Example test
- `CI_CD_SETUP.md` - This documentation

### Modified Files

- `package.json` - Added test scripts, Jest dependencies, semantic-release
- `.githooks/pre-commit` - Added Gitleaks secret scanning
- `scripts/setup-hooks.sh` - Updated for both hooks

### Removed Files

- `.github/workflows/lint-and-format.yml` - Replaced by ci.yml
