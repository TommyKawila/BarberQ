"use client";

import { TicketForm } from "@/components/support/TicketForm";

export default function SupportReportPage() {
  return (
    <TicketForm
      type="problem"
      title="แจ้งปัญหา"
      placeholder="เกิดอะไรขึ้น? ทำขั้นตอนไหนอยู่? (ตอบภายใน 24 ชม.)"
      submitLabel="ส่งรายงาน"
    />
  );
}
