import liff from "@line/liff";

/**
 * One shared LIFF init promise for customer + admin.
 * Re-calling liff.init() after success rejects and used to flash logged-out UI.
 */
let sharedLiffInit: Promise<void> | null = null;

export function ensureLiffInit(liffId: string): Promise<void> {
  if (!sharedLiffInit) {
    sharedLiffInit = liff.init({ liffId }).then(() => undefined);
  }
  return sharedLiffInit;
}

/** @internal tests */
export function __resetSharedLiffInitForTests() {
  sharedLiffInit = null;
}
