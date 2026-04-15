-- Remove thesis column from products table (was mistakenly added in 0009)
-- thesis belongs in daily_grails table only
ALTER TABLE products DROP COLUMN IF EXISTS thesis;

-- Also remove the index that was created for it
DROP INDEX IF EXISTS idx_products_thesis_null;
