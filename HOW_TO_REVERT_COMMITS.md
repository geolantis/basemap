# How to Revert the Latest Commit

This document demonstrates different methods to revert the latest commit in a Git repository.

## Repository Context
This repository contains basemap configuration JSON files for various geographical regions and mapping styles.

## Methods to Revert the Latest Commit

### Method 1: git reset --hard HEAD~1 (What we just used)
**Use when:** You want to completely remove the latest commit from history (destructive)

```bash
# Remove the latest commit entirely
git reset --hard HEAD~1
```

**Result:** 
- Latest commit is completely removed from history
- Working directory is reset to the previous commit state
- **WARNING:** This is destructive - the commit is gone forever

### Method 2: git revert HEAD (Recommended for shared repositories)
**Use when:** You want to create a new commit that undoes the changes from the latest commit

```bash
# Create a new commit that undoes the latest commit
git revert HEAD --no-edit
```

**Result:**
- Creates a new commit that reverses the changes
- Preserves history - the original commit remains
- Safe for shared repositories

### Method 3: git reset --soft HEAD~1 (Keep changes in staging)
**Use when:** You want to undo the commit but keep the changes staged

```bash
# Undo the commit but keep changes staged
git reset --soft HEAD~1
```

**Result:**
- Removes the commit from history
- Keeps all changes in the staging area
- Allows you to modify and recommit

### Method 4: git reset --mixed HEAD~1 (Keep changes unstaged)
**Use when:** You want to undo the commit and unstage the changes

```bash
# Undo the commit and unstage changes
git reset --mixed HEAD~1
# or simply
git reset HEAD~1
```

**Result:**
- Removes the commit from history
- Moves changes to working directory (unstaged)
- Default behavior of git reset

## Current Repository State

After executing `git reset --hard HEAD~1`, we have:

- **Before:** HEAD was at commit "Initial plan" (4d182db)
- **After:** HEAD is now at commit "Added Czech maps" (908edc5)
- **Files affected:** None (the reverted commit was empty)

## Important Considerations

1. **For shared repositories:** Use `git revert` instead of `git reset` to avoid rewriting history
2. **For local-only work:** `git reset` is fine and cleaner
3. **Always backup important work** before reverting commits
4. **Check what files were changed** in the commit before reverting using:
   ```bash
   git show --name-status HEAD
   ```

## Verification Commands

After reverting, verify the state with:

```bash
# Check current commit
git log --oneline -3

# Check working directory status
git status

# See what files are in the repository
ls -la
```

## Example: What We Just Did

```bash
# Initial state
$ git log --oneline -2
4d182db (HEAD) Initial plan
908edc5 Added Czech maps

# Reverted the latest commit
$ git reset --hard HEAD~1
HEAD is now at 908edc5 Added Czech maps

# New state
$ git log --oneline -2
908edc5 (HEAD) Added Czech maps
```

The "Initial plan" commit has been successfully reverted and removed from the repository history.

## Results of the Revert Operation

✅ **Successfully reverted the latest commit**
- **Commit removed:** "Initial plan" (4d182db)
- **Current HEAD:** "Added Czech maps" (908edc5) 
- **Files affected:** None (the reverted commit was empty)
- **Repository state:** Clean, 36 JSON basemap configuration files remain intact

## Note About Force Push

Since we used `git reset --hard` which rewrites history, if you need to update a remote repository, you'll need to force push:

```bash
# WARNING: Only use force push if you're sure no one else is working on this branch
git push --force-with-lease origin branch-name
```

For shared repositories, it's always safer to use `git revert` instead.