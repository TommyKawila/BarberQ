import Link from "next/link";

const QUICK_LINKS = [
  { href: "/", label: "จองคิว (ลูกค้า)", accent: "bg-amber-400 text-zinc-950" },
  { href: "/saeb", label: "Saeb · Admin", accent: "bg-zinc-800 text-zinc-100" },
  { href: "/tide", label: "Tide · Admin", accent: "bg-zinc-800 text-zinc-100" },
  { href: "/nat", label: "Nat · Admin", accent: "bg-zinc-800 text-zinc-100" },
] as const;

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-4">
      <h2 className="text-base font-semibold text-amber-400">{title}</h2>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-zinc-300">{children}</div>
    </section>
  );
}

function LegendRow({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-5 w-5 shrink-0 rounded ${color}`} />
      <span>{label}</span>
    </div>
  );
}

export default function GuidePage() {
  return (
    <article className="flex flex-col gap-6 px-4 py-5 pb-10">
      <header>
        <p className="text-xs uppercase tracking-wide text-zinc-500">BarberQ</p>
        <h1 className="mt-1 text-2xl font-bold">คู่มือใช้งาน</h1>
        <p className="mt-2 text-sm text-zinc-400">
          ระบบจองคิวตัดผม + บอร์ดจัดการคิวสำหรับช่าง (เวอร์ชันทดลอง ยังไม่เชื่อม LINE)
        </p>
      </header>

      <nav className="grid grid-cols-2 gap-2">
        {QUICK_LINKS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`min-h-12 rounded-xl px-3 py-2.5 text-center text-sm font-semibold ${item.accent}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <nav className="flex flex-wrap gap-2 text-xs">
        {[
          ["#customer", "ลูกค้า"],
          ["#admin", "Admin"],
          ["#schedule", "ตารางเวลา"],
          ["#saeb", "Super Admin"],
          ["#feedback", "Feedback"],
        ].map(([href, label]) => (
          <a
            key={href}
            href={href}
            className="rounded-full border border-zinc-700 px-3 py-1 text-zinc-400"
          >
            {label}
          </a>
        ))}
      </nav>

      <Section id="customer" title="1) ฝั่งลูกค้า — จองคิว">
        <p>เปิดหน้าแรก แล้วทำตามขั้นตอน:</p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>เลือกช่าง (Saeb / Tide / Nat)</li>
          <li>เลือกวันที่ (จองล่วงหน้าได้ 7 วัน)</li>
          <li>เลือกเวลาที่ว่าง</li>
          <li>กรอกชื่อ + เบอร์โทร</li>
          <li>กดยืนยัน</li>
        </ol>
        <p className="rounded-xl bg-zinc-900 p-3 text-zinc-400">
          <strong className="text-zinc-200">เวลาเปิดร้าน:</strong> จ–ศ 10:30–20:00 · ส–อา 10:00–20:00
          <br />
          <strong className="text-zinc-200">ยกเลิก:</strong> ก่อนเวลานัดอย่างน้อย 30 นาที
          <br />
          สลับภาษาไทย/อังกฤษได้ที่ header
        </p>
      </Section>

      <Section id="admin" title="2) ฝั่งช่าง — เข้า Admin">
        <p>เปิดลิงก์สั้นจากมือถือ (จำง่าย):</p>
        <ul className="space-y-2">
          <li>
            <Link href="/saeb" className="font-semibold text-amber-400 underline">
              /saeb
            </Link>
            {" — Super Admin + ช่าง"}
          </li>
          <li>
            <Link href="/tide" className="font-semibold text-amber-400 underline">
              /tide
            </Link>
            {" — ช่าง"}
          </li>
          <li>
            <Link href="/nat" className="font-semibold text-amber-400 underline">
              /nat
            </Link>
            {" — ช่าง"}
          </li>
        </ul>
        <p className="text-zinc-500">
          เปิดลิงก์แล้วเข้าบอร์ดอัตโนมัติ ไม่ต้องใส่รหัสผ่าน (ใครมีลิงก์เข้าได้ — ระบบทดลองชั่วคราว)
        </p>
      </Section>

      <Section id="board" title="3) บอร์ดวันนี้">
        <p>กดช่องเวลาเพื่อบล็อก/ปล่อย Walk-in</p>
        <div className="space-y-2 rounded-xl bg-zinc-900 p-3">
          <LegendRow color="bg-emerald-700" label="ว่าง — ลูกค้าจองได้" />
          <LegendRow color="bg-red-600" label="Walk-in — ช่างบล็อกไว้" />
          <LegendRow color="bg-sky-700" label="จองแล้ว — เห็นชื่อลูกค้า" />
          <LegendRow color="bg-red-600" label="พัก — เวลาพักประจำ" />
        </div>
        <p>
          <strong className="text-zinc-200">Tide / Nat:</strong> แก้ได้เฉพาะคอลัมน์ตัวเอง
          <br />
          <strong className="text-zinc-200">Saeb:</strong> แก้ได้ทุกคอลัมน์
        </p>
        <p className="text-zinc-500">บอร์ดรีเฟรชอัตโนมัติทุก 10 วินาที</p>
      </Section>

      <Section id="schedule" title="4) ตารางเวลาของฉัน">
        <p>กด &quot;ตารางเวลาของฉัน&quot; จากบอร์ด Admin</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong className="text-zinc-200">วันหยุดประจำ</strong> — ติ๊กวันที่หยุด (ต้องเหลืออย่างน้อย 1
            วันทำงาน)
          </li>
          <li>
            <strong className="text-zinc-200">ความยาวคิว</strong> — 15 / 30 / 45 / 60 / 90 / 120 นาที
          </li>
          <li>
            <strong className="text-zinc-200">เวลาพักประจำ</strong> — พักซ้ำทุกสัปดาห์ (สูงสุด 3
            ช่วง/วัน) ลูกค้าจองช่วงนี้ไม่ได้
          </li>
        </ul>
        <p className="text-zinc-500">Walk-in รายวันยังตั้งจากบอร์ดหลักเหมือนเดิม</p>
      </Section>

      <Section id="saeb" title="5) เฉพาะ Saeb — Super Admin">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <Link href="/admin/settings" className="text-amber-400 underline">
              ตั้งค่า
            </Link>
            {" — ชื่อร้าน + โลโก้"}
          </li>
          <li>
            <Link href="/admin/staff" className="text-amber-400 underline">
              จัดการทีมงาน
            </Link>
            {" — ลิงก์ login / เพิ่ม-ปิด staff"}
          </li>
        </ul>
      </Section>

      <Section id="missing" title="ยังไม่มีในระบบ">
        <ul className="list-disc space-y-1 pl-5 text-zinc-500">
          <li>แจ้งเตือน LINE ก่อนถึงเวลานัด</li>
          <li>ลูกค้ายกเลิกผ่าน LINE</li>
          <li>Login ด้วย LINE ID</li>
          <li>รายงานรายได้</li>
        </ul>
      </Section>

      <Section id="feedback" title="ช่วยลอง + บอกความคิดเห็น">
        <ul className="list-disc space-y-1 pl-5">
          <li>จองคิว + ช่างกด Walk-in แล้วดูฝั่งลูกค้าอัปเดตไหม</li>
          <li>ตั้งวันหยุด + เวลาพัก แล้วลองจองช่วงนั้น</li>
          <li>ความยาวคิว 30/45/60 นาทีโอเคไหม?</li>
          <li>อยากได้แจ้งเตือน LINE ก่อนนัดกี่นาที?</li>
          <li>มีอะไรอยากได้เพิ่มอีก?</li>
        </ul>
        <p className="mt-3 text-zinc-500">เจอบั๊ก: แคปหน้าจอ + บอกว่าทำอะไรก่อนเกิด</p>
      </Section>

      <footer className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 text-center text-sm">
        <p className="font-semibold text-zinc-200">ลิงก์สำคัญ</p>
        <div className="mt-2 space-y-1 text-amber-400">
          <Link href="/" className="block underline">จองคิว</Link>
          <Link href="/saeb" className="block underline">/saeb</Link>
          <Link href="/tide" className="block underline">/tide</Link>
          <Link href="/nat" className="block underline">/nat</Link>
        </div>
      </footer>
    </article>
  );
}
