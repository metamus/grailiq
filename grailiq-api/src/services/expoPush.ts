import { logger } from '../lib/logger.js';
import { db } from '../config/database.js';
import { pushTokens } from '../db/schema.js';
import { and, eq, inArray } from 'drizzle-orm';

/**
 * Expo push notification service.
 *
 * Expo's push API accepts up to 100 messages per request at:
 *   https://exp.host/--/api/v2/push/send
 *
 * Each response ticket has `status: 'ok' | 'error'`. Error statuses we act on:
 *   - DeviceNotRegistered → disable the token in our DB (stops further tries)
 *   - MessageTooBig       → truncate and skip
 *   - InvalidCredentials  → log and skip (should never happen with Expo's
 *                           managed credentials)
 *
 * We don't poll the receipt endpoint here — that's for deep delivery
 * analytics which we can add later.
 */

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const BATCH_SIZE = 100;

export interface PushMessage {
  to: string; // ExponentPushToken[...]
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
  badge?: number;
  channelId?: string; // Android
}

interface ExpoTicketError {
  status: 'error';
  message: string;
  details?: { error?: string };
}

interface ExpoTicketOk {
  status: 'ok';
  id: string;
}

type ExpoTicket = ExpoTicketOk | ExpoTicketError;

interface ExpoResponse {
  data?: ExpoTicket[];
  errors?: Array<{ code: string; message: string }>;
}

/**
 * Send a batch of push messages. Disables DeviceNotRegistered tokens in-DB.
 * Returns a summary of successful/failed ticket counts.
 */
export async function sendExpoPushBatch(
  messages: PushMessage[],
): Promise<{ ok: number; failed: number; disabled: number }> {
  if (messages.length === 0) return { ok: 0, failed: 0, disabled: 0 };

  let ok = 0;
  let failed = 0;
  let disabled = 0;

  for (let i = 0; i < messages.length; i += BATCH_SIZE) {
    const batch = messages.slice(i, i + BATCH_SIZE);

    try {
      const response = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'Accept-Encoding': 'gzip, deflate',
        },
        body: JSON.stringify(batch),
      });

      if (!response.ok) {
        logger.warn(
          { status: response.status, batchSize: batch.length },
          'Expo push request failed',
        );
        failed += batch.length;
        continue;
      }

      const json = (await response.json()) as ExpoResponse;

      if (json.errors?.length) {
        logger.warn({ errors: json.errors }, 'Expo push returned top-level errors');
        failed += batch.length;
        continue;
      }

      const tickets = json.data ?? [];
      const invalidTokens: string[] = [];

      tickets.forEach((ticket, idx) => {
        if (ticket.status === 'ok') {
          ok++;
        } else {
          failed++;
          const err = ticket.details?.error;
          if (err === 'DeviceNotRegistered') {
            invalidTokens.push(batch[idx].to);
          } else {
            logger.warn({ error: err, message: ticket.message }, 'Expo push ticket error');
          }
        }
      });

      if (invalidTokens.length > 0) {
        await db
          .update(pushTokens)
          .set({ isEnabled: false })
          .where(inArray(pushTokens.expoPushToken, invalidTokens));
        disabled += invalidTokens.length;
      }
    } catch (err) {
      logger.error({ error: err, batchSize: batch.length }, 'Expo push network error');
      failed += batch.length;
    }
  }

  return { ok, failed, disabled };
}

/**
 * Load every enabled push token for a user. Used by the notification worker
 * to fan out a single restock event to all of a user's devices.
 */
export async function getUserPushTokens(userId: string): Promise<string[]> {
  const rows = await db
    .select({ token: pushTokens.expoPushToken })
    .from(pushTokens)
    .where(and(eq(pushTokens.userId, userId), eq(pushTokens.isEnabled, true)));
  return rows.map((r) => r.token);
}
