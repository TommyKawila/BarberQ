export function PhoneShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-full w-full max-w-lg pb-[env(safe-area-inset-bottom)]">
      {children}
    </div>
  );
}
