export function PainChatMockup({
  messages,
  footer,
}: {
  messages: string[];
  footer: string;
}) {
  return (
    <div
      aria-hidden="true"
      className="w-full max-w-md space-y-2.5 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 lg:justify-self-end"
    >
      {messages.map((text, i) => (
        <div key={i} className="flex flex-col items-start">
          <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-zinc-800 px-3 py-2 text-sm text-zinc-200">
            {text}
          </div>
        </div>
      ))}
      <p className="pt-1 text-[11px] text-zinc-500">{footer}</p>
    </div>
  );
}
