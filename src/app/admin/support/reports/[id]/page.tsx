"use client";

import { use } from "react";
import { TicketDetailView } from "@/components/support/TicketDetailView";

export default function SupportReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <TicketDetailView ticketId={id} />;
}
