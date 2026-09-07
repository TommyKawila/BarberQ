import { CancelClient } from "@/components/customer/CancelClient";
import { getStore } from "@/lib/data";

export const runtime = "nodejs";

export default async function CancelPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const store = getStore();
  const [appointment, settings, barbers] = await Promise.all([
    store.getAppointmentByCancelToken(token),
    store.getShopSettings(),
    store.listBarbers(),
  ]);

  return (
    <CancelClient
      token={token}
      appointment={appointment}
      barbers={barbers}
      lineUrl={settings.lineUrl}
      phone={settings.phone}
    />
  );
}
