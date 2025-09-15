#!/bin/bash

# Script to run the select layer migration
# This adds the select_layer field to the map_configs table

echo "🔄 Running select layer migration..."

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
    DB_URL="${VITE_SUPABASE_URL}/rest/v1/rpc/exec_sql"

    # Read the migration SQL
    MIGRATION_SQL=$(cat database/migrations/005_add_select_layer.sql)

    # Execute via Supabase (if they have a SQL execution endpoint)
    # Note: This might need to be done via Supabase dashboard or CLI
    echo "⚠️  Please run the following migration in Supabase SQL Editor:"
    echo "----------------------------------------"
    cat database/migrations/005_add_select_layer.sql
    echo "----------------------------------------"
    echo ""
    echo "Or use Supabase CLI:"
    echo "supabase db push --db-url \"$DATABASE_URL\""
else
    echo "🗄️  Using direct database connection..."
    psql "$DATABASE_URL" -f database/migrations/005_add_select_layer.sql

    if [ $? -eq 0 ]; then
        echo "✅ Migration completed successfully!"
    else
        echo "❌ Migration failed!"
        exit 1
    fi
fi

echo ""
echo "📝 Next steps:"
echo "1. Verify the migration in your database"
echo "2. Test the selectLayer field in the Edit Configuration UI"
echo "3. Update any existing overlay configurations with selectLayer values"