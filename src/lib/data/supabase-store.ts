import { createServiceClient } from "@/lib/supabase/server";
import { generateStaffToken } from "@/lib/data/staff-seed";
import {
  StoreConflict,
  type BookingStore,
  type CreateRecurringBreakInput,
  type ClaimOwnerInviteInput,
  type CreateShopInput,
  type CreateStaffInput,
  type RecurringBreak,
  type Staff,
  type StaffRole,
  type UpdateBarberInput,
} from "@/lib/data/types";
import {
  countBreaksForWeekday,
  normalizeOffDays,
  validateOffDays,
  validateRecurringBreakInput,
  validateSlotDuration,
} from "@/lib/schedule/validation";
import type { Appointment, Barber, BusyInterval, Shop, TimeBlock } from "@/types/booking";
import type { AppointmentOutcome } from "@/lib/appointment-status";

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
    "INVALID_OUTCOME",
    "INVITE_NOT_FOUND",
    "INVITE_EXPIRED",
    "INVITE_ALREADY_CLAIMED",
    "LINE_ID_TAKEN",
  ];
  for (const code of codes) {
    if (message.includes(code)) throw new StoreConflict(code);
  }
  if (error.code === "23P01") throw new StoreConflict("SLOT_TAKEN");
  throw new Error(message || "Unexpected store error");
}

interface StaffRow {
  id: string;
  name: string;
  role: StaffRole;
  token: string;
  barber_id: string | null;
  active: boolean;
  created_at: string;
}

function mapStaff(row: StaffRow): Staff {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    token: row.token,
    barberId: row.barber_id,
    active: row.active,
    createdAt: new Date(row.created_at),
  };
}

interface RecurringBreakRow {
  id: string;
  barber_id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  created_at: string;
}

function mapRecurringBreak(row: RecurringBreakRow): RecurringBreak {
  const startTime = row.start_time.slice(0, 5);
  const endTime = row.end_time.slice(0, 5);
  return {
    id: row.id,
    barberId: row.barber_id,
    weekday: row.weekday,
    startTime,
    endTime,
    createdAt: new Date(row.created_at),
  };
}

export const supabaseStore: BookingStore = {
  async getShopBySlug(slug) {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("shops")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as Shop | null) ?? null;
  },

  async listBarbersByShop(shopId) {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("barbers")
      .select("*")
      .eq("shop_id", shopId);
    if (error) throw new Error(error.message);
    return (data ?? []) as Barber[];
  },

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
      p_customer_line_id: input.customerLineId ?? null,
    });
    if (!error) return data as Appointment;

    const missingLineParam =
      error.code === "PGRST202" ||
      (error.message ?? "").includes("p_customer_line_id");
    if (!missingLineParam) mapRpcError(error);

    const { data: legacy, error: legacyError } = await supabase.rpc("create_appointment", {
      p_barber_id: input.barberId,
      p_customer_ref: input.customerRef,
      p_customer_name: input.customerName,
      p_customer_phone: input.customerPhone,
      p_start_time: input.startTime.toISOString(),
    });
    if (legacyError) mapRpcError(legacyError);
    const appointment = legacy as Appointment;
    if (!input.customerLineId) return appointment;

    const { data: patched, error: patchError } = await supabase
      .from("appointments")
      .update({ customer_line_id: input.customerLineId })
      .eq("id", appointment.id)
      .select("*")
      .maybeSingle();
    if (patchError) throw new Error(patchError.message);
    return (patched as Appointment | null) ?? appointment;
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

  async staffCancelAppointment(appointmentId) {
    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc("staff_cancel_appointment", {
      p_appointment_id: appointmentId,
    });
    if (!error) return data as Appointment;
    const missingRpc =
      error.code === "PGRST202" ||
      error.code === "42883" ||
      (error.message ?? "").includes("staff_cancel_appointment");
    if (!missingRpc) mapRpcError(error);

    const existing = await this.getAppointment(appointmentId);
    if (!existing) throw new StoreConflict("NOT_FOUND");
    if (existing.status !== "confirmed") throw new StoreConflict("NOT_CANCELLABLE");

    const { data: updated, error: updateError } = await supabase
      .from("appointments")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("id", appointmentId)
      .eq("status", "confirmed")
      .select("*")
      .maybeSingle();
    if (updateError) throw new Error(updateError.message);
    if (!updated) throw new StoreConflict("NOT_CANCELLABLE");
    return updated as Appointment;
  },

  async cancelAppointmentByToken(token) {
    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc("cancel_appointment_by_token", {
      p_cancel_token: token,
    });
    if (error) mapRpcError(error);
    return data as Appointment;
  },

  async getAppointmentByCancelToken(token) {
    const trimmed = token.trim();
    if (!trimmed) return null;
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("cancel_token", trimmed)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as Appointment | null) ?? null;
  },

  async markLateCalled(appointmentId) {
    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc("mark_late_called", {
      p_appointment_id: appointmentId,
    });
    if (error) mapRpcError(error);
    return data as Appointment;
  },

  async listCustomerAppointments(customerLineId) {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("customer_line_id", customerLineId)
      .neq("status", "cancelled")
      .order("start_time", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as Appointment[];
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

  async getBlock(id) {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("blocked_slots")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as TimeBlock | null) ?? null;
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
      .in("status", ["confirmed", "completed", "no_show"])
      .gte("start_time", from.toISOString())
      .lte("start_time", to.toISOString());
    if (error) throw new Error(error.message);
    return (data ?? []) as Appointment[];
  },

  async listAppointmentsInRange(from, to) {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .gte("start_time", from.toISOString())
      .lte("start_time", to.toISOString());
    if (error) throw new Error(error.message);
    return (data ?? []) as Appointment[];
  },

  async markAppointmentOutcome(appointmentId, outcome: AppointmentOutcome) {
    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc("mark_appointment_outcome", {
      p_appointment_id: appointmentId,
      p_status: outcome,
    });
    if (error) mapRpcError(error);
    return data as Appointment;
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

  async getShopSettings(shopId) {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("shop_settings")
      .select("shop_id, logo_data_url, shop_name, shop_line_url, shop_phone")
      .eq("shop_id", shopId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return {
      shopId,
      logoDataUrl: (data?.logo_data_url as string | null) ?? null,
      shopName: (data?.shop_name as string | null) ?? null,
      lineUrl: (data?.shop_line_url as string | null) ?? null,
      phone: (data?.shop_phone as string | null) ?? null,
    };
  },

  async setShopSettings(shopId, input) {
    const supabase = createServiceClient();
    const { error } = await supabase
      .from("shop_settings")
      .upsert({
        shop_id: shopId,
        logo_data_url: input.logoDataUrl,
        shop_name: input.shopName,
        shop_line_url: input.lineUrl,
        shop_phone: input.phone,
        updated_at: new Date().toISOString(),
      });
    if (error) throw new Error(error.message);
  },

  async getStaffByToken(token) {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("staff")
      .select("*")
      .eq("token", token)
      .eq("active", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? mapStaff(data as StaffRow) : null;
  },

  async listStaff() {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("staff")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return ((data ?? []) as StaffRow[]).map(mapStaff);
  },

  async createStaff(input: CreateStaffInput) {
    const name = input.name.trim();
    if (!name) throw new StoreConflict("INVALID_RANGE");
    if (input.barberId) {
      const barber = await supabaseStore.getBarber(input.barberId);
      if (!barber) throw new StoreConflict("BARBER_NOT_FOUND");
    }
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("staff")
      .insert({
        name,
        role: input.role,
        token: generateStaffToken(),
        barber_id: input.barberId ?? null,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return mapStaff(data as StaffRow);
  },

  async deactivateStaff(staffId) {
    const supabase = createServiceClient();
    const { error } = await supabase
      .from("staff")
      .update({ active: false })
      .eq("id", staffId);
    if (error) throw new Error(error.message);
  },

  async updateBarber(barberId, input: UpdateBarberInput) {
    const barber = await supabaseStore.getBarber(barberId);
    if (!barber) throw new StoreConflict("BARBER_NOT_FOUND");
    const update: Record<string, unknown> = {};
    if (input.offDays !== undefined) {
      const offDays = normalizeOffDays(input.offDays);
      if (validateOffDays(offDays)) throw new StoreConflict("INVALID_RANGE");
      update.off_days = offDays;
    }
    if (input.slotDuration !== undefined) {
      if (validateSlotDuration(input.slotDuration)) throw new StoreConflict("INVALID_RANGE");
      update.slot_duration_minutes = input.slotDuration;
    }
    if (Object.keys(update).length === 0) return barber;
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("barbers")
      .update(update)
      .eq("id", barberId)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return data as Barber;
  },

  async listRecurringBreaks(barberId) {
    const barber = await supabaseStore.getBarber(barberId);
    if (!barber) throw new StoreConflict("BARBER_NOT_FOUND");
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("recurring_breaks")
      .select("*")
      .eq("barber_id", barberId)
      .order("weekday")
      .order("start_time");
    if (error) throw new Error(error.message);
    return ((data ?? []) as RecurringBreakRow[]).map(mapRecurringBreak);
  },

  async createRecurringBreak(input: CreateRecurringBreakInput) {
    const barber = await supabaseStore.getBarber(input.barberId);
    if (!barber) throw new StoreConflict("BARBER_NOT_FOUND");
    if (validateRecurringBreakInput(input)) throw new StoreConflict("INVALID_RANGE");
    const existing = await supabaseStore.listRecurringBreaks(input.barberId);
    if (countBreaksForWeekday(existing, input.weekday) >= 3) {
      throw new StoreConflict("INVALID_RANGE");
    }
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("recurring_breaks")
      .insert({
        barber_id: input.barberId,
        weekday: input.weekday,
        start_time: input.startTime,
        end_time: input.endTime,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return mapRecurringBreak(data as RecurringBreakRow);
  },

  async deleteRecurringBreak(breakId) {
    const supabase = createServiceClient();
    const { error } = await supabase.from("recurring_breaks").delete().eq("id", breakId);
    if (error) throw new Error(error.message);
  },

  async listShops() {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("shops")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as Shop[];
  },

  async createShop(input: CreateShopInput) {
    const supabase = createServiceClient();
    const ownerLineId = input.ownerLineId?.trim() ?? "";

    if (!ownerLineId) {
      const { data, error } = await supabase.rpc("create_shop_invite", {
        p_shop_name: input.name,
        p_subscription_months: input.subscriptionMonths,
      });
      if (error) mapRpcError(error);

      const result = data as { shop_id?: string } | null;
      const shopId = result?.shop_id;
      if (!shopId) throw new Error("Shop creation failed");

      const { data: shop, error: shopError } = await supabase
        .from("shops")
        .select("*")
        .eq("id", shopId)
        .maybeSingle();
      if (shopError) throw new Error(shopError.message);
      if (!shop) throw new Error("Shop not found after creation");
      return shop as Shop;
    }

    const { data, error } = await supabase.rpc("create_shop_with_owner", {
      p_shop_name: input.name,
      p_owner_line_id: ownerLineId,
      p_owner_name: input.ownerName ?? "Owner",
      p_subscription_months: input.subscriptionMonths,
    });
    if (error) mapRpcError(error);

    const result = data as { shop_id?: string } | null;
    const shopId = result?.shop_id;
    if (!shopId) throw new Error("Shop creation failed");

    const { data: shop, error: shopError } = await supabase
      .from("shops")
      .select("*")
      .eq("id", shopId)
      .maybeSingle();
    if (shopError) throw new Error(shopError.message);
    if (!shop) throw new Error("Shop not found after creation");
    return shop as Shop;
  },

  async getShopInvitePreview(token) {
    const trimmed = token.trim();
    if (!trimmed) return null;
    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc("get_shop_by_invite_token", {
      p_invite_token: trimmed,
    });
    if (error) throw new Error(error.message);

    const result = data as {
      found?: boolean;
      shop_name?: string;
      expired?: boolean;
      claimed?: boolean;
    } | null;
    if (!result?.found) return null;

    return {
      shopName: result.shop_name ?? "",
      expired: Boolean(result.expired),
      claimed: Boolean(result.claimed),
    };
  },

  async claimOwnerInvite(input: ClaimOwnerInviteInput) {
    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc("claim_owner_invite", {
      p_invite_token: input.inviteToken.trim(),
      p_owner_line_id: input.ownerLineId.trim(),
      p_owner_name: input.ownerName.trim() || "Owner",
    });
    if (error) mapRpcError(error);

    const result = data as { shop_id?: string } | null;
    const shopId = result?.shop_id;
    if (!shopId) throw new StoreConflict("INVITE_NOT_FOUND");

    const { data: shop, error: shopError } = await supabase
      .from("shops")
      .select("*")
      .eq("id", shopId)
      .maybeSingle();
    if (shopError) throw new Error(shopError.message);
    if (!shop) throw new StoreConflict("INVITE_NOT_FOUND");
    return shop as Shop;
  },

  async getBarberByLineId(lineId) {
    const trimmed = lineId.trim();
    if (!trimmed) return null;
    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc("get_barber_by_line_id", {
      p_line_id: trimmed,
    });
    if (error) {
      const { data: fallback, error: fallbackError } = await supabase
        .from("barbers")
        .select("*")
        .eq("line_id", trimmed)
        .maybeSingle();
      if (fallbackError) throw new Error(fallbackError.message);
      return (fallback as Barber | null) ?? null;
    }
    return (data as Barber | null) ?? null;
  },
};
