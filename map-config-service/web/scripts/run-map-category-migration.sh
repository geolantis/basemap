#!/bin/bash

# Script to run the map_category and select_layer migration
# This adds proper columns and migrates data from metadata JSON

echo "🔄 Running map_category and select_layer migration..."

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Check if we have a database URL
if [ -z "$DATABASE_URL" ] && [ -z "$VITE_SUPABASE_URL" ]; then
    echo "❌ Error: No database connection found. Please set DATABASE_URL or VITE_SUPABASE_URL in .env"
    exit 1
fi

# Use Supabase if available, otherwise use DATABASE_URL
if [ -n "$VITE_SUPABASE_URL" ]; then
    echo "📦 Using Supabase database..."
    echo ""
    echo "⚠️  Please run the following migration in Supabase SQL Editor:"
    echo "========================================="
    cat database/migrations/006_add_map_category_and_select_layer.sql
    echo "========================================="
    echo ""
    echo "Or use Supabase CLI:"
    echo "supabase db push --db-url \"$DATABASE_URL\""
else
    echo "🗄️  Using direct database connection..."
    psql "$DATABASE_URL" -f database/migrations/006_add_map_category_and_select_layer.sql

    if [ $? -eq 0 ]; then
        echo "✅ Migration completed successfully!"
    else
        echo "❌ Migration failed!"
        exit 1
    fi
fi

echo ""
echo "📝 Migration Summary:"
echo "1. ✅ Added map_category column (background/overlay)"
echo "2. ✅ Added select_layer column for overlay maps"
echo "3. ✅ Migrated existing data from metadata JSON"
echo "4. ✅ Cleaned up metadata to remove migrated fields"
echo "5. ✅ Created indexes for performance"
echo ""
echo "🎯 Next steps:"
echo "1. Verify the migration in your database"
echo "2. Check that overlays have correct map_category='overlay'"
echo "3. Test the selectLayer field in the Edit Configuration UI"
echo "4. Update any existing overlay configurations with selectLayer values"