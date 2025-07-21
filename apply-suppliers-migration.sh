#!/bin/bash

# Script to apply the suppliers soft delete migration
# Run this script to add the deleted_at column to the suppliers table

echo "Applying suppliers soft delete migration..."

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo "Error: Please run this script from the root of your project directory"
    exit 1
fi

# Apply the migration
npx supabase db push

echo "Migration applied successfully!"
echo ""
echo "The suppliers table now supports soft deletes with the deleted_at column."
echo "Suppliers will now be soft-deleted instead of hard-deleted, which means:"
echo "- Deleted suppliers won't appear in the manage suppliers list"
echo "- You can delete suppliers even if they have soft-deleted seeds"
echo "- The referential integrity is maintained"
