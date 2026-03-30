# Git Sync Setup

## What This Repository Configures

This repository includes:

- `scripts/git-sync.ps1`
- `scripts/git-sync.sh`
- `.vscode/tasks.json`

The scripts are intentionally conservative:

- they do not use force push
- they stop on missing upstream configuration
- they stop on rebase or push errors
- they do not overwrite uncommitted work silently

## What You Must Configure Locally

You must set up the local machine yourself for:

- GitHub authentication
- the correct `origin` remote
- optional scheduler integration
- any preferred VS Code shell settings

This repository does not store tokens or configure secrets.

## Local Preflight

Before using the sync scripts, verify:

```bash
git remote -v
git branch -vv
```

Expected result:

- `origin` points to the intended GitHub repository
- your current branch has an upstream such as `origin/main`

If the upstream is missing:

```bash
git branch --set-upstream-to origin/<branch-name>
```

## GitHub Authentication

Set up authentication locally before the first sync:

1. Install Git and, if desired, Git Credential Manager.
2. Authenticate with GitHub using your preferred method:
   - HTTPS with credential manager
   - SSH with a registered key
   - GitHub CLI authentication
3. Test authentication manually:

```bash
git fetch origin
```

Do not put tokens into repo files.

## Running The Sync Scripts

### PowerShell

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\git-sync.ps1
```

### bash

```bash
bash ./scripts/git-sync.sh
```

### VS Code Tasks

Open the Command Palette and run one of:

- `Tasks: Run Task` → `Git: Sync Current Branch`
- `Tasks: Run Task` → `Git: Sync Current Branch (PowerShell)`
- `Tasks: Run Task` → `Git: Sync Current Branch (bash)`

## Script Behavior

If there are no local changes, the script exits cleanly.

If there are local changes, the script performs:

1. `git add -A`
2. `git commit -m "auto-sync: <timestamp>"`
3. `git pull --rebase`
4. `git push`

If a rebase conflict or push error happens:

- the script exits with a non-zero code
- it prints a clear stop message
- it does not force-push

## Limitations

- The scripts only sync the current branch.
- They require the branch to already track an upstream branch.
- A rebase conflict still requires manual resolution.
- If local policy requires signed commits, the commit step may stop until signing is configured.
- Scheduler integration is not automatic.

## Optional Local Automation

These are documented manual options only. They are not configured by this repository.

### Windows Task Scheduler

Create a task that runs:

```powershell
powershell -ExecutionPolicy Bypass -File C:\path\to\repo\scripts\git-sync.ps1
```

Use a start-in directory pointing at the repository root.

### cron on Linux or macOS

Add a cron entry similar to:

```cron
*/30 * * * * cd /path/to/repo && bash ./scripts/git-sync.sh
```

Review cron behavior carefully before enabling unattended commits.
