# CI/CD Pipeline Setup

## Overview

This project uses GitHub Actions for automated testing. The CI/CD pipeline runs on every push and pull request to ensure code quality, validate all integrations, and maintain high standards.

## Workflow

### Tests & Validation (`test.yml`)

Runs automatically on every push and pull request:

- **Lint & Build**: ESLint code quality checks and Next.js build validation
- **Database Tests**: Validates Supabase PostgreSQL connectivity
- **API Tests**: Tests all user management API endpoints
- **Email Tests**: Verifies Gmail SMTP configuration
- **Login Tests**: End-to-end authentication flow validation
- **Security Scan**: Detects exposed credentials and runs dependency audit
- **Status Summary**: Final report of all test results

## Setup Instructions

### Step 1: Add GitHub Secrets

Navigate to your repository:

```
Settings → Secrets and variables → Actions
```

Click "New repository secret" and add the following secrets:

#### Supabase Configuration

| Secret                      | Value                     | Source                              |
| --------------------------- | ------------------------- | ----------------------------------- |
| `SUPABASE_URL`              | Your Supabase project URL | Supabase Dashboard → Settings → API |
| `SUPABASE_ANON_KEY`         | Anonymous key             | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key          | Supabase Dashboard → Settings → API |

#### Authentication

| Secret       | Value                      | Source                            |
| ------------ | -------------------------- | --------------------------------- |
| `JWT_SECRET` | 32-character random string | Generate or use from `.env.local` |

#### Email Configuration

| Secret      | Value                     | Source                         |
| ----------- | ------------------------- | ------------------------------ |
| `SMTP_HOST` | `smtp.gmail.com`          | Fixed value                    |
| `SMTP_PORT` | `587`                     | Fixed value                    |
| `SMTP_USER` | Your Gmail address        | Your email account             |
| `SMTP_PASS` | 16-character app password | Google Account → App Passwords |

### Step 2: Generate Gmail App Password

1. Go to [Google Account](https://myaccount.google.com)
2. Left sidebar → **Security**
3. Scroll down to **App passwords** (requires 2FA enabled)
4. Select "Mail" and "Windows Computer"
5. Copy the 16-character password
6. Add as `SMTP_PASS` secret in GitHub

### Step 3: Trigger Workflows

Push your code to GitHub:

```bash
git add .
git commit -m "chore: configure github actions secrets"
git push origin main
```

### Step 6: Monitor Workflows

1. Go to **Actions** tab in your repository
2. Select the workflow to see detailed logs
3. All jobs should show green checkmarks ✅

## Test Files

The CI/CD pipeline runs four test scripts located in the `tests/` folder:

### tests/test-db.js

Tests database connectivity to Supabase PostgreSQL.

```bash
node tests/test-db.js
```

### tests/test-api-users.js

Tests all user management API endpoints.

```bash
node tests/test-api-users.js
```

### tests/test-email.js

Verifies Gmail SMTP configuration and email sending.

```bash
node tests/test-email.js
```

### tests/test-login.js

Tests complete authentication flow end-to-end.

```bash
node tests/test-login.js
```

## Workflow Triggers

| Event              | Workflow                  | Result                        |
| ------------------ | ------------------------- | ----------------------------- |
| Push to any branch | `test.yml`                | Run tests, lint, build        |
| Pull Request       | `test.yml` + `deploy.yml` | Run tests + deploy preview    |
| Push to `main`     | `test.yml` + `deploy.yml` | Run tests + deploy production |

## Deployment Flow

### Pull Request Workflow

```
Create PR
    ↓
Automated tests run
    ↓
If passing → Deploy preview to Vercel
    ↓
Review code
    ↓
Merge PR
    ↓
Deploy to production
```

### Production Deployment

```
Push to main branch
    ↓
Run all validations
    ↓
Build application
    ↓
Deploy to Vercel production
    ↓
✅ Live!
```

## Security Scanning

The pipeline includes multiple security checks:

### Credential Detection

Automatically scans source code for exposed secrets:

- Database passwords
- API keys
- JWT secrets
- SMTP credentials

### Dependency Audit

```bash
npm audit --production
```

Checks for known vulnerabilities in dependencies.

## Important: Regenerate Exposed Credentials

⚠️ **CRITICAL**: Since credentials may have been exposed, regenerate them immediately:

### 1. Supabase

1. Go to Supabase Dashboard → Project Settings → API
2. Click **"Rotate"** on the service role key
3. Go to PostgreSQL settings and reset the database password
4. Update `SUPABASE_SERVICE_ROLE_KEY` secret in GitHub

### 2. Gmail

1. Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
2. Delete the old password
3. Create a new 16-character app password
4. Update `SMTP_PASS` secret in GitHub

### 3. JWT Secret

1. Generate a new 32-character random string
2. Update in `.env.local`
3. Add as `JWT_SECRET` secret in GitHub

## Verification Checklist

- [ ] All 11 secrets added to GitHub Actions
- [ ] Gmail app password regenerated
- [ ] Supabase credentials regenerated
- [ ] JWT secret regenerated
- [ ] Code pushed to GitHub
- [ ] Actions tab shows workflows running
- [ ] All tests passing (green checkmarks)
- [ ] Preview deployment working on PR
- [ ] Production deployment working on main

## Troubleshooting

### Tests Failing Locally?

Run tests manually to debug:

```bash
node tests/test-db.js
node tests/test-api-users.js
node tests/test-email.js
node tests/test-login.js
```

### Workflow Not Running?

1. Check that you've pushed to a tracked branch
2. Verify workflow files exist in `.github/workflows/`
3. Check Actions tab for error messages

### Deployment Failed?

1. Go to GitHub Actions logs
2. Review error message in job output
3. Check Vercel deployment dashboard
4. Verify Vercel secrets are correct

### Secrets Not Working?

1. Reload GitHub page after adding secrets
2. Verify secret names match exactly (case-sensitive)
3. Check values don't have trailing spaces
4. For Vercel: Verify token hasn't expired

### Email Tests Skipped?

Email tests are configured with `continue-on-error: true` because they:

- Require real Gmail credentials
- May fail in CI environment
- Are not critical for deployment

Tests still run but don't block the pipeline.

## Manual Workflow Trigger

To manually run a workflow without pushing:

1. Go to **Actions** tab
2. Select the workflow name
3. Click **"Run workflow"**
4. Select branch
5. Click **"Run"**

## Adding New Tests

To add a new test file:

1. Create `tests/test-something.js`
2. Edit `.github/workflows/test.yml`
3. Add new job section:

```yaml
test-something:
  name: Something Tests
  runs-on: ubuntu-latest
  needs: lint-and-build

  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: "18"
        cache: "npm"
    - run: npm ci
    - run: node tests/test-something.js
```

4. Add to `notify-status` needs array
5. Commit and push

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel Deployment Docs](https://vercel.com/docs)
- [Node.js Testing Best Practices](https://nodejs.org/en/docs/guides/testing/)
- [Supabase API Documentation](https://supabase.com/docs/reference)

## Support

For issues:

1. Check GitHub Actions logs for detailed errors
2. Review `.github/workflows/` files
3. Run tests locally to reproduce issues
4. Verify all secrets are configured correctly
