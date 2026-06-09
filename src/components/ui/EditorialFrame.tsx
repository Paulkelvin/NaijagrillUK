import type { ReactNode } from "react";

type EditorialFrameProps = {
  children: ReactNode;
  variant?: "light" | "dark";
  className?: string;
};

export function EditorialFrame({
  children,
  variant = "light",
  className = "",
}: EditorialFrameProps) {
  const accent =
    variant === "dark"
      ? "border-ivory/20 before:bg-gold/30"
      : "border-charcoal/10 before:bg-gold/50";

  return (
    <div
      className={`relative before:absolute before:-left-3 before:top-6 before:h-12 before:w-px md:before:-left-4 md:before:top-8 md:before:h-16 ${accent} ${className}`}
    >
      <div className={`relative overflow-hidden ${className}`}>{children}</div>
    </div>
  );
}
