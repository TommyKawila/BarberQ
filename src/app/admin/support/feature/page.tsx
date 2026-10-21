"use client";

import { TicketForm } from "@/components/support/TicketForm";

export default function SupportFeaturePage() {
  return (
    <TicketForm
      type="feature"
      title="ขอฟีเจอร์"
      placeholder="อยากให้ ClipperQ ช่วยอะไรเพิ่ม? (ตอบภายใน 24 ชม.)"
      submitLabel="ส่งคำขอ"
    />
  );
}
