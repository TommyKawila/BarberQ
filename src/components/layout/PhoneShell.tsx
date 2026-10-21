/**
 * Content shell widths (AD-06):
 * - mobile: full width up to max-w-lg
 * - tablet 768–1023: centred max-width 640
 * - desktop ≥1024: full width (AdminShell adds side nav + columns)
 */
export function PhoneShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-full w-full max-w-lg pb-[env(safe-area-inset-bottom)] md:max-w-[640px] lg:max-w-none lg:px-0">
      {children}
    </div>
  );
}
