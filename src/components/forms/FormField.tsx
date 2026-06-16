type FormFieldProps = {
  label: string;
  name: string;
  type?: string;
  error?: string;
  children?: React.ReactNode;
  variant?: "light" | "dark";
};

export function FormField({
  label,
  name,
  type = "text",
  error,
  children,
  variant = "light",
}: FormFieldProps) {
  const isDark = variant === "dark";
  const inputClass = `mt-1.5 w-full border-b bg-transparent py-2.5 outline-none transition-colors ${
    isDark
      ? "border-ivory/20 text-ivory placeholder:text-ivory/40 focus:border-gold"
      : "border-charcoal/20 text-charcoal focus:border-gold"
  }`;

  return (
    <label className="block">
      <span
        className={`editorial-caption ${isDark ? "text-ivory/60" : ""}`}
      >
        {label}
      </span>
      {children ?? (
        <input type={type} name={name} className={inputClass} />
      )}
      {error && (
        <p
          className={`mt-2 flex items-center gap-1.5 text-[0.8rem] font-semibold ${
            isDark ? "text-[#f4b3aa]" : "text-burgundy"
          }`}
          role="alert"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3.5 w-3.5 shrink-0"
            aria-hidden
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
          {error}
        </p>
      )}
    </label>
  );
}
