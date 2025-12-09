# Security Best Practices Before GitHub

## ⚠️ CRITICAL: Read This Before Pushing Code

This document outlines essential security practices to prevent API key leaks and maintain a secure codebase.

---

## Pre-Commit Security Checklist

Before pushing ANY code to GitHub, verify:

- [ ] `.env.local` is in `.gitignore`
- [ ] No hardcoded API keys in any file
- [ ] No sensitive data in commit history
- [ ] `.gitignore` includes all sensitive files
- [ ] Environment variables use placeholder values in documentation

---

##  1. Never Commit API Keys

### What NOT to do ❌

\`\`\`typescript
// ❌ WRONG - Hardcoded API key
const openai = new OpenAI({
  apiKey: "sk-proj-abc123xyz..." // NEVER DO THIS!
});

// ❌ WRONG - Hardcoded credentials
const supabaseUrl = "https://yourproject.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
\`\`\`

### What to do ✅

\`\`\`typescript
// ✅ CORRECT - Use environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
\`\`\`

---

## 2. Protect .env.local

### Ensure .gitignore is Correct

Your `.gitignore` MUST include:

\`\`\`gitignore
# Environment variables
.env
.env.local
.env*.local
.env.production

# Secrets
*.pem
*.key
secrets/

# Build outputs
.next/
out/
build/
dist/

# Dependencies
node_modules/

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Logs
*.log
npm-debug.log*

# Testing
coverage/
.nyc_output/
\`\`\`

### Verify .env.local is Ignored

\`\`\`bash
# Check if .env.local is tracked
git status

# If .env.local appears, it's NOT ignored - fix immediately!
git rm --cached .env.local
git commit -m "Remove .env.local from tracking"
\`\`\`

### Create .env.example Instead

\`\`\`bash
# .env.example (safe to commit)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
OPENAI_API_KEY=sk-proj-your-api-key-here
DEV_FAKE_OPENAI=0
\`\`\`

**Important**: Use placeholder values, NOT your real keys!

---

## 3. Check Git History for Leaks

### Scan Before Pushing

\`\`\`bash
# Search for potential API keys in uncommitted changes
git diff | grep -E "sk-|eyJ|supabase"

# Search entire repository
git log --all -- "*.env*"

# Check for hardcoded secrets
git grep -E "apiKey|OPENAI_API_KEY|SUPABASE" -- '*.ts' '*.tsx' '*.js'
\`\`\`

### If You Find a Leak

❌ **If you already committed a secret**:

1. **Immediately revoke the API key**:
   - OpenAI: https://platform.openai.com/api-keys
   - Supabase: Dashboard → Settings → API → Reset keys

2. **Remove from git history**:
\`\`\`bash
# Install BFG Repo-Cleaner
brew install bfg  # or download from https://rtyley.github.io/bfg-repo-cleaner/

# Remove secrets from history
bfg --replace-text secrets.txt  # List secrets to remove in secrets.txt

# Force push (if repo is already public, it's too late - keys are compromised)
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force
\`\`\`

3. **Generate new keys** and update `.env.local`

---

## 4. Safe File Patterns

### Environment Variables in Code

\`\`\`typescript
// ✅ Server-side (safe)
if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is not set");
}

// ✅ Client-side public variables (safe - must start with NEXT_PUBLIC_)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

// ⚠️ WARNING: Don't expose service role key to client
// Only use in Server Actions, API Routes, or server components
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Server-side only!
\`\`\`

### Configuration Files

\`\`\`typescript
// lib/config.ts
export const config = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    // Never export service role key to client
  },
  openai: {
    // Access via process.env in server code only
  }
};
\`\`\`

---

## 5. Vercel Environment Variables

### For Production Deployment

When deploying to Vercel, add environment variables in the Vercel dashboard:

1. Go to your project → Settings → Environment Variables
2. Add each variable:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENAI_API_KEY`

3. Select environments (Production, Preview, Development)
4. Click "Save"

**⚠️ Never commit production .env files to GitHub**

---

## 6. Team Collaboration - API Keys

### New Team Members

**DO NOT** share your API keys with team members. Instead:

1. **Each developer gets their own keys**:
   - OpenAI: Create separate API key for each team member
   - Supabase: Share project (they get same keys) OR create separate projects

2. **Document the process**:
\`\`\`markdown
# For New Developers

1. Get your own OpenAI API key: https://platform.openai.com/api-keys
2. Ask project owner for Supabase project invite
3. Create `.env.local` following `.env.example`
4. Never commit `.env.local`
\`\`\`

### Rotating Keys

Rotate API keys regularly (every 90 days recommended):

\`\`\`bash
# 1. Generate new keys
# 2. Update .env.local locally
# 3. Update Vercel environment variables
# 4. Revoke old keys
\`\`\`

---

## 7. Documentation Safety

### In README and Docs

❌ **Never include**:
- Actual API keys
- Database passwords
- Service role keys
- Personal access tokens

✅ **Use placeholders**:
\`\`\`bash
# ❌ WRONG
OPENAI_API_KEY=sk-proj-abc123xyz...

# ✅ CORRECT
OPENAI_API_KEY=your-openai-api-key-here
\`\`\`

---

## 8. Pre-Push Security Scan

### Automated Checks

Install `git-secrets` to prevent commits with secrets:

\`\`\`bash
# Install
brew install git-secrets  # macOS
# or
git clone https://github.com/awslabs/git-secrets.git
cd git-secrets && make install

# Setup
git secrets --install
git secrets --register-aws

# Add custom patterns
git secrets --add 'sk-[a-zA-Z0-9]{20,}'  # OpenAI keys
git secrets --add 'eyJ[a-zA-Z0-9_-]*\\.eyJ[a-zA-Z0-9_-]*\\.' # JWT tokens
\`\`\`

### Manual Checks

Before `git push`:

\`\`\`bash
# 1. Review changes
git diff

# 2. Check for secrets
git diff | grep -E "sk-|eyJ|supabase|api.?key"

# 3. Verify .env.local is not staged
git status | grep .env.local
# Should be empty or show "nothing to commit"

# 4. Only then push
git push
\`\`\`

---

## 9. Public vs Private Repositories

### If Repository is Public

**Extra caution required**:
- [ ] Double-check no secrets anywhere
- [ ] Scan entire git history
- [ ] Never commit config files
- [ ] Use environment variables for ALL sensitive data

### If Repository is Private

**Still be cautious**:
- Private repos can be accidentally made public
- Team members may fork and make public
- Repository access may change

**Best practice**: Treat every repository as if it will be public

---

## 10. Revoking Compromised Keys

### If You Accidentally Expose a Key

**Act immediately**:

1. **Revoke the key**:
   - OpenAI: https://platform.openai.com/api-keys → Revoke
   - Supabase: Dashboard → Settings → API → Reset Keys

2. **Generate new key** and update everywhere:
   - Local `.env.local`
   - Vercel environment variables
   - Any other deployment platforms

3. **Check billing**:
   - Review API usage for unauthorized requests
   - Set up usage alerts

4. **Notify team** if applicable

---

## 11. Code Review Checklist

Before merging pull requests:

- [ ] No hardcoded secrets
- [ ] No `.env*` files added
- [ ] No sensitive data in comments
- [ ] Environment variables properly used
- [ ] Documentation uses placeholders

---

## 12. Security Monitoring

### Set Up Alerts

**OpenAI**:
- Set usage limits: https://platform.openai.com/account/limits
- Enable email alerts for high usage

**Supabase**:
- Monitor auth logs for suspicious activity
- Review database logs regularly

**Vercel**:
- Set up deployment notifications
- Monitor function invocation counts

---

## Final Pre-GitHub Checklist

Before pushing to GitHub for the first time:

- [ ] `.gitignore` includes `.env.local`
- [ ] All API keys are in `.env.local` (not in code)
- [ ] `.env.example` has placeholder values only
- [ ] No secrets in git history (`git log --all -p | grep -E "sk-|eyJ"`)
- [ ] Documentation uses placeholders
- [ ] Team members know how to get their own keys
- [ ] README explains security practices
- [ ] Pre-commit hooks installed (optional but recommended)

---

## Additional Resources

- **GitHub Security**: https://docs.github.com/en/code-security
- **OWASP Top 10**: https://owasp.org/www-project-top-ten/
- **Supabase Security**: https://supabase.com/docs/guides/platform/security
- **Vercel Security**: https://vercel.com/docs/security

---

## Questions?

If unsure about whether something is safe to commit:

1. **When in doubt, don't commit it**
2. Ask a senior developer
3. Review this document
4. Check if it contains any of:
   - API keys
   - Passwords
   - Tokens
   - Email addresses
   - Database credentials
   - Private URLs

---

## Remember

🔒 **Security is everyone's responsibility**  
🚫 **Never commit secrets**  
✅ **Always use environment variables**  
⚠️ **Treat private repos like public repos**  
🔄 **Rotate keys regularly**

---

**Last Updated**: 2025-12-10

Stay secure! 🛡️
