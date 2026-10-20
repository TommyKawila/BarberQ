import { DemoBoard } from "@/components/demo/DemoBoard";

export const metadata = {
  title: "บอร์ดตัวอย่าง · ClipperQ Demo",
  description: "บอร์ดคิวตัวอย่าง ClipperQ แบบอ่านอย่างเดียว",
};

/**
 * Public read-only demo board (no staff login).
 * Mutations stay on /{slug}/admin which requires LINE staff auth.
 */
export default function DemoBoardPage() {
  return <DemoBoard />;
}
