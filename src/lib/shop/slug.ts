export function slugifyShopName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, "");
}
