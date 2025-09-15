# Fix for Map Name Edit Issue

## Problem
When editing a map configuration, the name field was not updating. This was caused by a `UNIQUE` constraint on the `name` column in the database, which prevented renaming if there was any conflict or database issue.

## Root Cause
The database schema had:
```sql
name VARCHAR(255) UNIQUE NOT NULL
```

This unique constraint is unnecessary because:
1. The table already has a UUID primary key (`id`) that serves as the unique identifier
2. It prevents users from freely renaming their configurations
3. It causes poor user experience when trying to update map names

## Solution

### Database Migration
Remove the unique constraint from the `name` field while keeping the UUID as the sole unique identifier.

### How to Apply the Fix

1. **Go to your Supabase Dashboard**
   - Navigate to: https://app.supabase.com/project/wphrytrrikfkwehwahqc

2. **Open the SQL Editor**
   - Click on "SQL Editor" in the left sidebar

3. **Run the Migration**
   - Create a new query
   - Copy and paste the contents of `REMOVE_NAME_CONSTRAINT.sql`
   - Click "Run" to execute

4. **Verify the Fix**
   - The query will show no UNIQUE constraints on the name column after migration
   - Test editing a map configuration and changing its name
   - The name should now update successfully

## Benefits After Fix

1. ✅ **Users can freely rename configurations** without worrying about conflicts
2. ✅ **Multiple configs can have the same display name** if needed (though they have different IDs)
3. ✅ **Better user experience** with no mysterious failures when editing
4. ✅ **Cleaner data model** with UUID as the single source of truth for uniqueness

## Code Changes Made

1. **Added migration file**: `supabase/migrations/004_remove_name_unique_constraint.sql`
2. **Simplified validation**: Removed unnecessary name conflict checking in `ConfigEditor.vue`
3. **Added error logging**: Better error messages in the service layer for debugging

## Testing After Migration

1. Edit an existing configuration and change its name
2. Create a new configuration with any name
3. Try creating two configurations with the same name (should work, they'll have different UUIDs)
4. Verify all configurations still load correctly in the dashboard

## Alternative Solutions Considered

- **Keep unique constraint but improve error handling**: This would still limit user flexibility
- **Use a composite unique constraint**: Overly complex for this use case
- **Generate unique slugs automatically**: Adds unnecessary complexity

The chosen solution (removing the constraint) is the simplest and provides the best user experience.