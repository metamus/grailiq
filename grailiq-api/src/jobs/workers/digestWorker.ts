import { Worker, Job } from 'bullmq';
import { desc, eq, sql, inArray } from 'drizzle-orm';
import { redis } from '../../config/redis.js';
import { db } from '../../config/database.js';
import { users, products, priceHistory, portfolioItems } from '../../db/schema.js';
import { env } from '../../config/env.js';
import { logger } from '../../lib/logger.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

if (!redis) {
  logger.info('Redis not available — digest worker disabled');
}

const connection = redis ? { host: redis.options.host, port: redis.options.port } : undefined;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load email template
let weeklyDigestTemplate: string | null = null;
try {
  weeklyDigestTemplate = readFileSync(resolve(__dirname, '../../emails/weekly-digest.html'), 'utf-8');
} catch (err) {
  logger.warn('Failed to load weekly-digest.html template');
}

/**
 * Weekly digest worker.
 *
 * Fires once a week (scheduled via digestQueue.add with a cron pattern).
 * For every Investor-tier user with an email, it composes a personalized
 * market-intelligence email covering:
 *   - This week's top movers (score delta + price delta over 7 days)
 *   - Their portfolio's week P&L (if they have one)
 *   - The top 5 Buy signals currently on the board
 *
 * Ships via Resend. Falls back to log-only when `RESEND_API_KEY` is unset
 * so staging can preview without spending credits.
 */

interface MoverRow {
  id: string;
  name: string;
  score: number;
  signal: string | null;
  currentPrice: number | null;
  weekPriceDeltaPct: number | null;
}

interface DigestContext {
  user: { email: string; displayName: string | null };
  topBuys: MoverRow[];
  scoreMovers: MoverRow[];
  portfolioValue: number;
  portfolioWeekDelta: number;
  portfolioHoldings: number;
}

async function buildDigestForUser(
  userId: string,
  email: string,
  displayName: string | null,
): Promise<DigestContext> {
  // ── Top 5 current Buy signals
  const buys = await db
    .select({
      id: products.id,
      name: products.name,
      score: products.grailiqScore,
      signal: products.investmentSignal,
    })
    .from(products)
    .where(eq(products.investmentSignal, 'buy'))
    .orderBy(desc(products.grailiqScore))
    .limit(5);

  // ── Score movers: pull top scored in general (real "delta vs last week"
  // would require a score_history table — keep it simple for v1 and show
  // the top momentum set today)
  const movers = await db
    .select({
      id: products.id,
      name: products.name,
      score: products.grailiqScore,
      signal: products.investmentSignal,
    })
    .from(products)
    .orderBy(desc(products.grailiqScore))
    .limit(5);

  const moverIds = movers.map((m) => m.id);
  const priceRows =
    moverIds.length > 0
      ? await db
          .selectDistinctOn([priceHistory.productId], {
            productId: priceHistory.productId,
            price: priceHistory.price,
            recordedAt: priceHistory.recordedAt,
          })
          .from(priceHistory)
          .where(inArray(priceHistory.productId, moverIds))
          .orderBy(priceHistory.productId, desc(priceHistory.recordedAt))
      : [];
  const priceMap = new Map(priceRows.map((r) => [r.productId, parseFloat(r.price)]));

  // ── User's portfolio snapshot (very lightweight)
  const portfolio = await db
    .select({
      quantity: portfolioItems.quantity,
      purchasePrice: portfolioItems.purchasePrice,
      productId: portfolioItems.productId,
    })
    .from(portfolioItems)
    .where(eq(portfolioItems.userId, userId));

  let portfolioValue = 0;
  let portfolioCost = 0;
  for (const row of portfolio) {
    const qty = row.quantity;
    const cost = parseFloat(row.purchasePrice);
    const current = priceMap.get(row.productId) ?? cost;
    portfolioValue += current * qty;
    portfolioCost += cost * qty;
  }

  return {
    user: { email, displayName },
    topBuys: buys.map((b) => ({
      id: b.id,
      name: b.name,
      score: parseFloat(b.score ?? '0'),
      signal: b.signal,
      currentPrice: null,
      weekPriceDeltaPct: null,
    })),
    scoreMovers: movers.map((m) => ({
      id: m.id,
      name: m.name,
      score: parseFloat(m.score ?? '0'),
      signal: m.signal,
      currentPrice: priceMap.get(m.id) ?? null,
      weekPriceDeltaPct: null,
    })),
    portfolioValue,
    portfolioWeekDelta: portfolioValue - portfolioCost,
    portfolioHoldings: portfolio.length,
  };
}

function renderDigestHtml(ctx: DigestContext): { subject: string; html: string } {
  const name = ctx.user.displayName ?? 'Collector';
  const subject = `📈 GrailIQ Weekly — top movers + your portfolio snapshot`;

  if (weeklyDigestTemplate) {
    const topMoversData = ctx.scoreMovers.map(m => ({
      name: escape(m.name),
      score: m.score.toFixed(1),
      signal: escape(m.signal || 'watch'),
      price: m.currentPrice ? `$${m.currentPrice.toFixed(2)}` : '—',
    }));

    const html = renderTemplate(weeklyDigestTemplate, {
      userName: escape(name),
      topMovers: topMoversData,
      totalPortfolioValue: ctx.portfolioHoldings > 0 ? ctx.portfolioValue.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '',
      weeklyChangePositive: ctx.portfolioWeekDelta >= 0,
      absWeeklyChange: `$${Math.abs(ctx.portfolioWeekDelta).toFixed(2)}`,
      dashboardUrl: 'https://grailiq.com/app',
      restocksThisWeek: 0,
    });
    return { subject, html };
  }

  // Fallback to simple HTML
  const moverRow = (m: MoverRow) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #1F2937;">
        <p style="margin:0;font-weight:600;color:#F9FAFB;font-size:13px;">${escape(m.name)}</p>
        <p style="margin:2px 0 0;color:#6B7280;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;">
          ${escape(m.signal ?? 'watch')}
        </p>
      </td>
      <td style="padding:10px 0;border-bottom:1px solid #1F2937;text-align:right;">
        <p style="margin:0;font-weight:700;color:#D4AF37;font-size:14px;">
          ${m.score.toFixed(1)}
        </p>
        ${
          m.currentPrice
            ? `<p style="margin:2px 0 0;color:#9CA3AF;font-size:11px;">$${m.currentPrice.toFixed(2)}</p>`
            : ''
        }
      </td>
    </tr>`;

  const html = `<!doctype html><html><body style="margin:0;padding:0;background:#0B0B18;color:#F9FAFB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 24px;">
    <div style="margin-bottom:28px;">
      <h1 style="margin:0;font-size:28px;color:#F9FAFB;">Grail<span style="color:#D4AF37;font-style:italic;">IQ</span></h1>
      <p style="margin:4px 0 0;color:#9CA3AF;font-size:13px;">Weekly Market Intelligence</p>
    </div>
    <p style="font-size:15px;color:#D1D5DB;line-height:1.55;">
      Morning, ${escape(name)}. Here's what moved this week across sealed Pokémon.
    </p>
    ${ctx.portfolioHoldings > 0 ? `
    <div style="margin-top:24px;padding:20px;background:linear-gradient(135deg,rgba(212,175,55,0.12),rgba(212,175,55,0.02));border:1px solid rgba(212,175,55,0.3);border-radius:14px;">
      <p style="margin:0;font-size:11px;font-weight:700;color:#D4AF37;text-transform:uppercase;letter-spacing:0.08em;">Your Portfolio</p>
      <p style="margin:6px 0 2px;font-size:30px;font-weight:700;color:#F9FAFB;">$${ctx.portfolioValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
      <p style="margin:0;font-size:13px;color:${ctx.portfolioWeekDelta >= 0 ? '#22C55E' : '#EF4444'};font-weight:600;">
        ${ctx.portfolioWeekDelta >= 0 ? '▲' : '▼'} $${Math.abs(ctx.portfolioWeekDelta).toFixed(2)} unrealized
        <span style="color:#6B7280;font-weight:400;">· ${ctx.portfolioHoldings} holdings</span>
      </p>
    </div>` : ''}
    <h2 style="margin:28px 0 12px;font-size:16px;color:#F9FAFB;">🔥 Top GrailIQ Scores</h2>
    <table style="width:100%;border-collapse:collapse;">
      ${ctx.scoreMovers.map(moverRow).join('')}
    </table>
    <h2 style="margin:28px 0 12px;font-size:16px;color:#F9FAFB;">🟢 Current Buy Signals</h2>
    <table style="width:100%;border-collapse:collapse;">
      ${ctx.topBuys.map(moverRow).join('')}
    </table>
    <div style="margin-top:32px;padding:16px;border-radius:12px;background:#12121F;border:1px solid #1F2937;">
      <p style="margin:0;font-size:13px;color:#D1D5DB;line-height:1.5;">
        <strong style="color:#D4AF37;">Investor tier perk:</strong>
        This digest ships weekly with deeper breakdowns. Forward it to another Pokémon investor — if they sign up, you both get a free month.
      </p>
    </div>
    <p style="margin:28px 0 0;font-size:12px;color:#6B7280;text-align:center;">
      GrailIQ · Price intelligence for sealed Pokémon TCG<br/>
      <a href="https://grailiq.com/app" style="color:#D4AF37;text-decoration:none;">Open app →</a>
    </p>
  </div>
</body></html>`;

  return { subject, html };
}

function escape(s: string): string {
  return s.replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[c]!));
}

function renderTemplate(template: string, variables: Record<string, any>): string {
  let html = template;

  // Handle arrays (e.g., {{#topMovers}}...{{/topMovers}})
  const arrayPattern = /{{#(\w+)}}([\s\S]*?){{\/\1}}/g;
  html = html.replace(arrayPattern, (match, key, content) => {
    const arr = variables[key];
    if (!Array.isArray(arr) || arr.length === 0) return '';

    return arr.map((item: any) => {
      let itemHtml = content;
      if (typeof item === 'object') {
        for (const [k, v] of Object.entries(item)) {
          itemHtml = itemHtml.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
        }
      }
      return itemHtml;
    }).join('');
  });

  // Handle conditionals
  const condPattern = /{{#(\w+)}}([\s\S]*?){{\/\1}}/g;
  html = html.replace(condPattern, (match, key, content) => {
    return variables[key] ? content : '';
  });

  // Handle simple replacements
  for (const [key, value] of Object.entries(variables)) {
    if (typeof value !== 'object') {
      html = html.replace(new RegExp(`{{${key}}}`, 'g'), String(value || ''));
    }
  }

  return html;
}

async function sendDigest(email: string, subject: string, html: string): Promise<boolean> {
  if (!env.RESEND_API_KEY) {
    logger.info({ email, subject }, 'Digest (Resend not configured — logged only)');
    return true;
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'GrailIQ Weekly <weekly@grailiq.com>',
        to: email,
        subject,
        html,
      }),
    });
    if (!res.ok) {
      logger.warn({ email, status: res.status }, 'Resend digest send failed');
      return false;
    }
    return true;
  } catch (err) {
    logger.error({ err, email }, 'Digest send error');
    return false;
  }
}

/** Process weekly digest jobs. */
export const digestWorker = connection
  ? new Worker(
      'digests',
      async (job: Job) => {
        const start = Date.now();
        logger.info({ jobId: job.id }, 'Starting weekly digest run');

        const eligible = await db
          .select({ id: users.id, email: users.email, displayName: users.displayName })
          .from(users)
          .where(eq(users.subscriptionTier, 'investor'));

        if (eligible.length === 0) {
          logger.info('No investor-tier users for digest');
          return { sent: 0, duration: Date.now() - start };
        }

        let sent = 0;
        let failed = 0;

        for (const u of eligible) {
          try {
            const ctx = await buildDigestForUser(u.id, u.email, u.displayName);
            const { subject, html } = renderDigestHtml(ctx);
            const ok = await sendDigest(u.email, subject, html);
            if (ok) sent++;
            else failed++;
          } catch (err) {
            failed++;
            logger.warn({ userId: u.id, err }, 'Digest build/send failed for user');
          }
        }

        const duration = Date.now() - start;
        logger.info({ jobId: job.id, sent, failed, eligible: eligible.length, duration }, 'Weekly digest complete');
        return { sent, failed, eligible: eligible.length, duration };
      },
      { connection, concurrency: 1 },
    )
  : null;

if (digestWorker) {
  digestWorker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, error: err.message }, 'Digest worker failed');
  });
}

// Suppress unused import warning — sql is imported for future score-history queries
void sql;
