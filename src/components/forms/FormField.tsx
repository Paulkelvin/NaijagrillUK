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
  const inputClass = `mt-3 w-full border-b bg-transparent py-3 outline-none transition-colors ${
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
        <p className="mt-2 text-sm text-burgundy" role="alert">
          {error}
        </p>
      )}
    </label>
  );
}
