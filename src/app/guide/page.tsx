import Link from "next/link";

const QUICK_LINKS = [
  { href: "/phinxstudio", label: "จองคิว (ลูกค้า)", accent: "bg-amber-400 text-zinc-950" },
  { href: "/phinxstudio/admin", label: "Admin", accent: "bg-zinc-800 text-zinc-100" },
  { href: "/phinxstudio/bookings", label: "คิวของฉัน", accent: "bg-blue-600 text-zinc-100" },
  { href: "/superadmin", label: "Super Admin", accent: "bg-purple-700 text-zinc-100" },
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
          ระบบจองคิวตัดผม Multi-Shop + Line Login + บอร์ดช่าง + สรุปคิว + Super Admin Dashboard
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
          ["#line-login", "Line Login"],
          ["#my-bookings", "คิวของฉัน"],
          ["#admin", "Admin"],
          ["#owner", "เจ้าของร้าน"],
          ["#board", "บอร์ด"],
          ["#stats", "สรุปคิว"],
          ["#schedule", "ตารางเวลา"],
          ["#superadmin", "Super Admin"],
          ["#multi-shop", "Multi-Shop"],
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
        <p>เปิดหน้าร้าน เช่น <Link href="/phinxstudio" className="text-amber-400 underline">/phinxstudio</Link></p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>เข้าสู่ระบบด้วย LINE (ครั้งแรก)</li>
          <li>เลือกช่าง</li>
          <li>เลือกวันที่ (จองล่วงหน้าได้ 7 วัน)</li>
          <li>เลือกเวลาที่ว่าง</li>
          <li>กรอกชื่อ + เบอร์โทร (ครั้งแรก หรือต้องการแก้ไข)</li>
          <li>กดยืนยัน</li>
        </ol>
        <p className="rounded-xl bg-zinc-900 p-3 text-zinc-400">
          <strong className="text-zinc-200">เวลาเปิดร้าน:</strong> จ–ศ 10:30–20:00 · ส–อา 10:00–20:00
          <br />
          <strong className="text-zinc-200">ยกเลิก:</strong> ต้องกดก่อนเวลานัดอย่างน้อย 60 นาที
          (หน้า &quot;คิวของฉัน&quot; หรือลิงก์ /c/…) เลยแล้วให้ติดต่อร้านทาง LINE หรือโทร
          <br />
          <strong className="text-zinc-200">มาสาย:</strong> ได้ไม่เกิน 10 นาที — ร้านจะโทรก่อน ค่อยปล่อยคิว
          <br />
          สลับภาษาไทย/อังกฤษได้ที่ header
        </p>
      </Section>

      <Section id="line-login" title="2) Line Login สำหรับลูกค้า">
        <p>ระบบใช้ LINE Login (LIFF) เพื่อระบุตัวตนลูกค้า:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>เปิดลิงก์ร้านผ่านมือถือ ระบบจะขอให้เข้าสู่ระบบด้วย LINE</li>
          <li>หลังเข้าสู่ระบบแล้ว จะเห็น &quot;สวัสดี, ชื่อของคุณ&quot; ที่ header พร้อมรูปโปรไฟล์</li>
          <li>จองได้หลายคิว และดูคิวทั้งหมดได้ที่ &quot;คิวของฉัน&quot;</li>
          <li>คิวของคุณจะเชื่อมกับ LINE ID ของคุณ ไม่หายแม้เปลี่ยนเครื่อง</li>
        </ul>
        <p className="text-zinc-500">
          หมายเหตุ: ใน prototype mode (local dev) ระบบจะข้ามขั้นตอน Line Login
        </p>
      </Section>

      <Section id="my-bookings" title="3) คิวของฉัน — จัดการคิวจอง">
        <p>กดปุ่ม <Link href="/phinxstudio/bookings" className="text-amber-400 underline">คิวของฉัน</Link> จาก header</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>ดูคิวที่จองไว้ทั้งหมด (ทุกช่าง ทุกร้าน)</li>
          <li>แสดงวันที่ เวลา ชื่อช่าง และสถานะคิว</li>
          <li>กดยกเลิกคิวได้ (หากยังไม่เกิน 60 นาทีก่อนเวลานัด)</li>
          <li>เลยเวลายกเลิกแล้ว จะเห็นปุ่มติดต่อร้านแทน (LINE / โทร)</li>
        </ul>
        <p className="text-zinc-500">
          คิวที่ผ่านมาแล้วจะแสดงอยู่ด้านล่าง เพื่อเป็นประวัติ
        </p>
      </Section>

      <Section id="admin" title="4) ฝั่ง Owner / Barber — เข้า Admin">
        <p>เปิดหน้า Admin ของร้าน เช่น <Link href="/phinxstudio/admin" className="text-amber-400 underline">/phinxstudio/admin</Link></p>
        <ul className="list-disc space-y-1 pl-5">
          <li>เข้าสู่ระบบด้วย LINE (Owner หรือ Barber ที่ถูกเพิ่มแล้ว)</li>
          <li>Owner: จัดการทุกอย่าง (บอร์ด ทุกช่าง, ตั้งค่า, เพิ่ม/ลบช่าง, สรุปคิว)</li>
          <li>Barber: จัดการเฉพาะคอลัมน์ตัวเอง บนบอร์ด และสรุปคิวตัวเอง</li>
        </ul>
        <p className="text-zinc-500">
          ระบบเก่า (token-based): ยังใช้ได้สำหรับ barbers ที่ยังไม่ได้ผูก Line ID
        </p>
      </Section>

      <Section id="owner" title="5) เจ้าของร้าน — Owner">
        <p>Owner สามารถทำได้ทั้งหมด:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <Link href="/phinxstudio/admin/settings" className="text-amber-400 underline">
              ตั้งค่า
            </Link>
            {" — ชื่อร้าน, โลโก้, LINE ร้าน, เบอร์โทรร้าน"}
          </li>
          <li>
            <Link href="/phinxstudio/admin/staff" className="text-amber-400 underline">
              จัดการทีมงาน
            </Link>
            {" — เพิ่ม Barber ใหม่ (ผูกด้วย Line ID) หรือปิดการใช้งาน"}
          </li>
          <li>
            ดูบอร์ดของทุกช่าง และแก้ไขได้ทุกคอลัมน์
          </li>
          <li>
            <Link href="/phinxstudio/admin/stats" className="text-amber-400 underline">
              สรุปคิว
            </Link>
            {" — ดูสถิติทุกช่าง"}
          </li>
        </ul>
        <p className="text-zinc-500">
          การเป็น Owner: รับลิงก์เชิญจาก Super Admin → กดลิงก์ → เข้าสู่ระบบด้วย LINE → เป็น Owner
        </p>
      </Section>

      <Section id="board" title="6) บอร์ดวันนี้">
        <p>กดช่องว่างเพื่อบล็อก/ปล่อย Walk-in · ใช้ Date Picker เลือกดูวันอื่นได้</p>
        <div className="space-y-2 rounded-xl bg-zinc-900 p-3">
          <LegendRow color="bg-emerald-700" label="ว่าง — ลูกค้าจองได้" />
          <LegendRow color="bg-red-600" label="Walk-in / พัก — ช่างบล็อกไว้" />
          <LegendRow color="bg-sky-700" label="จองแล้ว — เห็นชื่อลูกค้า + Line ID" />
          <LegendRow color="bg-yellow-500" label="เลท — เลยนัด 10 นาที กดโทร + กดโทรแล้ว" />
          <LegendRow color="bg-green-600" label="เสร็จแล้ว — กดหลังเวลาจบคิว" />
          <LegendRow color="bg-orange-700" label="ไม่มา — ปล่อยช่องให้ Walk-in ได้" />
        </div>
        <p>
          คิวที่เลยเวลาแล้วจะมีปุ่ม <strong className="text-zinc-200">เสร็จ / ไม่มา</strong>
          <br />
          เลทเกิน 10 นาที: กดเบอร์โทรลูกค้าก่อน แล้วกด &quot;โทรแล้ว&quot; ถ้าไม่มาค่อยกดไม่มา
          <br />
          Owner สามารถ <strong className="text-zinc-200">กดยกเลิกคิว</strong> จากบอร์ดได้โดยตรง
        </p>
        <p>
          <strong className="text-zinc-200">Barber:</strong> แก้ได้เฉพาะคอลัมน์ตัวเอง
          <br />
          <strong className="text-zinc-200">Owner:</strong> แก้ได้ทุกคอลัมน์
        </p>
        <p className="text-zinc-500">บอร์ดรีเฟรชอัตโนมัติทุก 10 วินาที (หยุดตอนสลับแอป)</p>
      </Section>

      <Section id="stats" title="7) สรุปคิว">
        <p>
          จากบอร์ดกด <Link href="/phinxstudio/admin/stats" className="text-amber-400 underline">สรุปคิว</Link>
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>สลับวันนี้ / สัปดาห์ / เดือน</li>
          <li>ดูจำนวนลูกค้า จอง ยกเลิก ใช้บริการจริง ไม่มา</li>
          <li>ชาร์ตรายชั่วโมง และช่วงที่บล็อก Walk-in</li>
        </ul>
        <p className="text-zinc-500">
          Barber เห็นแค่คิวตัวเอง · Owner เห็นทุกช่าง
        </p>
      </Section>

      <Section id="schedule" title="8) ตารางเวลาของฉัน">
        <p>กด <Link href="/phinxstudio/admin/my-schedule" className="text-amber-400 underline">ตารางเวลาของฉัน</Link> จากบอร์ด Admin</p>
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

      <Section id="superadmin" title="9) Super Admin Dashboard">
        <p>
          เข้า <Link href="/superadmin" className="text-amber-400 underline">/superadmin</Link> ด้วย SUPERADMIN_TOKEN
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>ดูรายชื่อร้านทั้งหมด (PHINX STUDIO, TEST SHOP, etc.)</li>
          <li>สร้างร้านใหม่ — ใส่ชื่อร้าน, Line ID ของ Owner (ถ้ามี), จำนวนเดือน subscription</li>
          <li>ไม่ใส่ Line ID → ระบบจะสร้าง Invite Link ส่งให้ Owner กดเพื่อเป็นเจ้าของร้าน</li>
          <li>สถานะร้าน: <strong className="text-amber-400">active</strong> (ใช้งานได้), <strong className="text-purple-400">pending</strong> (รอเจ้าของร้านกดลิงก์เชิญ)</li>
        </ul>
        <p className="text-zinc-500">
          Invite Link: Owner กดลิงก์ → เข้าสู่ระบบด้วย LINE → กลายเป็น Owner ของร้าน
        </p>
      </Section>

      <Section id="multi-shop" title="10) ระบบ Multi-Shop">
        <p>ระบบรองรับหลายร้านได้แล้ว แต่ละร้านมี URL เฉพาะตัว:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong className="text-zinc-200">PHINX STUDIO:</strong>{" "}
            <Link href="/phinxstudio" className="text-amber-400 underline">
              /phinxstudio
            </Link>
          </li>
          <li>
            <strong className="text-zinc-200">TEST SHOP:</strong>{" "}
            <Link href="/testshop" className="text-amber-400 underline">
              /testshop
            </Link>
          </li>
        </ul>
        <p>แต่ละร้านมี:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Owner และ Barbers แยกกัน</li>
          <li>ตั้งค่าร้านแยกกัน (โลโก้, ชื่อ, LINE, เบอร์โทร)</li>
          <li>บอร์ด, สรุปคิว, ลูกค้า แยกกัน</li>
        </ul>
        <p className="rounded-xl bg-zinc-900 p-3 text-zinc-400">
          <strong className="text-zinc-200">สำหรับ Owner:</strong> หลังจากได้รับ Invite Link จาก Super Admin แล้ว
          <br />
          1. กดลิงก์เชิญ → 2. เข้าสู่ระบบด้วย LINE → 3. กลายเป็น Owner ของร้าน → 4. เข้า /[slug]/admin
        </p>
      </Section>

      <Section id="new-features" title="✨ ฟีเจอร์ใหม่ที่เพิ่มมา">
        <ul className="list-disc space-y-1 pl-5 text-emerald-400">
          <li>✅ Line Login สำหรับลูกค้า (LIFF) — ระบุตัวตน จองได้หลายคิว</li>
          <li>✅ หน้า &quot;คิวของฉัน&quot; — ดูและยกเลิกคิวทั้งหมด</li>
          <li>✅ Line Login สำหรับ Owner / Barber — ไม่ต้องใช้ token</li>
          <li>✅ Super Admin Dashboard — สร้างร้าน, Invite Link สำหรับ Owner</li>
          <li>✅ ระบบ Multi-Shop — แต่ละร้านมี URL เฉพาะ (เช่น /phinxstudio)</li>
          <li>✅ Date Picker ในบอร์ด Admin — เลือกดูวันอื่นได้</li>
          <li>✅ Staff Cancellation — Owner ยกเลิกคิวจากบอร์ดได้</li>
          <li>✅ แสดง Line ID ของลูกค้าในบอร์ด Admin</li>
          <li>✅ แสดงชื่อและรูปโปรไฟล์ลูกค้าที่ header หลัง login</li>
        </ul>
      </Section>

      <Section id="missing" title="🚧 ยังไม่มีในระบบ (Roadmap)">
        <ul className="list-disc space-y-1 pl-5 text-zinc-500">
          <li>แจ้งเตือน LINE อัตโนมัติ 30 นาทีก่อนคิว (Phase 2: Line OA Integration)</li>
          <li>ปุ่มยกเลิกในแชท LINE (ตอนนี้ยกเลิกได้ที่เว็บ + ลิงก์ /c/…)</li>
          <li>จองหลายคิวให้เพื่อนในครั้งเดียว (ตอนนี้จองได้ทีละคิว)</li>
          <li>ระบบ Subscription และ Payment (เริ่มจาก Pilot: PHINX STUDIO)</li>
        </ul>
      </Section>

      <Section id="feedback" title="📝 ทดสอบและ Feedback">
        <p>กรุณาช่วยทดสอบ:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Line Login — เข้าสู่ระบบได้ไหม เห็นชื่อและรูปที่ header ไหม</li>
          <li>จองคิวหลายคิว — เห็นครบใน &quot;คิวของฉัน&quot; ไหม</li>
          <li>ยกเลิกคิวก่อน/หลัง 60 นาที — ปุ่มเปลี่ยนเป็น &quot;ติดต่อร้าน&quot; ไหม</li>
          <li>Owner กด Walk-in / เสร็จ / ไม่มา — สรุปคิวอัปเดตไหม</li>
          <li>Barber เห็นแค่คอลัมน์ตัวเอง Owner เห็นทุกคอลัมน์ ใช่ไหม</li>
          <li>Date Picker — เลือกดูวันอื่นได้ไหม</li>
          <li>Multi-Shop — แต่ละร้านข้อมูลแยกกันไหม</li>
        </ul>
        <p className="mt-3 text-zinc-500">เจอบั๊ก: แคปหน้าจอ + บอกว่าทำอะไรก่อนเกิด</p>
      </Section>

      <footer className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 text-center text-sm">
        <p className="font-semibold text-zinc-200">ลิงก์สำคัญ</p>
        <div className="mt-2 space-y-1 text-amber-400">
          <Link href="/phinxstudio" className="block underline">PHINX STUDIO — จองคิว</Link>
          <Link href="/phinxstudio/bookings" className="block underline">คิวของฉัน</Link>
          <Link href="/phinxstudio/admin" className="block underline">Admin</Link>
          <Link href="/phinxstudio/admin/stats" className="block underline">สรุปคิว</Link>
          <Link href="/superadmin" className="block underline">Super Admin</Link>
        </div>
        <p className="mt-3 text-zinc-500 text-xs">
          ระบบ Multi-Shop · Line Login · Owner/Barber Roles · Date Picker · Staff Cancellation
        </p>
      </footer>
    </article>
  );
}
