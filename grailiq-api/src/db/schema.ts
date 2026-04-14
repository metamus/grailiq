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
  jsonb,
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
  featureFlags: jsonb('feature_flags').notNull().default({}),
  notificationPrefs: jsonb('notification_prefs').notNull().default({}),
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

/**
 * Score history — rolling daily snapshot of each product's GrailIQ score
 * and investment signal. Written by the scoreWorker at the end of its
 * recalc run. Enables real "top movers this week" calculations instead of
 * a current-only view.
 *
 * Indexed on (product_id, recorded_at DESC) for fast "score N days ago"
 * lookups.
 */
export const scoreHistory = pgTable('score_history', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id),
  score: decimal('score', { precision: 3, scale: 1 }).notNull(),
  signal: investmentSignalEnum('signal'),
  recordedAt: timestamp('recorded_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const scoreHistoryRelations = relations(scoreHistory, ({ one }) => ({
  product: one(products, {
    fields: [scoreHistory.productId],
    references: [products.id],
  }),
}));

/**
 * Watchlist — products a user is tracking but doesn't own.
 *
 * Different from `portfolio_items`: no cost basis, no quantity. Just a
 * "save for later" + personal notes. Used by the mobile app's heart-icon
 * add and the web's "Watch" button on the product page.
 *
 * Unique per (user, product) so the UI can toggle in/out cleanly.
 */
export const watchlistItems = pgTable('watchlist_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id),
  note: text('note'),
  targetPrice: decimal('target_price', { precision: 10, scale: 2 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const watchlistItemsRelations = relations(watchlistItems, ({ one }) => ({
  user: one(users, { fields: [watchlistItems.userId], references: [users.id] }),
  product: one(products, { fields: [watchlistItems.productId], references: [products.id] }),
}));

/**
 * Lightweight first-party analytics. Writes are cheap (indexed only on
 * event_name + occurred_at and user_id + occurred_at). Read queries can
 * compute cohort retention, funnel conversion, etc. via plain SQL.
 *
 * Not a replacement for PostHog / Mixpanel long-term — but a zero-cost
 * first step.
 */
export const analyticsEvents = pgTable('analytics_events', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  sessionId: varchar('session_id', { length: 64 }),
  eventName: varchar('event_name', { length: 80 }).notNull(),
  properties: jsonb('properties').notNull().default({}),
  referrer: text('referrer'),
  path: text('path'),
  userAgent: text('user_agent'),
  ipHash: varchar('ip_hash', { length: 64 }),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Expo push notification device tokens.
 *
 * One row per physical device per user. `expoPushToken` is the ExponentPush
 * token string (starts with `ExponentPushToken[...]`). Deduped on
 * (user_id, expo_push_token) so we never double-send to the same device.
 *
 * `lastUsedAt` is bumped every time the mobile client re-registers (app
 * launch). A janitor job can prune rows that haven't checked in for 60 days.
 */
export const pushTokens = pgTable('push_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  expoPushToken: varchar('expo_push_token', { length: 255 }).notNull(),
  platform: varchar('platform', { length: 16 }).notNull(), // 'ios' | 'android' | 'web'
  deviceId: varchar('device_id', { length: 100 }),
  isEnabled: boolean('is_enabled').notNull().default(true),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const pushTokensRelations = relations(pushTokens, ({ one }) => ({
  user: one(users, { fields: [pushTokens.userId], references: [users.id] }),
}));
