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
  const appointment = await store.getAppointmentByCancelToken(token);
  const barber = appointment ? await store.getBarber(appointment.barber_id) : null;
  const shopId = barber?.shop_id;
  const [settings, barbers] = await Promise.all([
    shopId
      ? store.getShopSettings(shopId)
      : Promise.resolve({
          shopId: "",
          logoDataUrl: null,
          coverImageUrl: null,
          shopName: null,
          lineUrl: null,
          phone: null,
        }),
    shopId ? store.listBarbersByShop(shopId) : store.listBarbers(),
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
