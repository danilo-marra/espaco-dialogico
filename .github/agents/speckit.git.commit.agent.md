---
description: Auto-commit changes after a Spec Kit command completes
---

<!-- Extension: git -->
<!-- Config: .specify/extensions/git/ -->

# Auto-Commit Changes

Automatically stage and commit all changes after a Spec Kit command completes.

## Behavior

This command is invoked as a hook after (or before) core commands. It:

1. Determines the event name from the hook context (e.g., if invoked as an `after_specify` hook, the event is `after_specify`; if `before_plan`, the event is `before_plan`)
2. Checks `.specify/extensions/git/git-config.yml` for the `auto_commit` section
3. Looks up the specific event key to see if auto-commit is enabled
4. Falls back to `auto_commit.default` if no event-specific key exists
5. Uses the per-command `message` if configured, otherwise a default message
6. If enabled and there are uncommitted changes, runs `git add .` + `git commit`

> [!CAUTION] > `git add .` stages every tracked change and every untracked file under the repository root. Verify `.gitignore` before enabling auto-commit, or switch the hook to a narrower staging mode if you do not want new files included.

## Execution

Determine the event name from the hook that triggered this command, then run the script:

- **Bash**: `.specify/extensions/git/scripts/bash/auto-commit.sh <event_name>`
- **PowerShell**: `.specify/extensions/git/scripts/powershell/auto-commit.ps1 <event_name>`

Replace `<event_name>` with the actual hook event (e.g., `after_specify`, `before_plan`, `after_implement`).

## Configuration

In `.specify/extensions/git/git-config.yml`:

```yaml
auto_commit:
  default: false # Global toggle — set true to enable for all commands
  after_specify:
    enabled: true # Override per-command
    message: "[Spec Kit] Add specification"
  after_plan:
    enabled: false
    message: "[Spec Kit] Add implementation plan"
```

The current hook reads `auto_commit.default` plus event-specific `enabled` and `message` keys. If you extend the hook to support safer staging, prefer `git add -u` for tracked/modified files or explicit path lists instead of `git add .`.

Example of a safer staging policy if you add a staging selector to the hook configuration:

```yaml
auto_commit:
  default: false
  staging: tracked # equivalent to git add -u
  after_specify:
    enabled: true
    message: "[Spec Kit] Add specification"
```

## Graceful Degradation

- If Git is not available or the current directory is not a repository: skips with a warning
- If no config file exists: skips (disabled by default)
- If no changes to commit: skips with a message
