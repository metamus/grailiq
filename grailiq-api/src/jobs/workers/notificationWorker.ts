import { Worker, Job } from 'bullmq';
import { redis } from '../../config/redis.js';
import { logger } from '../../lib/logger.js';
import { env } from '../../config/env.js';
import {
  getUserPushTokens,
  sendExpoPushBatch,
  type PushMessage,
} from '../../services/expoPush.js';
import { db } from '../../config/database.js';
import { users } from '../../db/schema.js';
import { eq } from 'drizzle-orm';
import { resolvePrefs, shouldSend } from '../../lib/notificationPrefs.js';

/** Minimal HTML escape to keep user-supplied names from breaking templates. */
function escape(s: string): string {
  return s.replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[c]!));
}

if (!redis) {
  logger.info('Redis not available — notification worker disabled');
}

const connection = redis ? { host: redis.options.host, port: redis.options.port } : undefined;

interface RestockNotificationPayload {
  type: 'restock';
  userId: string;
  userEmail: string;
  displayName: string | null;
  alertId: string;
  productId: string;
  productName: string;
  productType: string;
  retailer: string;
  price?: number;
  url?: string;
}

interface PriceTargetNotificationPayload {
  type: 'price_target';
  userId: string;
  userEmail: string;
  displayName: string | null;
  watchlistId: string;
  productId: string;
  productName: string;
  productType: string;
  retailer: 'watchlist';
  targetPrice: number;
  currentPrice: number;
}

type NotificationPayload = RestockNotificationPayload | PriceTargetNotificationPayload;

const retailerLabels: Record<string, string> = {
  pokemon_center: 'Pokemon Center',
  amazon: 'Amazon',
  target: 'Target',
  walmart: 'Walmart',
  best_buy: 'Best Buy',
};

/**
 * Send an email notification via Resend.
 * Falls back to logging if no API key is configured.
 */
async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const apiKey = env.RESEND_API_KEY;

  if (!apiKey) {
    logger.info({ to, subject }, 'Email notification (Resend not configured — logged only)');
    return true;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'GrailIQ Alerts <alerts@grailiq.com>',
        to,
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      logger.error({ to, subject, status: response.status, body: text }, 'Resend email failed');
      return false;
    }

    logger.info({ to, subject }, 'Email sent via Resend');
    return true;
  } catch (err) {
    logger.error({ to, subject, error: err }, 'Email send error');
    return false;
  }
}

/** Build a restock notification email */
function buildRestockEmail(payload: RestockNotificationPayload): { subject: string; html: string } {
  const name = payload.displayName || 'Collector';
  const retailer = retailerLabels[payload.retailer] || payload.retailer;
  const priceStr = payload.price ? `$${payload.price.toFixed(2)}` : 'Check retailer';

  const subject = `🔔 ${payload.productName} is back in stock at ${retailer}!`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #7F77DD; font-size: 28px; margin: 0;">GrailIQ</h1>
        <p style="color: #9CA3AF; font-size: 13px; margin-top: 4px;">Price Intelligence for Pokemon TCG</p>
      </div>

      <div style="background: linear-gradient(135deg, #F59E0B15, #D9770615); border: 1px solid #F59E0B30; border-radius: 12px; padding: 24px; margin-bottom: 20px;">
        <p style="color: #92400E; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 8px 0;">
          🔔 Restock Alert
        </p>
        <h2 style="color: #1F2937; font-size: 20px; margin: 0 0 12px 0;">${payload.productName}</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="color: #6B7280; font-size: 13px; padding: 4px 0;">Retailer</td>
            <td style="color: #1F2937; font-size: 13px; font-weight: 600; text-align: right;">${retailer}</td>
          </tr>
          <tr>
            <td style="color: #6B7280; font-size: 13px; padding: 4px 0;">Price</td>
            <td style="color: #059669; font-size: 13px; font-weight: 600; text-align: right;">${priceStr}</td>
          </tr>
        </table>
      </div>

      ${payload.url ? `
      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${payload.url}" style="display: inline-block; background: #7F77DD; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
          View on ${retailer} →
        </a>
      </div>
      ` : ''}

      <p style="color: #6B7280; font-size: 13px; line-height: 1.6;">
        Hey ${name}, the product you're watching is available again. Popular items sell out fast, so don't wait too long!
      </p>

      <hr style="border: none; border-top: 1px solid #F3F4F6; margin: 24px 0;" />

      <p style="color: #9CA3AF; font-size: 11px; text-align: center;">
        You're receiving this because you set a restock alert on GrailIQ.
        <br />Manage your alerts at <a href="https://grailiq.com/alerts" style="color: #7F77DD;">grailiq.com/alerts</a>
      </p>
    </div>
  `;

  return { subject, html };
}

/**
 * Send a restock push notification to every enabled device the user has
 * registered. Returns the Expo batch summary (ok / failed / disabled counts).
 */
async function sendRestockPush(
  payload: RestockNotificationPayload,
): Promise<{ ok: number; failed: number; disabled: number }> {
  const tokens = await getUserPushTokens(payload.userId);
  if (tokens.length === 0) {
    return { ok: 0, failed: 0, disabled: 0 };
  }

  const retailer = retailerLabels[payload.retailer] || payload.retailer;
  const priceStr = payload.price ? `$${payload.price.toFixed(2)}` : 'Available';

  const title = `🔔 Back in stock at ${retailer}`;
  const body = `${payload.productName} — ${priceStr}. Tap to buy before it's gone.`;

  const messages: PushMessage[] = tokens.map((to) => ({
    to,
    title,
    body,
    sound: 'default',
    channelId: 'restock-alerts',
    data: {
      type: 'restock',
      productId: payload.productId,
      alertId: payload.alertId,
      retailer: payload.retailer,
      retailerUrl: payload.url,
      productName: payload.productName,
      // Note: imageUrl should be added by the API before sending.
      // The Notification Service Extension will download it from this URL.
    },
  }));

  return sendExpoPushBatch(messages);
}

/** Process notification jobs */
export const notificationWorker = connection && redis
  ? new Worker(
      'notifications',
      async (job: Job<NotificationPayload>) => {
        const payload = job.data;
        logger.info({ jobId: job.id, type: payload.type, userId: payload.userId }, 'Processing notification');

        switch (payload.type) {
          case 'restock': {
            const { subject, html } = buildRestockEmail(payload);

            // Deduplicate: don't send the same alert twice within 1 hour
            const dedupeKey = `notif:sent:${payload.userId}:${payload.productId}:${payload.retailer}`;
            const alreadySent = await redis!.get(dedupeKey);

            if (alreadySent) {
              logger.info({ dedupeKey }, 'Notification already sent recently — skipping');
              return { sent: false, reason: 'deduplicated' };
            }

            // Resolve per-user notification prefs (email/push opt-outs, quiet hours)
            const [userRow] = await db
              .select({ notificationPrefs: users.notificationPrefs })
              .from(users)
              .where(eq(users.id, payload.userId))
              .limit(1);
            const prefs = resolvePrefs(userRow?.notificationPrefs);
            const wantEmail = shouldSend(prefs, 'restock', 'email');
            const wantPush = shouldSend(prefs, 'restock', 'push');

            if (!wantEmail && !wantPush) {
              logger.info(
                { userId: payload.userId },
                'Notification suppressed by user prefs',
              );
              return { sent: false, reason: 'user_prefs' };
            }

            // Fan out over email + push in parallel — we want both channels
            // to fire independently, not short-circuit if one fails.
            const [emailSent, pushResult] = await Promise.all([
              wantEmail
                ? sendEmail(payload.userEmail, subject, html)
                : Promise.resolve(false),
              wantPush ? sendRestockPush(payload) : Promise.resolve({ ok: 0, failed: 0, disabled: 0 }),
            ]);

            if (emailSent || pushResult.ok > 0) {
              // Mark as sent for 1 hour (any channel delivery counts)
              await redis!.set(dedupeKey, '1', 'EX', 3600);
            }

            return {
              sent: emailSent || pushResult.ok > 0,
              type: 'restock',
              retailer: payload.retailer,
              email: emailSent,
              push: pushResult,
            };
          }

          case 'price_target': {
            const name = payload.displayName || 'Collector';
            const subject = `🎯 ${payload.productName} hit your target`;
            const html = `<!doctype html><html><body style="margin:0;padding:0;background:#0B0B18;color:#F9FAFB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
              <div style="max-width:560px;margin:0 auto;padding:28px 24px;">
                <div style="text-align:center;margin-bottom:20px;">
                  <h1 style="margin:0;color:#7F77DD;font-size:26px;">GrailIQ</h1>
                </div>
                <div style="padding:20px;background:linear-gradient(135deg,rgba(34,197,94,0.12),rgba(34,197,94,0.02));border:1px solid rgba(34,197,94,0.3);border-radius:14px;">
                  <p style="margin:0;font-size:11px;color:#22C55E;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;">🎯 Target Hit</p>
                  <p style="margin:6px 0 2px;font-size:18px;color:#F9FAFB;font-weight:700;">${escape(payload.productName)}</p>
                  <p style="margin:0;font-size:14px;color:#9CA3AF;">
                    Was targeting <strong style="color:#F9FAFB;">$${payload.targetPrice.toFixed(2)}</strong> — now at
                    <strong style="color:#22C55E;">$${payload.currentPrice.toFixed(2)}</strong>
                  </p>
                </div>
                <p style="margin:18px 0 0;font-size:14px;color:#D1D5DB;line-height:1.55;">Hey ${escape(name)}, the watchlist item you set a target on just hit. This is a one-time notification per drop — if the price bounces back and dips again, we'll ping you again.</p>
                <p style="margin:22px 0 0;text-align:center;">
                  <a href="https://grailiq.com/app/products/${payload.productId}" style="display:inline-block;background:#7F77DD;color:#fff;padding:10px 22px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;">Open on GrailIQ →</a>
                </p>
              </div></body></html>`;

            const [userRow] = await db
              .select({ notificationPrefs: users.notificationPrefs })
              .from(users)
              .where(eq(users.id, payload.userId))
              .limit(1);
            const prefs = resolvePrefs(userRow?.notificationPrefs);
            const wantEmail = shouldSend(prefs, 'priceTarget', 'email');
            const wantPush = shouldSend(prefs, 'priceTarget', 'push');
            if (!wantEmail && !wantPush) {
              return { sent: false, reason: 'user_prefs' };
            }

            const [emailSent, pushResult] = await Promise.all([
              wantEmail
                ? sendEmail(payload.userEmail, subject, html)
                : Promise.resolve(false),
              wantPush
                ? (async () => {
                    const tokens = await getUserPushTokens(payload.userId);
                    if (tokens.length === 0) return { ok: 0, failed: 0, disabled: 0 };
                    const title = `🎯 Target hit on GrailIQ`;
                    const body = `${payload.productName} dropped to $${payload.currentPrice.toFixed(2)}.`;
                    const messages: PushMessage[] = tokens.map((to) => ({
                      to,
                      title,
                      body,
                      sound: 'default',
                      channelId: 'restock-alerts',
                      data: {
                        type: 'price_target',
                        productId: payload.productId,
                        watchlistId: payload.watchlistId,
                        target: payload.targetPrice,
                        price: payload.currentPrice,
                      },
                    }));
                    return sendExpoPushBatch(messages);
                  })()
                : Promise.resolve({ ok: 0, failed: 0, disabled: 0 }),
            ]);
            return { sent: emailSent || pushResult.ok > 0, type: 'price_target', email: emailSent, push: pushResult };
          }

          default:
            logger.warn({ type: (payload as any).type }, 'Unknown notification type');
            return { sent: false, reason: 'unknown_type' };
        }
      },
      { connection, concurrency: 3 },
    )
  : null;

if (notificationWorker) {
  notificationWorker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, error: err.message }, 'Notification worker job failed');
  });
}
