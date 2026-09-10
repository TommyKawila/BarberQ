const WIDTH = { sm: 220, md: 280, lg: 300, xl: 350 } as const;

export type PhoneSize = keyof typeof WIDTH;

export function PhoneFrame({
  size = "md",
  children,
  className,
}: {
  size?: PhoneSize;
  children: React.ReactNode;
  className?: string;
}) {
  const w = WIDTH[size];
  return (
    <div
      aria-hidden="true"
      style={{ width: w }}
      className={`shrink-0 rounded-[2rem] border-4 border-zinc-700 bg-zinc-900 p-2 shadow-2xl ${className ?? ""}`}
    >
      <div className="overflow-hidden rounded-[1.5rem] bg-zinc-950">{children}</div>
    </div>
  );
}
