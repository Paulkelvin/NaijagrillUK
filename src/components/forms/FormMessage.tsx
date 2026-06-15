type FormMessageProps = {
  success?: boolean;
  message: string;
};

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="m22 4-10 10.01-3-3" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4M12 16h.01" />
    </svg>
  );
}

export function FormMessage({ success, message }: FormMessageProps) {
  return (
    <div
      role={success ? "status" : "alert"}
      aria-live={success ? "polite" : "assertive"}
      className={`flex items-start gap-3 rounded-2xl px-4 py-3.5 text-sm font-medium leading-relaxed shadow-[0_10px_30px_rgba(22,15,11,0.12)] ${
        success
          ? "bg-gold text-charcoal"
          : "bg-burgundy text-ivory"
      }`}
    >
      <span className="mt-0.5 shrink-0">
        {success ? <CheckIcon /> : <AlertIcon />}
      </span>
      <span>{message}</span>
    </div>
  );
}
