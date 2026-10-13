const WIDTH = { sm: 220, md: 280, lg: 300, xl: 350 } as const;

export type PhoneSize = keyof typeof WIDTH;

/** Shared modern iPhone bezel (Dynamic Island) — identical size/shape everywhere. */
export function PhoneFrame({
  size = "md",
  width,
  fluid,
  children,
  className,
}: {
  size?: PhoneSize;
  width?: number;
  fluid?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const fixedW = width ?? WIDTH[size];

  return (
    <div
      aria-hidden="true"
      style={fluid ? undefined : { width: fixedW }}
      className={`relative box-border min-w-0 ${
        fluid ? "w-full max-w-full" : "shrink-0"
      } ${className ?? ""}`}
    >
      <div
        className="relative mx-auto w-full overflow-hidden bg-[#1c1c1e] shadow-[0_18px_40px_rgba(0,0,0,0.45)]"
        style={{
          aspectRatio: "390 / 844",
          borderRadius: "14.5% / 6.7%",
          padding: "1.6%",
          boxShadow:
            "inset 0 0 0 1.5px #3a3a3c, inset 0 0 0 3px #0a0a0a, 0 18px 40px rgba(0,0,0,0.45)",
        }}
      >
        {/* Side buttons (visual only) */}
        <span
          className="pointer-events-none absolute -left-[1.5%] top-[18%] h-[7%] w-[1.5%] rounded-l-sm bg-[#2c2c2e]"
          aria-hidden
        />
        <span
          className="pointer-events-none absolute -left-[1.5%] top-[28%] h-[11%] w-[1.5%] rounded-l-sm bg-[#2c2c2e]"
          aria-hidden
        />
        <span
          className="pointer-events-none absolute -left-[1.5%] top-[41%] h-[11%] w-[1.5%] rounded-l-sm bg-[#2c2c2e]"
          aria-hidden
        />
        <span
          className="pointer-events-none absolute -right-[1.5%] top-[30%] h-[14%] w-[1.5%] rounded-r-sm bg-[#2c2c2e]"
          aria-hidden
        />

        <div
          className="relative h-full w-full overflow-hidden bg-zinc-950"
          style={{ borderRadius: "12.8% / 5.9%" }}
        >
          {/* Dynamic Island */}
          <div
            className="pointer-events-none absolute left-1/2 top-[1.6%] z-20 -translate-x-1/2 bg-black"
            style={{
              width: "32%",
              height: "3.4%",
              borderRadius: "999px",
            }}
            aria-hidden
          >
            <span
              className="absolute right-[14%] top-1/2 h-[45%] w-[12%] -translate-y-1/2 rounded-full bg-[#1a1a1c]"
              aria-hidden
            />
          </div>

          <div className="absolute inset-0 overflow-hidden">{children}</div>
        </div>
      </div>
    </div>
  );
}
