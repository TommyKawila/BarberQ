/** Official LINE user id shape: U + 32 lowercase hex. */
export const LINE_USER_ID_PATTERN = /^U[0-9a-f]{32}$/;

export function isValidLineUserId(value: string): boolean {
  return LINE_USER_ID_PATTERN.test(value.trim());
}
