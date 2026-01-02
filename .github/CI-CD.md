# GitHub Actions CI/CD Pipeline

This project includes automated testing and deployment via GitHub Actions.

## 📋 Workflows

### 1. **Tests & Validation** (`test.yml`)

Runs on every push and pull request to:

- ✅ Lint code with ESLint
- ✅ Build Next.js application
- ✅ Run database tests
- ✅ Run API tests
- ✅ Run email configuration tests
- ✅ Run login flow tests
- ✅ Scan for exposed credentials

### 2. **Deploy to Vercel** (`deploy.yml`)

Runs on pushes to main/master to:

- ✅ Build the application
- ✅ Deploy preview to Vercel (on PR)
- ✅ Deploy production to Vercel (on merge to main)

---

## 🔧 Setup Instructions

### Step 1: Configure GitHub Secrets

Go to: **Settings → Secrets and variables → Actions**

Add the following secrets:

#### Supabase Configuration

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

#### Authentication

```
JWT_SECRET=your_32_char_secret_here
```

#### Email Configuration

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your_16_char_app_password
```

#### Vercel Deployment (Optional)

```
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_vercel_org_id
VERCEL_PROJECT_ID=your_vercel_project_id
```

### Step 2: Generate Vercel Token

1. Go to [Vercel Settings → Tokens](https://vercel.com/account/tokens)
2. Create a new token
3. Copy and add as `VERCEL_TOKEN` secret

### Step 3: Get Vercel IDs

1. Go to your Vercel project
2. Find project ID in: Settings → General
3. Find org ID in: Account → Teams
4. Add both as GitHub secrets

---

## ✅ Test Files

The CI/CD pipeline runs the following test files:

### test-email.js

Tests Gmail SMTP configuration:

```bash
node test-email.js
```

**Runs on**: Every push/PR
**Requirements**: SMTP credentials

### test-db.js

Tests database connection:

```bash
node test-db.js
```

**Runs on**: Every push/PR
**Requirements**: Supabase credentials

### test-api-users.js

Tests API endpoints:

```bash
node test-api-users.js
```

**Runs on**: Every push/PR
**Requirements**: Supabase + JWT secret

### test-login.js

Tests authentication flow:

```bash
node test-login.js
```

**Runs on**: After API tests pass
**Requirements**: Supabase + JWT secret

---

## 📊 GitHub Actions Dashboard

View workflow status in your repository:

1. Go to **Actions** tab
2. Select a workflow to see detailed logs
3. Click a run to see specific job output

### Workflow Statuses

- **✅ Green**: All tests passed
- **⚠️ Yellow**: In progress
- **❌ Red**: Test failed

---

## 🚀 Deployment Flow

### Pull Request Workflow

1. Tests run automatically
2. If all tests pass → Preview deployed to Vercel
3. Preview URL shown in PR comments
4. Code review happens
5. Manual merge triggers production deployment

### Main Branch Workflow

```
Push to main/master
    ↓
Run all tests
    ↓
Build application
    ↓
Deploy to production Vercel
    ↓
✅ Live!
```

---

## 🔍 Security Scanning

The pipeline includes security checks:

### Credential Detection

```bash
# Checks for exposed secrets in source code
grep -r "SMTP_PASS\|JWT_SECRET\|SERVICE_ROLE_KEY" .env.local
```

### Dependency Audit

```bash
npm audit --production
```

### Best Practices

- Never commit `.env.local` (it's in `.gitignore`)
- Always use `.env.local.example` as template
- Store secrets in GitHub Actions only

---

## 🐛 Troubleshooting

### Tests Failing Locally?

```bash
# Run the same tests locally
node test-email.js
node test-db.js
node test-api-users.js
node test-login.js
```

### Deployment Failed?

1. Check GitHub Actions logs
2. Verify all secrets are set
3. Check Vercel project settings
4. Review error message in workflow output

### Email Tests Skipped?

Email tests run with `continue-on-error: true` because:

- May fail in CI environment
- Not critical for deployment
- Requires real Gmail credentials

---

## 📝 Configuration

### Adding New Tests

1. Create test file: `test-something.js`
2. Add to `test.yml`:

```yaml
- name: Run something tests
  run: node test-something.js
```

3. Commit and push
4. Monitor Actions tab

### Modifying Workflows

Edit `.github/workflows/test.yml` or `deploy.yml`:

- Update triggers (branches, events)
- Add/remove jobs
- Change environment variables
- Update dependencies

---

## 🎯 Best Practices

1. **Always test locally first**

   ```bash
   npm run build
   node test-email.js
   npm run lint
   ```

2. **Create feature branches**

   ```bash
   git checkout -b feature/amazing-feature
   # Make changes
   # Tests run automatically
   git push origin feature/amazing-feature
   ```

3. **Keep secrets secure**

   - Use GitHub Secrets for sensitive data
   - Never hardcode credentials
   - Rotate credentials regularly

4. **Review PR checks**
   - All tests must pass before merging
   - Check deployment preview
   - Verify email/API tests

---

## 📚 Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel Deployment Guide](https://vercel.com/docs)
- [Node.js Test Scripts](../README.md#-quick-start)

---

## Support

For issues with CI/CD:

1. Check GitHub Actions logs
2. Review workflow files in `.github/workflows/`
3. Verify all secrets are configured
4. Run tests locally to debug
