import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  decimal,
  boolean,
  bigserial,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ──────────────────────────────────────────────
// Enums
// ──────────────────────────────────────────────

export const productTypeEnum = pgEnum('product_type', [
  'booster_box',
  'etb',
  'booster_pack',
  'collection_box',
  'blister_pack',
  'tin',
  'premium_collection',
  'other',
]);

export const priceSourceEnum = pgEnum('price_source', ['tcgplayer', 'ebay']);

export const subscriptionTierEnum = pgEnum('subscription_tier', ['free', 'collector', 'investor']);

export const portfolioSourceEnum = pgEnum('portfolio_source', [
  'pokemon_center',
  'amazon',
  'target',
  'walmart',
  'best_buy',
  'lgs',
  'ebay',
  'other',
]);

export const retailerEnum = pgEnum('retailer', [
  'pokemon_center',
  'amazon',
  'target',
  'walmart',
  'best_buy',
  'all',
]);

export const investmentSignalEnum = pgEnum('investment_signal', [
  'buy',
  'hold',
  'watch',
  'avoid',
]);

// ──────────────────────────────────────────────
// Tables
// ──────────────────────────────────────────────

/** Pokemon TCG expansion sets */
export const sets = pgTable('sets', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 20 }).notNull().unique(),
  series: varchar('series', { length: 100 }).notNull(),
  releaseDate: timestamp('release_date', { withTimezone: true }),
  totalCards: integer('total_cards'),
  isOutOfPrint: boolean('is_out_of_print').notNull().default(false),
  imageUrl: text('image_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/** Sealed products (booster boxes, ETBs, etc.) */
export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  setId: uuid('set_id')
    .notNull()
    .references(() => sets.id),
  name: varchar('name', { length: 255 }).notNull(),
  type: productTypeEnum('type').notNull(),
  msrp: decimal('msrp', { precision: 10, scale: 2 }),
  imageUrl: text('image_url'),
  tcgplayerId: varchar('tcgplayer_id', { length: 50 }),
  ebaySearchTerm: varchar('ebay_search_term', { length: 255 }),
  grailiqScore: decimal('grailiq_score', { precision: 3, scale: 1 }),
  investmentSignal: investmentSignalEnum('investment_signal'),
  signalRationale: text('signal_rationale'),
  scoreUpdatedAt: timestamp('score_updated_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Price history — designed as a TimescaleDB hypertable on recorded_at.
 * After table creation, run: SELECT create_hypertable('price_history', 'recorded_at');
 */
export const priceHistory = pgTable('price_history', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id),
  source: priceSourceEnum('source').notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  marketPrice: decimal('market_price', { precision: 10, scale: 2 }),
  lowPrice: decimal('low_price', { precision: 10, scale: 2 }),
  highPrice: decimal('high_price', { precision: 10, scale: 2 }),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull().defaultNow(),
});

/** Registered users (synced from Supabase Auth) */
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  supabaseId: varchar('supabase_id', { length: 100 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull(),
  displayName: varchar('display_name', { length: 255 }),
  preferredCurrency: varchar('preferred_currency', { length: 3 }).notNull().default('USD'),
  subscriptionTier: subscriptionTierEnum('subscription_tier').notNull().default('free'),
  trialEndsAt: timestamp('trial_ends_at', { withTimezone: true }),
  stripeCustomerId: varchar('stripe_customer_id', { length: 100 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/** User portfolio holdings */
export const portfolioItems = pgTable('portfolio_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id),
  quantity: integer('quantity').notNull().default(1),
  purchasePrice: decimal('purchase_price', { precision: 10, scale: 2 }).notNull(),
  purchaseDate: timestamp('purchase_date', { withTimezone: true }),
  source: portfolioSourceEnum('source'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/** User restock alert subscriptions */
export const alertSubscriptions = pgTable('alert_subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id),
  retailer: retailerEnum('retailer').notNull().default('all'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Retailer-specific product mappings.
 *
 * Each row maps one of our canonical `products` to a specific retailer's
 * product listing (URL + SKU/TCIN/ASIN). The restock worker uses these rows
 * to actually hit retailer endpoints and track stock transitions.
 *
 * `lastInStock` / `lastCheckedAt` are used for change detection — a
 * notification is only fired when a product transitions from
 * out-of-stock → in-stock, not on every successful check.
 */
export const retailerProducts = pgTable('retailer_products', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id),
  retailer: retailerEnum('retailer').notNull(),
  url: text('url').notNull(),
  sku: varchar('sku', { length: 100 }),
  lastInStock: boolean('last_in_stock').notNull().default(false),
  lastCheckedAt: timestamp('last_checked_at', { withTimezone: true }),
  lastPrice: decimal('last_price', { precision: 10, scale: 2 }),
  lastError: text('last_error'),
  isEnabled: boolean('is_enabled').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ──────────────────────────────────────────────
// Relations
// ──────────────────────────────────────────────

export const setsRelations = relations(sets, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  set: one(sets, { fields: [products.setId], references: [sets.id] }),
  priceHistory: many(priceHistory),
  portfolioItems: many(portfolioItems),
  alertSubscriptions: many(alertSubscriptions),
}));

export const priceHistoryRelations = relations(priceHistory, ({ one }) => ({
  product: one(products, { fields: [priceHistory.productId], references: [products.id] }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  portfolioItems: many(portfolioItems),
  alertSubscriptions: many(alertSubscriptions),
}));

export const portfolioItemsRelations = relations(portfolioItems, ({ one }) => ({
  user: one(users, { fields: [portfolioItems.userId], references: [users.id] }),
  product: one(products, { fields: [portfolioItems.productId], references: [products.id] }),
}));

export const alertSubscriptionsRelations = relations(alertSubscriptions, ({ one }) => ({
  user: one(users, { fields: [alertSubscriptions.userId], references: [users.id] }),
  product: one(products, { fields: [alertSubscriptions.productId], references: [products.id] }),
}));

export const retailerProductsRelations = relations(retailerProducts, ({ one }) => ({
  product: one(products, { fields: [retailerProducts.productId], references: [products.id] }),
}));
