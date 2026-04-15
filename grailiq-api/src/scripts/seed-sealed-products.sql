-- Seed realistic sealed products for all sets
-- This script is idempotent (uses ON CONFLICT DO NOTHING on unique constraint)
-- To run manually: psql $DATABASE_URL -f seed-sealed-products.sql

-- First, remove the errant 'thesis' column from products if it still exists
ALTER TABLE products DROP COLUMN IF EXISTS thesis CASCADE;
DROP INDEX IF EXISTS idx_products_thesis_null;

-- Define reusable CTE with product templates
WITH product_templates AS (
  SELECT
    'Booster Box'::varchar(255) as name,
    'booster_box'::product_type as type,
    143.99::numeric(10,2) as msrp,
    65 as base_score
  UNION ALL SELECT 'Elite Trainer Box', 'etb', 49.99, 55
  UNION ALL SELECT 'Premium Collection Box', 'collection_box', 29.99, 50
  UNION ALL SELECT 'Build & Battle Box', 'booster_pack', 19.99, 45
  UNION ALL SELECT 'Booster Bundle (5 packs)', 'collection_box', 26.99, 48
  UNION ALL SELECT 'Mini Tin', 'tin', 4.99, 40
  UNION ALL SELECT 'Booster Pack', 'booster_pack', 4.49, 42
),
-- Generate products for each set x template combination
products_to_insert AS (
  SELECT
    gen_random_uuid() as id,
    s.id as set_id,
    pt.name,
    pt.type,
    pt.msrp,
    -- Calculate GrailIQ Score (0-100)
    LEAST(
      100,
      GREATEST(
        0,
        pt.base_score
        + (CASE WHEN s.is_out_of_print THEN 15 ELSE 0 END)  -- Out-of-print premium
        + (CASE WHEN s.release_date IS NOT NULL AND DATE_PART('year', AGE(s.release_date)) > 2 THEN LEAST(10, FLOOR(DATE_PART('year', AGE(s.release_date)))) ELSE 0 END)  -- Age bonus
        + (CASE WHEN pt.msrp > 100 THEN 5 WHEN pt.msrp < 20 THEN -3 ELSE 0 END)  -- Price tier
      )
    )::numeric(3,1) as grailiq_score,
    -- Map score to investment signal
    CASE
      WHEN (pt.base_score + (CASE WHEN s.is_out_of_print THEN 15 ELSE 0 END) + (CASE WHEN s.release_date IS NOT NULL AND DATE_PART('year', AGE(s.release_date)) > 2 THEN LEAST(10, FLOOR(DATE_PART('year', AGE(s.release_date)))) ELSE 0 END) + (CASE WHEN pt.msrp > 100 THEN 5 WHEN pt.msrp < 20 THEN -3 ELSE 0 END)) >= 75 THEN 'buy'::investment_signal
      WHEN (pt.base_score + (CASE WHEN s.is_out_of_print THEN 15 ELSE 0 END) + (CASE WHEN s.release_date IS NOT NULL AND DATE_PART('year', AGE(s.release_date)) > 2 THEN LEAST(10, FLOOR(DATE_PART('year', AGE(s.release_date)))) ELSE 0 END) + (CASE WHEN pt.msrp > 100 THEN 5 WHEN pt.msrp < 20 THEN -3 ELSE 0 END)) >= 60 THEN 'hold'::investment_signal
      WHEN (pt.base_score + (CASE WHEN s.is_out_of_print THEN 15 ELSE 0 END) + (CASE WHEN s.release_date IS NOT NULL AND DATE_PART('year', AGE(s.release_date)) > 2 THEN LEAST(10, FLOOR(DATE_PART('year', AGE(s.release_date)))) ELSE 0 END) + (CASE WHEN pt.msrp > 100 THEN 5 WHEN pt.msrp < 20 THEN -3 ELSE 0 END)) >= 45 THEN 'watch'::investment_signal
      ELSE 'avoid'::investment_signal
    END as investment_signal,
    'Auto-generated sealed product'::text as signal_rationale,
    now() as created_at,
    now() as updated_at
  FROM sets s, product_templates pt
)
INSERT INTO products (id, set_id, name, type, msrp, grailiq_score, investment_signal, signal_rationale, created_at, updated_at)
SELECT
  pti.id,
  pti.set_id,
  pti.name,
  pti.type,
  pti.msrp,
  pti.grailiq_score,
  pti.investment_signal,
  pti.signal_rationale,
  pti.created_at,
  pti.updated_at
FROM products_to_insert pti
WHERE NOT EXISTS (
  SELECT 1 FROM products p
  WHERE p.set_id = pti.set_id
  AND p.name = pti.name
);

-- Verify results
SELECT
  s.name,
  s.code,
  COUNT(p.id) as product_count,
  ROUND(AVG(p.grailiq_score::numeric), 1) as avg_score
FROM sets s
LEFT JOIN products p ON p.set_id = s.id
GROUP BY s.id, s.name, s.code
ORDER BY product_count DESC, s.name;
