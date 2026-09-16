"use client";

import { useState, type InputHTMLAttributes } from "react";

/**
 * Formats a raw string into UK phone format as the user types. UK numbers
 * are 11 digits (national significant number including the leading 0).
 * Mobiles (07xxx xxxxxx) get the 5+6 grouping actually used for them; other
 * numbers (landlines, whose area-code length varies by region) get the
 * generic 4+3+4 grouping UK forms commonly fall back to:
 *   ""             -> ""
 *   "07438"        -> "07438"
 *   "07438757560"  -> "07438 757560"
 *   "01212160249"  -> "0121 216 0249"
 * Non-digits are stripped and the number is capped at 11 digits.
 */
export function formatUkPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  const { length } = digits;

  if (length === 0) return "";
  if (digits.startsWith("07")) {
    if (length <= 5) return digits;
    return `${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  if (length <= 4) return digits;
  if (length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
  return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
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
  placeholder = "07700 900000",
  ...props
}: PhoneInputProps) {
  const [value, setValue] = useState(() => formatUkPhone(defaultValue));

  return (
    <input
      {...props}
      name={name}
      type="tel"
      inputMode="numeric"
      autoComplete="tel"
      placeholder={placeholder}
      value={value}
      onChange={(event) => setValue(formatUkPhone(event.target.value))}
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
