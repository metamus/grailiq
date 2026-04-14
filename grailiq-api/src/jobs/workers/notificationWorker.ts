import { Worker, Job } from 'bullmq';
import { redis } from '../../config/redis.js';
import { logger } from '../../lib/logger.js';
import { env } from '../../config/env.js';

const connection = { host: redis.options.host, port: redis.options.port };

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

type NotificationPayload = RestockNotificationPayload;

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

/** Process notification jobs */
export const notificationWorker = new Worker(
  'notifications',
  async (job: Job<NotificationPayload>) => {
    const payload = job.data;
    logger.info({ jobId: job.id, type: payload.type, userId: payload.userId }, 'Processing notification');

    switch (payload.type) {
      case 'restock': {
        const { subject, html } = buildRestockEmail(payload);

        // Deduplicate: don't send the same alert twice within 1 hour
        const dedupeKey = `notif:sent:${payload.userId}:${payload.productId}:${payload.retailer}`;
        const alreadySent = await redis.get(dedupeKey);

        if (alreadySent) {
          logger.info({ dedupeKey }, 'Notification already sent recently — skipping');
          return { sent: false, reason: 'deduplicated' };
        }

        const sent = await sendEmail(payload.userEmail, subject, html);

        if (sent) {
          // Mark as sent for 1 hour
          await redis.set(dedupeKey, '1', 'EX', 3600);
        }

        return { sent, type: 'restock', retailer: payload.retailer };
      }

      default:
        logger.warn({ type: (payload as any).type }, 'Unknown notification type');
        return { sent: false, reason: 'unknown_type' };
    }
  },
  { connection, concurrency: 3 },
);

notificationWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, error: err.message }, 'Notification worker job failed');
});
