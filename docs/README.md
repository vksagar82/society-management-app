# Society Management System Documentation

This directory contains the GitHub Pages documentation for the Society Management System.

## 📖 Documentation Structure

- **index.md** - Home page with feature overview
- **quick-start.md** - 5-minute setup guide
- **authentication.md** - User roles, JWT, and security
- **api-reference.md** - Complete API endpoint documentation
- **configuration.md** - Environment variables and setup
- **deployment.md** - Vercel deployment and production guide
- **email-setup.md** - Gmail SMTP configuration

## 🚀 Viewing Locally

To preview the documentation locally:

```bash
# Install Jekyll (one-time setup)
gem install bundler jekyll

# Serve the docs
cd docs
jekyll serve
```

Open [http://localhost:4000](http://localhost:4000)

## 🌐 GitHub Pages Deployment

### Enable GitHub Pages

1. Go to repository Settings → Pages
2. Source: Deploy from branch
3. Branch: `main` or `master`
4. Folder: `/docs`
5. Click Save

Your docs will be available at:
```
https://YOUR_USERNAME.github.io/society-management-app/
```

### Custom Domain (Optional)

1. Add CNAME file:
   ```bash
   echo "docs.yourdomain.com" > docs/CNAME
   ```

2. Configure DNS:
   ```
   Type: CNAME
   Name: docs
   Value: YOUR_USERNAME.github.io
   ```

3. Wait for DNS propagation (5-10 minutes)

## 📝 Editing Documentation

All documentation is written in Markdown with YAML front matter:

```markdown
---
layout: default
title: Page Title
---

# Page Content

Your markdown content here...
```

## 🎨 Customization

### Theme

Current theme: `jekyll-theme-cayman`

To change theme, update `_config.yml`:
```yaml
theme: jekyll-theme-minimal
```

Available themes: https://pages.github.com/themes/

### Navigation

Edit navigation in `_config.yml`:
```yaml
navigation:
  - title: New Page
    url: /new-page
```

### Styling

Add custom CSS in page front matter:
```markdown
<style>
/* Custom styles */
</style>
```

## 📚 Contributing

When updating documentation:

1. Keep language clear and concise
2. Use code examples where helpful
3. Include troubleshooting sections
4. Test locally before committing
5. Update table of contents if needed

## 🔗 Links

- [Jekyll Documentation](https://jekyllrb.com/docs/)
- [GitHub Pages Guide](https://docs.github.com/en/pages)
- [Markdown Guide](https://www.markdownguide.org/)
