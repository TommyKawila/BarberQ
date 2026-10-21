import { MockSlipVerifier } from "@/lib/billing/slip-verifiers/mock";
import { SlipOkVerifier } from "@/lib/billing/slip-verifiers/slipok";
import { EasySlipVerifier } from "@/lib/billing/slip-verifiers/easyslip";
import type { SlipVerifier } from "@/lib/billing/slip-verifier";
import {
  getOptionalPromptPayId,
  getSlipVerifierName,
} from "@/lib/billing/env";

export function createSlipVerifier(overrides?: {
  name?: string;
  promptPayId?: string;
}): SlipVerifier {
  const name = (overrides?.name ?? getSlipVerifierName()).toLowerCase();
  const promptPay =
    overrides?.promptPayId ?? getOptionalPromptPayId() ?? "0000000000";

  if (name === "slipok") {
    return new SlipOkVerifier(
      process.env.SLIPOK_API_KEY?.trim() ?? "",
      process.env.SLIPOK_BRANCH_ID?.trim(),
    );
  }
  if (name === "easyslip") {
    return new EasySlipVerifier(process.env.EASYSLIP_API_KEY?.trim() ?? "");
  }
  return new MockSlipVerifier({ receiverPromptPay: promptPay });
}

export { MockSlipVerifier, SlipOkVerifier, EasySlipVerifier };
