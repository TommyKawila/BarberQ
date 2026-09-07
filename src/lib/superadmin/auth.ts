export function assertSuperAdminToken(token: string | null): void {
  const expected = process.env.SUPERADMIN_TOKEN;
  if (!expected || token !== expected) {
    throw new Error("Unauthorized");
  }
}
