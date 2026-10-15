import type { QrQueueStatus } from "@/lib/queue/qr-queue-logic";

export type { QrQueueStatus };

export interface QrQueueEntry {
  id: string;
  shop_id: string;
  customer_line_id: string;
  customer_name: string;
  preferred_barber_id: string | null;
  status: QrQueueStatus;
  appointment_id: string | null;
  assigned_barber_id: string | null;
  ahead_notified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface JoinQrQueueInput {
  shopId: string;
  customerLineId: string;
  customerName: string;
  /** null / omitted = first available */
  preferredBarberId?: string | null;
}

export interface QrQueuePublicView {
  entry: QrQueueEntry;
  position: number;
  ahead: number;
  waitMinutes: number;
  preferredBarberName: string | null;
  assignedBarberName: string | null;
}
