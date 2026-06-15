"use client";

import { useState, type InputHTMLAttributes } from "react";

/**
 * Formats a raw string into US phone format as the user types:
 *   ""            -> ""
 *   "5"           -> "(5"
 *   "555"         -> "(555"
 *   "5551"        -> "(555) 1"
 *   "5551234"     -> "(555) 123-4"
 *   "5551234567"  -> "(555) 123-4567"
 * Non-digits are stripped and the number is capped at 10 digits.
 */
export function formatUsPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  const { length } = digits;

  if (length === 0) return "";
  if (length < 4) return `(${digits}`;
  if (length < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

type PhoneInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "type" | "inputMode"
> & {
  name: string;
  defaultValue?: string;
};

export function PhoneInput({
  name,
  defaultValue = "",
  placeholder = "(555) 123-4567",
  ...props
}: PhoneInputProps) {
  const [value, setValue] = useState(() => formatUsPhone(defaultValue));

  return (
    <input
      {...props}
      name={name}
      type="tel"
      inputMode="numeric"
      autoComplete="tel"
      placeholder={placeholder}
      value={value}
      onChange={(event) => setValue(formatUsPhone(event.target.value))}
      onKeyDown={(event) => {
        // Block obvious letter/symbol entry; allow control & navigation keys.
        if (
          event.key.length === 1 &&
          !event.metaKey &&
          !event.ctrlKey &&
          !/[0-9]/.test(event.key)
        ) {
          event.preventDefault();
        }
      }}
    />
  );
}
