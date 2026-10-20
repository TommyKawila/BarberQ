import { redirect } from "next/navigation";
import { demoShopBoardPath } from "@/lib/marketing/demo-shop";

/**
 * Stable entry to the demo shop queue board.
 * Board requires staff LINE login (no separate public read-only board).
 */
export default function DemoBoardRedirectPage() {
  redirect(demoShopBoardPath());
}
