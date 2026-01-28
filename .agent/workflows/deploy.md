---
description: How to deploy changes to GitHub and Vercel automatically
---

# Automatic Deployment Workflow

This workflow handles automatic deployment to GitHub and Vercel.

## Steps

// turbo-all

1. Stage all changes
```bash
git add -A
```

2. Commit with a descriptive message
```bash
git commit -m "Your commit message here"
```

3. Push to GitHub (Vercel auto-deploys from main branch)
```bash
git push origin main
```

## Notes
- All git commands should run automatically without user approval
- Vercel is connected to the GitHub repository and auto-deploys on push to main
- Changes are typically live within 1-2 minutes after push
