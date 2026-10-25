import { isPrototypeMode } from "@/lib/data";
import { createServiceClient } from "@/lib/supabase/server";
import {
  decryptSecret,
  encryptSecret,
  hasAppEncryptionKey,
  maskSecretLast4,
} from "@/lib/crypto/secret-box";

export type LineChannelStatus = "pending" | "verified" | "broken";
export type LineChannelPlan = "free" | "basic" | "pro" | "unknown";

export interface ShopLineChannelPublic {
  shopId: string;
  messagingChannelId: string | null;
  channelSecretLast4: string | null;
  accessTokenLast4: string | null;
  botUserId: string | null;
  botDisplayName: string | null;
  oaBasicId: string | null;
  plan: LineChannelPlan;
  monthlyPushBudget: number;
  status: LineChannelStatus;
  lastVerifiedAt: string | null;
  lastErrorCode: string | null;
  lastErrorMessage: string | null;
  checklistStep: number;
  /** Owner confirmed auto-reply/greeting off in OA Manager (LINE API cannot report this). */
  autoReplyConfirmedAt: string | null;
  hasSecret: boolean;
  hasAccessToken: boolean;
}

export interface ShopLineChannelSecrets {
  channelSecret: string | null;
  accessToken: string | null;
}

export interface ShopLineChannelRow extends ShopLineChannelPublic {
  channelSecretEnc: string | null;
  accessTokenEnc: string | null;
}

export interface UpsertShopLineChannelInput {
  messagingChannelId?: string | null;
  channelSecret?: string | null;
  accessToken?: string | null;
  botUserId?: string | null;
  botDisplayName?: string | null;
  oaBasicId?: string | null;
  plan?: LineChannelPlan;
  monthlyPushBudget?: number;
  status?: LineChannelStatus;
  lastVerifiedAt?: string | null;
  lastErrorCode?: string | null;
  lastErrorMessage?: string | null;
  checklistStep?: number;
  /** Set ISO timestamp, or null to clear. */
  autoReplyConfirmedAt?: string | null;
}

const memoryChannels = new Map<string, ShopLineChannelRow>();

function toPublic(row: ShopLineChannelRow): ShopLineChannelPublic {
  const {
    channelSecretEnc: _s,
    accessTokenEnc: _t,
    ...rest
  } = row;
  return {
    ...rest,
    hasSecret: Boolean(row.channelSecretEnc),
    hasAccessToken: Boolean(row.accessTokenEnc),
  };
}

function emptyRow(shopId: string): ShopLineChannelRow {
  return {
    shopId,
    messagingChannelId: null,
    channelSecretEnc: null,
    channelSecretLast4: null,
    accessTokenEnc: null,
    accessTokenLast4: null,
    botUserId: null,
    botDisplayName: null,
    oaBasicId: null,
    plan: "free",
    monthlyPushBudget: 300,
    status: "pending",
    lastVerifiedAt: null,
    lastErrorCode: null,
    lastErrorMessage: null,
    checklistStep: 1,
    autoReplyConfirmedAt: null,
    hasSecret: false,
    hasAccessToken: false,
  };
}

function mapDbRow(row: Record<string, unknown>): ShopLineChannelRow {
  return {
    shopId: String(row.shop_id),
    messagingChannelId: (row.messaging_channel_id as string | null) ?? null,
    channelSecretEnc: (row.channel_secret_enc as string | null) ?? null,
    channelSecretLast4: (row.channel_secret_last4 as string | null) ?? null,
    accessTokenEnc: (row.access_token_enc as string | null) ?? null,
    accessTokenLast4: (row.access_token_last4 as string | null) ?? null,
    botUserId: (row.bot_user_id as string | null) ?? null,
    botDisplayName: (row.bot_display_name as string | null) ?? null,
    oaBasicId: (row.oa_basic_id as string | null) ?? null,
    plan: (row.plan as LineChannelPlan) ?? "free",
    monthlyPushBudget: Number(row.monthly_push_budget ?? 300),
    status: (row.status as LineChannelStatus) ?? "pending",
    lastVerifiedAt: (row.last_verified_at as string | null) ?? null,
    lastErrorCode: (row.last_error_code as string | null) ?? null,
    lastErrorMessage: (row.last_error_message as string | null) ?? null,
    checklistStep: Number(row.checklist_step ?? 1),
    autoReplyConfirmedAt: (row.auto_reply_confirmed_at as string | null) ?? null,
    hasSecret: Boolean(row.channel_secret_enc),
    hasAccessToken: Boolean(row.access_token_enc),
  };
}

export async function getShopLineChannel(shopId: string): Promise<ShopLineChannelPublic | null> {
  if (isPrototypeMode()) {
    const row = memoryChannels.get(shopId);
    return row ? toPublic(row) : null;
  }
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("shop_line_channels")
    .select("*")
    .eq("shop_id", shopId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return toPublic(mapDbRow(data as Record<string, unknown>));
}

export async function getShopLineChannelSecrets(
  shopId: string,
): Promise<ShopLineChannelSecrets> {
  if (!hasAppEncryptionKey() && !isPrototypeMode()) {
    return { channelSecret: null, accessToken: null };
  }
  let row: ShopLineChannelRow | null = null;
  if (isPrototypeMode()) {
    row = memoryChannels.get(shopId) ?? null;
  } else {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("shop_line_channels")
      .select("channel_secret_enc, access_token_enc")
      .eq("shop_id", shopId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return { channelSecret: null, accessToken: null };
    row = {
      ...emptyRow(shopId),
      channelSecretEnc: (data.channel_secret_enc as string | null) ?? null,
      accessTokenEnc: (data.access_token_enc as string | null) ?? null,
    };
  }
  if (!row) return { channelSecret: null, accessToken: null };
  return {
    channelSecret: row.channelSecretEnc ? decryptSecret(row.channelSecretEnc) : null,
    accessToken: row.accessTokenEnc ? decryptSecret(row.accessTokenEnc) : null,
  };
}

export async function upsertShopLineChannel(
  shopId: string,
  input: UpsertShopLineChannelInput,
): Promise<ShopLineChannelPublic> {
  const existing = isPrototypeMode()
    ? memoryChannels.get(shopId) ?? emptyRow(shopId)
    : (await getShopLineChannel(shopId))
      ? await loadFullRow(shopId)
      : emptyRow(shopId);

  const next: ShopLineChannelRow = {
    ...existing,
    shopId,
    messagingChannelId:
      input.messagingChannelId !== undefined
        ? input.messagingChannelId?.trim() || null
        : existing.messagingChannelId,
    botUserId: input.botUserId !== undefined ? input.botUserId : existing.botUserId,
    botDisplayName:
      input.botDisplayName !== undefined ? input.botDisplayName : existing.botDisplayName,
    oaBasicId: input.oaBasicId !== undefined ? input.oaBasicId : existing.oaBasicId,
    plan: input.plan ?? existing.plan,
    monthlyPushBudget: input.monthlyPushBudget ?? existing.monthlyPushBudget,
    status: input.status ?? existing.status,
    lastVerifiedAt:
      input.lastVerifiedAt !== undefined ? input.lastVerifiedAt : existing.lastVerifiedAt,
    lastErrorCode:
      input.lastErrorCode !== undefined ? input.lastErrorCode : existing.lastErrorCode,
    lastErrorMessage:
      input.lastErrorMessage !== undefined ? input.lastErrorMessage : existing.lastErrorMessage,
    checklistStep: input.checklistStep ?? existing.checklistStep,
    autoReplyConfirmedAt: existing.autoReplyConfirmedAt,
  };

  if (input.channelSecret !== undefined && input.channelSecret !== null) {
    const secret = input.channelSecret.trim();
    if (secret) {
      next.channelSecretEnc = encryptSecret(secret);
      next.channelSecretLast4 = maskSecretLast4(secret);
      // New secret → owner must re-confirm auto-reply off for this OA.
      next.autoReplyConfirmedAt = null;
    }
  }
  if (input.accessToken !== undefined && input.accessToken !== null) {
    const token = input.accessToken.trim();
    if (token) {
      next.accessTokenEnc = encryptSecret(token);
      next.accessTokenLast4 = maskSecretLast4(token);
      next.autoReplyConfirmedAt = null;
    }
  }
  // Explicit confirm/clear wins after secret rotation side-effects.
  if (input.autoReplyConfirmedAt !== undefined) {
    next.autoReplyConfirmedAt = input.autoReplyConfirmedAt;
  }

  if (isPrototypeMode()) {
    memoryChannels.set(shopId, next);
    return toPublic(next);
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("shop_line_channels")
    .upsert(
      {
        shop_id: shopId,
        messaging_channel_id: next.messagingChannelId,
        channel_secret_enc: next.channelSecretEnc,
        channel_secret_last4: next.channelSecretLast4,
        access_token_enc: next.accessTokenEnc,
        access_token_last4: next.accessTokenLast4,
        bot_user_id: next.botUserId,
        bot_display_name: next.botDisplayName,
        oa_basic_id: next.oaBasicId,
        plan: next.plan,
        monthly_push_budget: next.monthlyPushBudget,
        status: next.status,
        last_verified_at: next.lastVerifiedAt,
        last_error_code: next.lastErrorCode,
        last_error_message: next.lastErrorMessage,
        checklist_step: next.checklistStep,
        auto_reply_confirmed_at: next.autoReplyConfirmedAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "shop_id" },
    )
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return toPublic(mapDbRow(data as Record<string, unknown>));
}

async function loadFullRow(shopId: string): Promise<ShopLineChannelRow> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("shop_line_channels")
    .select("*")
    .eq("shop_id", shopId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return emptyRow(shopId);
  return mapDbRow(data as Record<string, unknown>);
}

/** Test helper — clear in-memory channels. */
export function __resetShopLineChannelsForTests() {
  memoryChannels.clear();
}
