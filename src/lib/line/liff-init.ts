import liff from "@line/liff";

/**
 * One shared LIFF init promise for customer + admin.
 * Re-calling liff.init() after success rejects and used to flash logged-out UI.
 * Failed inits are cleared so a re-login / retry can call init again.
 */
let sharedLiffInit: Promise<void> | null = null;

export function ensureLiffInit(liffId: string): Promise<void> {
  if (!sharedLiffInit) {
    sharedLiffInit = liff.init({ liffId }).then(
      () => undefined,
      (err: unknown) => {
        sharedLiffInit = null;
        throw err;
      },
    );
  }
  return sharedLiffInit;
}

/** Clear sticky init so the next ensureLiffInit can retry after logout / expiry. */
export function resetSharedLiffInit(): void {
  sharedLiffInit = null;
}

/** @internal tests */
export function __resetSharedLiffInitForTests() {
  resetSharedLiffInit();
}
