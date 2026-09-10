export function PainChatMockup({
  customerLabel,
  shopLabel,
  messages,
}: {
  customerLabel: string;
  shopLabel: string;
  messages: { from: "customer" | "shop"; text: string }[];
}) {
  return (
    <div aria-hidden="true" className="w-full max-w-md space-y-2.5 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
      {messages.map((m, i) => {
        const isCustomer = m.from === "customer";
        return (
          <div key={i} className={`flex flex-col ${isCustomer ? "items-start" : "items-end"}`}>
            <span className="mb-0.5 text-[10px] text-zinc-500">
              {isCustomer ? customerLabel : shopLabel}
            </span>
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                isCustomer
                  ? "rounded-tl-sm bg-zinc-800 text-zinc-200"
                  : "rounded-tr-sm bg-zinc-700 text-zinc-100"
              }`}
            >
              {m.text}
            </div>
          </div>
        );
      })}
    </div>
  );
}
