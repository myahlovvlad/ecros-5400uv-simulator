$ErrorActionPreference = "Stop"

function Invoke-Git {
  param(
    [Parameter(Mandatory = $true)]
    [string[]]$Args
  )

  & git @Args
  if ($LASTEXITCODE -ne 0) {
    throw "git $($Args -join ' ') failed with exit code $LASTEXITCODE"
  }
}

try {
  $branch = (git rev-parse --abbrev-ref HEAD).Trim()
  if ($LASTEXITCODE -ne 0 -or $branch -eq "HEAD") {
    throw "Current checkout is detached. Switch to a branch before syncing."
  }

  $upstream = (git for-each-ref --format="%(upstream:short)" "refs/heads/$branch").Trim()
  if ([string]::IsNullOrWhiteSpace($upstream)) {
    throw "Branch '$branch' has no upstream. Set it with: git branch --set-upstream-to origin/$branch"
  }

  Write-Host "Current branch: $branch"
  Write-Host "Tracking branch: $upstream"

  $status = git status --porcelain
  if ($LASTEXITCODE -ne 0) {
    throw "Unable to read git status."
  }

  if ([string]::IsNullOrWhiteSpace(($status -join "").Trim())) {
    Write-Host "No local changes detected. Nothing to sync."
    exit 0
  }

  Invoke-Git -Args @("add", "-A")

  $cached = git diff --cached --name-only
  if ($LASTEXITCODE -ne 0) {
    throw "Unable to inspect staged changes."
  }

  if ([string]::IsNullOrWhiteSpace(($cached -join "").Trim())) {
    Write-Host "No staged changes after git add -A. Nothing to commit."
    exit 0
  }

  $timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
  Invoke-Git -Args @("commit", "-m", "auto-sync: $timestamp")
  Invoke-Git -Args @("pull", "--rebase")
  Invoke-Git -Args @("push")

  Write-Host "Sync complete."
}
catch {
  Write-Error $_
  Write-Host "Sync stopped without overwriting local work. Resolve the reported problem manually and rerun the script."
  exit 1
}
