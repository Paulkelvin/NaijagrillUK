type FormMessageProps = {
  success?: boolean;
  message: string;
};

export function FormMessage({ success, message }: FormMessageProps) {
  return (
    <p
      role="status"
      className={`text-sm leading-relaxed ${
        success ? "text-charcoal" : "text-burgundy"
      }`}
    >
      {message}
    </p>
  );
}
