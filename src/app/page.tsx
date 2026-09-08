import { LiffCallbackRedirect } from "@/components/liff/LiffCallbackRedirect";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <LiffCallbackRedirect />
      <h1 className="text-3xl font-bold">BarberQ</h1>
      <p className="mt-4 text-zinc-400">Multi-Shop Booking System</p>
      <p className="mt-2 text-sm text-zinc-500">เข้าร้านผ่าน /[shop-slug]</p>
      <a href="/phinxstudio" className="mt-6 text-amber-400 underline">
        PHINX STUDIO
      </a>
    </div>
  );
}
