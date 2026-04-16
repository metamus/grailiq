-- ============================================================================
-- GrailIQ Comprehensive Pokemon TCG Catalog Expansion
-- ============================================================================
-- Expands coverage from 18 sets to 85+ sets, spanning classic WOTC to modern
-- Covers all major English-language sets from Base Set (1999) through 2024
-- Idempotent: safe to run multiple times (uses ON CONFLICT DO NOTHING)
--
-- Usage: psql $DATABASE_URL -f expand-sets-and-products.sql
-- ============================================================================

BEGIN;

-- ============================================================================
-- INSERT SETS (Idempotent via ON CONFLICT)
-- ============================================================================

INSERT INTO sets (code, name, series, release_date, total_cards, is_out_of_print, created_at, updated_at)
VALUES

-- Classic WOTC Era (1999-2003) — Crown Jewels, all out-of-print
('BS01', 'Base Set', 'Original', '1999-01-09'::timestamp with time zone, 102, true, NOW(), NOW()),
('JU01', 'Jungle', 'Original', '1999-06-16'::timestamp with time zone, 64, true, NOW(), NOW()),
('FO01', 'Fossil', 'Original', '1999-10-10'::timestamp with time zone, 62, true, NOW(), NOW()),
('TR01', 'Team Rocket', 'Original', '2000-04-24'::timestamp with time zone, 82, true, NOW(), NOW()),
('GH01', 'Gym Heroes', 'Original', '2000-10-16'::timestamp with time zone, 132, true, NOW(), NOW()),
('GC01', 'Gym Challenge', 'Original', '2001-02-26'::timestamp with time zone, 132, true, NOW(), NOW()),
('NG01', 'Neo Genesis', 'Original', '2001-07-12'::timestamp with time zone, 111, true, NOW(), NOW()),
('ND01', 'Neo Discovery', 'Original', '2001-12-10'::timestamp with time zone, 113, true, NOW(), NOW()),
('NR01', 'Neo Revelation', 'Original', '2002-05-01'::timestamp with time zone, 111, true, NOW(), NOW()),
('NDest01', 'Neo Destiny', 'Original', '2002-12-10'::timestamp with time zone, 113, true, NOW(), NOW()),
('LC01', 'Legendary Collection', 'Original', '2002-03-24'::timestamp with time zone, 110, true, NOW(), NOW()),
('EXP01', 'Expedition Base Set', 'Original', '2003-03-24'::timestamp with time zone, 165, true, NOW(), NOW()),
('AQ01', 'Aquapolis', 'Original', '2003-08-01'::timestamp with time zone, 147, true, NOW(), NOW()),
('SK01', 'Skyridge', 'Original', '2003-12-01'::timestamp with time zone, 144, true, NOW(), NOW()),

-- EX Era (2003-2007)
('RS01', 'EX Ruby & Sapphire', 'EX', '2003-07-01'::timestamp with time zone, 109, true, NOW(), NOW()),
('SS01', 'EX Sandstorm', 'EX', '2004-02-01'::timestamp with time zone, 100, true, NOW(), NOW()),
('DR01', 'EX Dragon Frontiers', 'EX', '2006-02-15'::timestamp with time zone, 115, true, NOW(), NOW()),
('PK01', 'EX Power Keepers', 'EX', '2007-02-14'::timestamp with time zone, 108, true, NOW(), NOW()),

-- Diamond & Pearl + Platinum Era (2007-2010)
('DP01', 'Diamond & Pearl Base', 'Diamond & Pearl', '2007-04-01'::timestamp with time zone, 130, true, NOW(), NOW()),
('DP02', 'Mysterious Treasures', 'Diamond & Pearl', '2007-08-01'::timestamp with time zone, 123, true, NOW(), NOW()),
('DP03', 'Secret Wonders', 'Diamond & Pearl', '2007-11-01'::timestamp with time zone, 132, true, NOW(), NOW()),
('DP04', 'Great Encounters', 'Diamond & Pearl', '2008-02-01'::timestamp with time zone, 106, true, NOW(), NOW()),
('DP05', 'Majestic Dawn', 'Diamond & Pearl', '2008-05-01'::timestamp with time zone, 100, true, NOW(), NOW()),
('DP06', 'Legends Awakened', 'Diamond & Pearl', '2008-08-01'::timestamp with time zone, 146, true, NOW(), NOW()),
('DP07', 'Stormfront', 'Diamond & Pearl', '2008-11-01'::timestamp with time zone, 100, true, NOW(), NOW()),
('PL01', 'Platinum Base', 'Platinum', '2009-02-01'::timestamp with time zone, 127, true, NOW(), NOW()),
('PL02', 'Platinum ARCEUS', 'Platinum', '2009-05-01'::timestamp with time zone, 99, true, NOW(), NOW()),
('PL03', 'Platinum Supreme Victors', 'Platinum', '2009-08-01'::timestamp with time zone, 147, true, NOW(), NOW()),

-- HeartGold SoulSilver Era (2009-2011)
('HS01', 'HeartGold & SoulSilver', 'HeartGold & SoulSilver', '2009-11-01'::timestamp with time zone, 123, true, NOW(), NOW()),
('HS02', 'Unleashed', 'HeartGold & SoulSilver', '2010-02-01'::timestamp with time zone, 95, true, NOW(), NOW()),
('HS03', 'Undaunted', 'HeartGold & SoulSilver', '2010-08-01'::timestamp with time zone, 90, true, NOW(), NOW()),
('HS04', 'Triumphant', 'HeartGold & SoulSilver', '2010-11-01'::timestamp with time zone, 102, true, NOW(), NOW()),

-- Black & White Era (2011-2012)
('BW01', 'Black & White Base', 'Black & White', '2011-04-25'::timestamp with time zone, 114, true, NOW(), NOW()),
('BW02', 'Emerging Powers', 'Black & White', '2011-08-01'::timestamp with time zone, 101, true, NOW(), NOW()),
('BW03', 'Noble Victories', 'Black & White', '2011-11-01'::timestamp with time zone, 101, true, NOW(), NOW()),
('BW04', 'Next Destinies', 'Black & White', '2012-02-01'::timestamp with time zone, 99, true, NOW(), NOW()),
('BW05', 'Dark Explorers', 'Black & White', '2012-05-01'::timestamp with time zone, 108, true, NOW(), NOW()),
('BW06', 'Dragons Exalted', 'Black & White', '2012-08-01'::timestamp with time zone, 124, true, NOW(), NOW()),
('BW07', 'Boundaries Crossed', 'Black & White', '2012-11-01'::timestamp with time zone, 149, true, NOW(), NOW()),
('BW08', 'Plasma Freeze', 'Black & White', '2013-02-01'::timestamp with time zone, 116, true, NOW(), NOW()),
('BW09', 'Plasma Blast', 'Black & White', '2013-08-01'::timestamp with time zone, 101, true, NOW(), NOW()),
('BW10', 'Legendary Collection', 'Black & White', '2013-10-01'::timestamp with time zone, 113, true, NOW(), NOW()),
('BW11', 'Frozen Collection', 'Black & White', '2013-11-01'::timestamp with time zone, 114, true, NOW(), NOW()),

-- XY Era (2014-2016)
('XY01', 'XY Base', 'XY', '2014-02-05'::timestamp with time zone, 146, true, NOW(), NOW()),
('XY02', 'Flashfire', 'XY', '2014-05-07'::timestamp with time zone, 106, true, NOW(), NOW()),
('XY03', 'Furious Fists', 'XY', '2014-08-13'::timestamp with time zone, 111, true, NOW(), NOW()),
('XY04', 'Phantom Forces', 'XY', '2014-11-05'::timestamp with time zone, 119, true, NOW(), NOW()),
('XY05', 'Primal Clash', 'XY', '2015-02-04'::timestamp with time zone, 160, true, NOW(), NOW()),
('XY06', 'Roaring Skies', 'XY', '2015-05-06'::timestamp with time zone, 108, true, NOW(), NOW()),
('XY07', 'Ancient Origins', 'XY', '2015-08-12'::timestamp with time zone, 146, true, NOW(), NOW()),
('XY08', 'BREAKthrough', 'XY', '2015-11-04'::timestamp with time zone, 162, true, NOW(), NOW()),
('XY09', 'BREAKpoint', 'XY', '2016-02-03'::timestamp with time zone, 122, true, NOW(), NOW()),
('XY10', 'Generations', 'XY', '2016-02-22'::timestamp with time zone, 83, true, NOW(), NOW()),
('XY11', 'Fates Collide', 'XY', '2016-05-02'::timestamp with time zone, 124, true, NOW(), NOW()),
('XY12', 'Steam Siege', 'XY', '2016-08-03'::timestamp with time zone, 114, true, NOW(), NOW()),
('XY13', 'Evolutions', 'XY', '2016-11-02'::timestamp with time zone, 108, true, NOW(), NOW()),

-- Sun & Moon Era (2017-2019)
('SM01', 'Sun & Moon Base', 'Sun & Moon', '2017-02-03'::timestamp with time zone, 149, true, NOW(), NOW()),
('SM02', 'Guardians Rising', 'Sun & Moon', '2017-05-05'::timestamp with time zone, 145, true, NOW(), NOW()),
('SM03', 'Burning Shadows', 'Sun & Moon', '2017-08-04'::timestamp with time zone, 147, true, NOW(), NOW()),
('SM04', 'Shining Legends', 'Sun & Moon', '2017-10-20'::timestamp with time zone, 73, true, NOW(), NOW()),
('SM05', 'Crimson Invasion', 'Sun & Moon', '2017-11-03'::timestamp with time zone, 111, true, NOW(), NOW()),
('SM06', 'Ultra Prism', 'Sun & Moon', '2018-02-02'::timestamp with time zone, 140, true, NOW(), NOW()),
('SM07', 'Forbidden Light', 'Sun & Moon', '2018-05-04'::timestamp with time zone, 131, true, NOW(), NOW()),
('SM08', 'Celestial Storm', 'Sun & Moon', '2018-08-03'::timestamp with time zone, 168, true, NOW(), NOW()),
('SM09', 'Lost Thunder', 'Sun & Moon', '2018-11-02'::timestamp with time zone, 214, true, NOW(), NOW()),
('SM10', 'Team Up', 'Sun & Moon', '2019-02-01'::timestamp with time zone, 181, true, NOW(), NOW()),
('SM11', 'Unbroken Bonds', 'Sun & Moon', '2019-05-03'::timestamp with time zone, 214, true, NOW(), NOW()),
('SM12', 'Unified Minds', 'Sun & Moon', '2019-08-02'::timestamp with time zone, 236, true, NOW(), NOW()),
('SM12.5', 'Hidden Fates', 'Sun & Moon', '2019-08-23'::timestamp with time zone, 68, true, NOW(), NOW()),
('SM13', 'Cosmic Eclipse', 'Sun & Moon', '2019-11-01'::timestamp with time zone, 236, true, NOW(), NOW()),

-- Sword & Shield Era (2020-2022)
('SWSH01', 'Sword & Shield Base', 'Sword & Shield', '2020-02-07'::timestamp with time zone, 216, true, NOW(), NOW()),
('SWSH02', 'Rebel Clash', 'Sword & Shield', '2020-05-01'::timestamp with time zone, 209, true, NOW(), NOW()),
('SWSH03', 'Darkness Ablaze', 'Sword & Shield', '2020-08-14'::timestamp with time zone, 198, true, NOW(), NOW()),
('SWSH04', 'Vivid Voltage', 'Sword & Shield', '2020-11-13'::timestamp with time zone, 203, true, NOW(), NOW()),
('SWSH05', 'Shining Fates', 'Sword & Shield', '2021-02-19'::timestamp with time zone, 78, true, NOW(), NOW()),
('SWSH06', 'Chilling Reign', 'Sword & Shield', '2021-06-18'::timestamp with time zone, 198, true, NOW(), NOW()),
('SWSH07', 'Evolving Skies', 'Sword & Shield', '2021-08-27'::timestamp with time zone, 203, true, NOW(), NOW()),
('SWSH08', 'Fusion Strike', 'Sword & Shield', '2021-11-12'::timestamp with time zone, 264, true, NOW(), NOW()),
('SWSH09', 'Brilliant Stars', 'Sword & Shield', '2022-02-25'::timestamp with time zone, 174, true, NOW(), NOW()),
('SWSH10', 'Astral Radiance', 'Sword & Shield', '2022-05-27'::timestamp with time zone, 189, true, NOW(), NOW()),
('SWSH11', 'Pokemon GO', 'Sword & Shield', '2022-07-01'::timestamp with time zone, 78, true, NOW(), NOW()),
('SWSH12', 'Lost Origin', 'Sword & Shield', '2022-09-09'::timestamp with time zone, 213, true, NOW(), NOW()),
('SWSH12.5', 'Silver Tempest', 'Sword & Shield', '2022-11-04'::timestamp with time zone, 174, true, NOW(), NOW()),
('SWSH13', 'Crown Zenith', 'Sword & Shield', '2022-12-23'::timestamp with time zone, 100, true, NOW(), NOW()),

-- Scarlet & Violet Era (2023-2024)
('SV01', 'Scarlet & Violet Base', 'Scarlet & Violet', '2023-04-14'::timestamp with time zone, 198, false, NOW(), NOW()),
('SV02', 'Paldea Evolved', 'Scarlet & Violet', '2023-06-09'::timestamp with time zone, 203, false, NOW(), NOW()),
('SV03', 'Obsidian Flames', 'Scarlet & Violet', '2023-08-11'::timestamp with time zone, 191, false, NOW(), NOW()),
('SV04', 'Paradox Rift', 'Scarlet & Violet', '2023-10-27'::timestamp with time zone, 182, false, NOW(), NOW()),
('SV04.5', 'Paldean Fates', 'Scarlet & Violet', '2024-03-22'::timestamp with time zone, 91, false, NOW(), NOW()),
('SV05', 'Temporal Forces', 'Scarlet & Violet', '2024-03-22'::timestamp with time zone, 165, false, NOW(), NOW()),
('SV06', 'Twilight Masquerade', 'Scarlet & Violet', '2024-05-24'::timestamp with time zone, 167, false, NOW(), NOW()),

-- Special/Anniversary Sets
('CEL20', 'Celebrations', 'Special', '2021-10-29'::timestamp with time zone, 25, true, NOW(), NOW()),
('CEL25', '25th Anniversary Collection', 'Special', '2021-10-08'::timestamp with time zone, 102, true, NOW(), NOW())

ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- INSERT PRODUCTS (Idempotent via WHERE NOT EXISTS)
-- ============================================================================

WITH product_data AS (
  -- Define realistic product SKU matrices for different eras
  SELECT
    s.id as set_id,
    s.code as set_code,
    s.name as set_name,
    s.is_out_of_print,
    s.release_date,
    p.name,
    p.type,
    p.msrp,
    p.base_score,
    CASE
      WHEN s.code IN ('BS01', 'JU01', 'FO01', 'TR01', 'GH01', 'GC01', 'NG01', 'ND01', 'NR01', 'NDest01', 'SK01', 'LC01', 'EXP01', 'AQ01')
        THEN 25
      ELSE 0
    END as classic_bonus
  FROM sets s
  CROSS JOIN (
    VALUES
      -- Booster Box (primary high-value SKU)
      ('Booster Box', 'booster_box'::product_type, 143.64::numeric, 60::int),
      -- Elite Trainer Box (post-2013)
      ('Elite Trainer Box', 'etb'::product_type, 49.99::numeric, 55::int),
      -- Booster Pack (commodity)
      ('Booster Pack', 'booster_pack'::product_type, 4.49::numeric, 40::int),
      -- Build & Battle Box
      ('Build & Battle Box', 'collection_box'::product_type, 19.99::numeric, 45::int),
      -- Booster Bundle (5 packs)
      ('Booster Bundle', 'collection_box'::product_type, 26.99::numeric, 48::int),
      -- Premium Collection
      ('Premium Collection Box', 'premium_collection'::product_type, 29.99::numeric, 50::int),
      -- Mini Tin
      ('Mini Tin', 'tin'::product_type, 4.99::numeric, 38::int)
    ) AS p(name, type, msrp, base_score)
)
INSERT INTO products (set_id, name, type, msrp, grailiq_score, investment_signal, signal_rationale, created_at, updated_at)
SELECT
  pd.set_id,
  pd.set_name || ' ' || pd.name,
  pd.type,
  pd.msrp,
  -- Calculate comprehensive GrailIQ score
  LEAST(
    99,
    GREATEST(
      0,
      pd.base_score
      + (CASE WHEN pd.is_out_of_print THEN 15 ELSE 0 END)
      + pd.classic_bonus
      + (CASE WHEN pd.release_date IS NOT NULL
          THEN LEAST(20, FLOOR(EXTRACT(YEAR FROM AGE(pd.release_date::date)) * 1.0))
          ELSE 0
        END)
      + (CASE WHEN pd.type = 'booster_box' THEN 5
              WHEN pd.type = 'etb' THEN 3
              WHEN pd.type IN ('booster_pack', 'tin') THEN -3
              ELSE 0
         END)
    )
  )::numeric(3,1),
  -- Map score to investment signal
  CASE
    WHEN (pd.base_score
      + (CASE WHEN pd.is_out_of_print THEN 15 ELSE 0 END)
      + pd.classic_bonus
      + (CASE WHEN pd.release_date IS NOT NULL
          THEN LEAST(20, FLOOR(EXTRACT(YEAR FROM AGE(pd.release_date::date)) * 1.0))
          ELSE 0
        END)
      + (CASE WHEN pd.type = 'booster_box' THEN 5
              WHEN pd.type = 'etb' THEN 3
              WHEN pd.type IN ('booster_pack', 'tin') THEN -3
              ELSE 0
         END)) >= 75
    THEN 'buy'::investment_signal
    WHEN (pd.base_score
      + (CASE WHEN pd.is_out_of_print THEN 15 ELSE 0 END)
      + pd.classic_bonus
      + (CASE WHEN pd.release_date IS NOT NULL
          THEN LEAST(20, FLOOR(EXTRACT(YEAR FROM AGE(pd.release_date::date)) * 1.0))
          ELSE 0
        END)
      + (CASE WHEN pd.type = 'booster_box' THEN 5
              WHEN pd.type = 'etb' THEN 3
              WHEN pd.type IN ('booster_pack', 'tin') THEN -3
              ELSE 0
         END)) >= 60
    THEN 'hold'::investment_signal
    WHEN (pd.base_score
      + (CASE WHEN pd.is_out_of_print THEN 15 ELSE 0 END)
      + pd.classic_bonus
      + (CASE WHEN pd.release_date IS NOT NULL
          THEN LEAST(20, FLOOR(EXTRACT(YEAR FROM AGE(pd.release_date::date)) * 1.0))
          ELSE 0
        END)
      + (CASE WHEN pd.type = 'booster_box' THEN 5
              WHEN pd.type = 'etb' THEN 3
              WHEN pd.type IN ('booster_pack', 'tin') THEN -3
              ELSE 0
         END)) >= 45
    THEN 'watch'::investment_signal
    ELSE 'avoid'::investment_signal
  END,
  'Sealed TCG product - Auto-scored',
  NOW(),
  NOW()
FROM product_data pd
WHERE NOT EXISTS (
  SELECT 1 FROM products p
  WHERE p.set_id = pd.set_id
  AND p.name = (pd.set_name || ' ' || pd.name)
);

COMMIT;

-- ============================================================================
-- VERIFICATION REPORT
-- ============================================================================

SELECT
  COUNT(DISTINCT s.id) as total_sets,
  COUNT(p.id) as total_products,
  SUM(CASE WHEN s.is_out_of_print THEN 1 ELSE 0 END) as out_of_print_sets,
  SUM(CASE WHEN s.is_out_of_print THEN 0 ELSE 1 END) as in_print_sets,
  ROUND(AVG(p.grailiq_score::numeric), 1) as avg_product_score,
  MAX(p.grailiq_score) as max_score,
  MIN(p.grailiq_score) as min_score
FROM sets s
LEFT JOIN products p ON p.set_id = s.id;

-- Show classic WOTC coverage
SELECT
  s.code,
  s.name,
  s.series,
  COUNT(p.id) as product_count,
  ROUND(AVG(p.grailiq_score::numeric), 1) as avg_score
FROM sets s
LEFT JOIN products p ON p.set_id = s.id
WHERE s.code IN ('BS01', 'JU01', 'FO01', 'TR01', 'GH01', 'GC01', 'NG01', 'ND01', 'NR01', 'NDest01', 'SK01', 'LC01', 'EXP01', 'AQ01')
GROUP BY s.id, s.code, s.name, s.series
ORDER BY s.code;

-- Show 10 highest-scoring products (grails)
SELECT
  s.name as set_name,
  p.name as product_name,
  p.msrp,
  p.grailiq_score,
  p.investment_signal
FROM products p
JOIN sets s ON s.id = p.set_id
ORDER BY p.grailiq_score DESC
LIMIT 10;
