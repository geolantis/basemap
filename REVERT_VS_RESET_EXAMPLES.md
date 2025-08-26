# Git Revert vs Reset Examples

This file demonstrates the practical differences between git revert and git reset.

## Live Demonstration Results

We just performed a live demonstration of git revert:

### What we did:
1. Created a test file: `test-revert-example.txt`
2. Committed it: "Add test file for revert demonstration" (c48023c)
3. Reverted the commit using: `git revert HEAD --no-edit`

### Results:
```bash
# Before revert:
c48023c (HEAD) Add test file for revert demonstration
352f441 Demonstrate how to revert the latest commit and documentation
4d182db Initial plan

# After revert:
57803e5 (HEAD) Revert "Add test file for revert demonstration"  
c48023c Add test file for revert demonstration
352f441 Demonstrate how to revert the latest commit and documentation
4d182db Initial plan
```

**Key observations:**
- ✅ **Both commits remain in history** - the original and the revert
- ✅ **File was removed** - same end result as if we used git reset
- ✅ **History shows what happened** - we can see the mistake and correction
- ✅ **Safe for shared repositories** - no history rewriting

## Method Comparison

### Using git revert (What we just demonstrated)
```bash
# This creates a NEW commit that undoes the previous commit
git revert HEAD --no-edit

# Result: Two commits in history
# - Original commit: "Add test file for revert demonstration" (c48023c)
# - New commit: "Revert 'Add test file for revert demonstration'" (57803e5)
# - File: test-revert-example.txt is removed
# - History: Preserved, shows both commits
```

### Using git reset --hard (Alternative destructive method)
```bash
# This removes the commit from history entirely
git reset --hard HEAD~1

# Result: 
# - Original commit: GONE from history
# - File: test-revert-example.txt is removed
# - History: Rewritten, commit never existed
```

## When to Use Each Method

| Scenario | Method | Reason |
|----------|--------|---------|
| Shared repository/public branch | `git revert` | Preserves history, safe for collaboration |
| Local branch, personal work | `git reset` | Cleaner history, simpler |
| Want to preserve evidence of mistake | `git revert` | Shows what was tried and reverted |
| Want clean history | `git reset` | Removes the mistake entirely |
| Working with others | `git revert` | No force push needed |
| Solo development | Either | Personal preference |

## Key Differences Summary

**git revert:**
- ✅ Safe for shared repositories
- ✅ Preserves complete history
- ✅ No force push required
- ✅ **Demonstrated above** - clean, safe reversal
- ❌ Creates additional commits
- ❌ More complex history

**git reset:**
- ✅ Clean, simple history
- ✅ Completely removes unwanted commits
- ✅ **Used earlier** to remove "Initial plan" commit
- ❌ Requires force push for shared repos
- ❌ Can lose work if not careful
- ❌ Rewrites history (dangerous in shared repos)

## Summary of Our Demonstration

In this repository, we successfully demonstrated both methods:

1. **First:** Used `git reset --hard HEAD~1` to remove the empty "Initial plan" commit
2. **Then:** Used `git revert HEAD` to safely revert a commit with file changes

Both methods achieved the goal of "reverting the latest commit" but with different approaches and implications.