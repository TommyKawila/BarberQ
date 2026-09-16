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
      className="w-full max-w-md space-y-2.5 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 lg:justify-self-end lg:space-y-4 lg:p-5"
    >
      {messages.map((text, i) => {
        const featured = i === 0 || i === 3;
        return (
          <div key={i} className="flex flex-col items-start">
            <div
              className={`max-w-[85%] rounded-2xl rounded-tl-sm bg-zinc-800 px-3 py-2 text-sm text-zinc-200${
                featured
                  ? " lg:max-w-[92%] lg:border lg:border-amber-500/20 lg:px-3.5 lg:py-2.5 lg:text-base lg:font-medium lg:text-zinc-50"
                  : ""
              }`}
            >
              {text}
            </div>
          </div>
        );
      })}
      <p className="pt-1 text-[11px] text-zinc-500">{footer}</p>
    </div>
  );
}
