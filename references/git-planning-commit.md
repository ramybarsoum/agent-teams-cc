# Git Planning Commit

Commit planning artifacts using standard git commands, respecting `commit_docs` config and gitignore status.

## Commit Planning Files

```bash
# Check if .planning/ is gitignored
git check-ignore -q .planning/ 2>/dev/null && echo "GITIGNORED" || echo "TRACKED"

# If tracked, commit normally:
git add .planning/STATE.md .planning/ROADMAP.md
git commit -m "docs({scope}): {description}"
```

If `.planning/` is gitignored or `commit_docs` is false, skip planning file commits.

## Amend previous commit

To fold `.planning/` file changes into the previous commit:

```bash
git add .planning/codebase/*.md
git commit --amend --no-edit
```

## Commit Message Patterns

| Command | Scope | Example |
|---------|-------|---------|
| plan-phase | phase | `docs(phase-03): create authentication plans` |
| execute-phase | phase | `docs(phase-03): complete authentication phase` |
| new-milestone | milestone | `docs: start milestone v1.1` |
| remove-phase | chore | `chore: remove phase 17 (dashboard)` |
| insert-phase | phase | `docs: insert phase 16.1 (critical fix)` |
| add-phase | phase | `docs: add phase 07 (settings page)` |

## When to Skip

- `commit_docs: false` in config
- `.planning/` is gitignored
- No changes to commit (check with `git status --porcelain .planning/`)
