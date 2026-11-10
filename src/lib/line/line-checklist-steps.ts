import type { ShopLineChannelPublic } from "@/lib/line/shop-channel";

export type ChecklistStepN = 1 | 2 | 3 | 4;

export type ChecklistStepState = {
  n: ChecklistStepN;
  done: boolean;
  active: boolean;
};

export type LineChecklistProgress = {
  currentStep: ChecklistStepN;
  steps: ChecklistStepState[];
};

type ChannelBits = Pick<
  ShopLineChannelPublic,
  | "messagingChannelId"
  | "hasSecret"
  | "hasAccessToken"
  | "autoReplyConfirmedAt"
  | "checklistStep"
  | "status"
>;

/** True when the shop has stored any Messaging API identity/keys. */
export function hasMessagingApiKeys(
  channel: ChannelBits | null | undefined,
): boolean {
  if (!channel) return false;
  return Boolean(
    channel.messagingChannelId?.trim() ||
      channel.hasSecret ||
      channel.hasAccessToken,
  );
}

/**
 * Wizard step ticks for /admin/settings/line checklist.
 * Keyless shops (no Channel ID / secret / token) must NOT mark Messaging API done.
 */
export function resolveLineChecklistSteps(
  channel: ChannelBits | null | undefined,
): LineChecklistProgress {
  const messagingDone = hasMessagingApiKeys(channel);
  const webhookDone =
    messagingDone &&
    Boolean(
      channel &&
        (channel.checklistStep >= 3 ||
          channel.status === "verified" ||
          channel.autoReplyConfirmedAt),
    );
  const autoReplyDone = Boolean(channel?.autoReplyConfirmedAt);
  const inviteDone = Boolean(channel && channel.checklistStep >= 4);

  let currentStep: ChecklistStepN = 1;
  if (!messagingDone) currentStep = 1;
  else if (!webhookDone) currentStep = 2;
  else if (!autoReplyDone) currentStep = 3;
  else currentStep = 4;

  const doneFor = (n: ChecklistStepN): boolean => {
    if (n === 1) return messagingDone;
    if (n === 2) return webhookDone;
    if (n === 3) return autoReplyDone;
    return inviteDone;
  };

  const steps: ChecklistStepState[] = ([1, 2, 3, 4] as const).map((n) => ({
    n,
    done: doneFor(n),
    active: n === currentStep && !doneFor(n),
  }));

  // When invite is the current step but already done (fully complete), keep it done/inactive.
  if (inviteDone && autoReplyDone && webhookDone && messagingDone) {
    return {
      currentStep: 4,
      steps: steps.map((s) => ({ ...s, active: false })),
    };
  }

  return { currentStep, steps };
}
