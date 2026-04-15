-- Clean up products table: remove thesis column (was erroneously added, belongs in daily_grails)
-- This is a data cleanup migration to align production DB with schema
ALTER TABLE products DROP COLUMN IF EXISTS thesis CASCADE;
DROP INDEX IF EXISTS idx_products_thesis_null;