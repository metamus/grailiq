-- Mark historical sets as Out Of Print.
-- Rule: anything released before Jan 2021 is out of print.
-- Active Scarlet & Violet and most late Sword & Shield stay in-print.

BEGIN;

UPDATE sets
SET is_out_of_print = true,
    updated_at = NOW()
WHERE release_date < '2021-01-01'
  AND is_out_of_print = false;

-- Recompute scores on all products to reflect the new OOP flag.
-- Same formula as the seed script (capped at 99 to fit numeric(3,1)).
UPDATE products p
SET
  grailiq_score = LEAST(99, GREATEST(0,
    55
    + (CASE WHEN s.is_out_of_print THEN 15 ELSE 0 END)
    -- classic WOTC bonus: pre-2003 sets
    + (CASE WHEN s.release_date < '2003-08-01' THEN 25 ELSE 0 END)
    -- age bonus, capped at 20
    + LEAST(20, FLOOR(EXTRACT(YEAR FROM AGE(s.release_date::date)) * 1.0))
    -- product type adjustment
    + (CASE WHEN p.type = 'booster_box' THEN 5
            WHEN p.type = 'etb' THEN 3
            WHEN p.type IN ('booster_pack', 'tin') THEN -3
            ELSE 0
       END)
  ))::numeric(3, 1),
  investment_signal = (CASE
    WHEN LEAST(99, GREATEST(0,
      55
      + (CASE WHEN s.is_out_of_print THEN 15 ELSE 0 END)
      + (CASE WHEN s.release_date < '2003-08-01' THEN 25 ELSE 0 END)
      + LEAST(20, FLOOR(EXTRACT(YEAR FROM AGE(s.release_date::date)) * 1.0))
      + (CASE WHEN p.type = 'booster_box' THEN 5
              WHEN p.type = 'etb' THEN 3
              WHEN p.type IN ('booster_pack', 'tin') THEN -3
              ELSE 0
         END)
    )) >= 75 THEN 'buy'
    WHEN LEAST(99, GREATEST(0,
      55
      + (CASE WHEN s.is_out_of_print THEN 15 ELSE 0 END)
      + (CASE WHEN s.release_date < '2003-08-01' THEN 25 ELSE 0 END)
      + LEAST(20, FLOOR(EXTRACT(YEAR FROM AGE(s.release_date::date)) * 1.0))
      + (CASE WHEN p.type = 'booster_box' THEN 5
              WHEN p.type = 'etb' THEN 3
              WHEN p.type IN ('booster_pack', 'tin') THEN -3
              ELSE 0
         END)
    )) >= 60 THEN 'hold'
    WHEN LEAST(99, GREATEST(0,
      55
      + (CASE WHEN s.is_out_of_print THEN 15 ELSE 0 END)
      + (CASE WHEN s.release_date < '2003-08-01' THEN 25 ELSE 0 END)
      + LEAST(20, FLOOR(EXTRACT(YEAR FROM AGE(s.release_date::date)) * 1.0))
      + (CASE WHEN p.type = 'booster_box' THEN 5
              WHEN p.type = 'etb' THEN 3
              WHEN p.type IN ('booster_pack', 'tin') THEN -3
              ELSE 0
         END)
    )) >= 45 THEN 'watch'
    ELSE 'avoid'
  END)::investment_signal,
  updated_at = NOW()
FROM sets s
WHERE p.set_id = s.id;

COMMIT;

-- Quick sanity check: how many sets are now OOP, how many products per signal band.
SELECT
  (SELECT COUNT(*)::int FROM sets WHERE is_out_of_print) AS "sets_out_of_print",
  (SELECT COUNT(*)::int FROM products WHERE investment_signal = 'buy') AS "buy_signals",
  (SELECT COUNT(*)::int FROM products WHERE investment_signal = 'hold') AS "hold_signals",
  (SELECT COUNT(*)::int FROM products WHERE investment_signal = 'watch') AS "watch_signals",
  (SELECT COUNT(*)::int FROM products WHERE investment_signal = 'avoid') AS "avoid_signals",
  (SELECT ROUND(AVG(grailiq_score)::numeric, 1) FROM products) AS "avg_score";
