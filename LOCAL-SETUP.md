# Local Development Setup

## Current Status
✅ **Local development server running** at http://localhost:8080
✅ **Connected to production Supabase database**
✅ **Git repository initialized** with all files committed
✅ **GitHub remote configured** (elifeline/lifelinepublic)

## Repository Connection
The local repository is connected to GitHub at: https://github.com/elifeline/lifelinepublic

### Current Setup:
- **Local branch:** main
- **Remote:** origin -> https://github.com/elifeline/lifelinepublic.git
- **All files committed locally** (Initial commit: 296 files)

### Syncing with GitHub:
Since the repository is private and requires authentication:

**Option 1: Use Claude Code with GitHub MCP** (Recommended)
- Claude Code has MCP access to the GitHub repository
- Can push/pull changes through Claude Code sessions

**Option 2: Set up Personal Access Token**
1. Go to GitHub Settings > Developer settings > Personal access tokens
2. Create a token with repo scope
3. Use: `git remote set-url origin https://YOUR_TOKEN@github.com/elifeline/lifelinepublic.git`

**Option 3: Continue Local Development**
- Work locally without pushing to GitHub
- Changes are saved in local git commits
- Can sync later when authentication is set up

## Making Changes

### Current Workflow:
1. **Edit files locally** - Changes appear instantly with hot reload
2. **Commit changes locally**:
   ```bash
   git add .
   git commit -m "Your message"
   ```
3. **Test in browser** at http://localhost:8080

### File Tracking:
- All changes are tracked in local git
- Run `git status` to see modified files
- Run `git diff` to see changes

## Project Structure
```
lifelinepublic-main/
├── src/                # React source code
│   ├── components/     # React components
│   ├── pages/         # Page components
│   ├── contexts/      # React contexts
│   ├── hooks/         # Custom hooks
│   └── lib/           # Utilities (Supabase client)
├── public/            # Static assets
├── supabase/          # Database migrations & functions
└── .env              # Environment variables (Supabase credentials)
```

## Key Points
- **No VS Code required** - Can edit with any text editor
- **No Lovable mode needed** - Direct file access available
- **Production database** - Changes to data affect the live site
- **Local commits** - All changes saved in git history

## Next Steps
When ready to sync with GitHub:
1. Set up authentication (see options above)
2. Pull latest changes: `git pull origin main`
3. Push your changes: `git push origin main`

For now, local development is fully functional without GitHub sync!