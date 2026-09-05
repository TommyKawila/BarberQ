import { createServiceClient } from "@/lib/supabase/server";
import {
  StoreConflict,
  type BookingStore,
} from "@/lib/data/types";
import type { Appointment, Barber, BusyInterval, TimeBlock } from "@/types/booking";

function mapRpcError(error: { message?: string; code?: string }): never {
  const message = error.message ?? "";
  const codes: import("@/lib/data/types").StoreErrorCode[] = [
    "BARBER_NOT_FOUND",
    "SLOT_TAKEN",
    "SLOT_BLOCKED",
    "NOT_FOUND",
    "NOT_OWNER",
    "NOT_CANCELLABLE",
    "TOO_LATE",
    "INVALID_RANGE",
  ];
  for (const code of codes) {
    if (message.includes(code)) throw new StoreConflict(code);
  }
  if (error.code === "23P01") throw new StoreConflict("SLOT_TAKEN");
  throw new Error(message || "Unexpected store error");
}

export const supabaseStore: BookingStore = {
  async listBarbers() {
    const supabase = createServiceClient();
    const { data, error } = await supabase.from("barbers").select("*");
    if (error) throw new Error(error.message);
    return (data ?? []) as Barber[];
  },

  async getBarber(barberId) {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("barbers")
      .select("*")
      .eq("id", barberId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as Barber | null) ?? null;
  },

  async getBusyIntervals(barberId, from, to) {
    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc("get_busy_intervals", {
      p_barber_id: barberId,
      p_from: from.toISOString(),
      p_to: to.toISOString(),
    });
    if (error) mapRpcError(error);
    return (data ?? []) as BusyInterval[];
  },

  async createAppointment(input) {
    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc("create_appointment", {
      p_barber_id: input.barberId,
      p_customer_ref: input.customerRef,
      p_customer_name: input.customerName,
      p_customer_phone: input.customerPhone,
      p_start_time: input.startTime.toISOString(),
    });
    if (error) mapRpcError(error);
    return data as Appointment;
  },

  async cancelAppointment(appointmentId, customerRef) {
    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc("cancel_appointment", {
      p_appointment_id: appointmentId,
      p_customer_ref: customerRef,
    });
    if (error) mapRpcError(error);
    return data as Appointment;
  },

  async getAppointment(appointmentId) {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("id", appointmentId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as Appointment | null) ?? null;
  },

  async createBlock(input) {
    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc("create_block", {
      p_barber_id: input.barberId,
      p_start_time: input.startTime.toISOString(),
      p_end_time: input.endTime.toISOString(),
      p_reason: input.reason,
    });
    if (error) mapRpcError(error);
    return data as TimeBlock;
  },

  async removeBlock(id) {
    const supabase = createServiceClient();
    const { error } = await supabase.from("blocked_slots").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },

  async listDayAppointments(from, to) {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("status", "confirmed")
      .gte("start_time", from.toISOString())
      .lte("start_time", to.toISOString());
    if (error) throw new Error(error.message);
    return (data ?? []) as Appointment[];
  },

  async listDayBlocks(from, to) {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("blocked_slots")
      .select("*")
      .gte("start_time", from.toISOString())
      .lte("start_time", to.toISOString());
    if (error) throw new Error(error.message);
    return (data ?? []) as TimeBlock[];
  },
};
