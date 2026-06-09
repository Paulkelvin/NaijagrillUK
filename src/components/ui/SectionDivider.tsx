export function SectionDivider({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex items-center justify-center gap-6 py-2 ${className}`}
      aria-hidden
    >
      <span className="h-px w-16 bg-gold/40" />
      <span className="h-1 w-1 rotate-45 bg-gold/60" />
      <span className="h-px w-16 bg-gold/40" />
    </div>
  );
}
