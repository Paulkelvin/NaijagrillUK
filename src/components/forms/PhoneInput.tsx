"use client";

import { useState, type InputHTMLAttributes } from "react";

/**
 * Formats a raw string into UK phone format as the user types:
 *   "07438757560"   -> "07438 757560"   (mobiles and most 01 area codes)
 *   "02079460018"   -> "020 7946 0018"  (02 area codes)
 *   "01212345678"   -> "0121 234 5678"  (011x/01x1 cities, 03/08/09 numbers)
 *   "+447438757560" -> "07438 757560"   (international prefix converted)
 * Non-digits are stripped and the number is capped at 11 digits.
 */
export function formatUkPhone(value: string): string {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("44")) digits = `0${digits.slice(2)}`;
  digits = digits.slice(0, 11);

  const groups = /^02/.test(digits)
    ? [3, 4]
    : /^(01\d1|011|0[389])/.test(digits)
      ? [4, 3]
      : [5];

  const parts: string[] = [];
  let rest = digits;
  for (const size of groups) {
    if (rest.length <= size) break;
    parts.push(rest.slice(0, size));
    rest = rest.slice(size);
  }
  if (rest) parts.push(rest);
  return parts.join(" ");
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
  placeholder = "07123 456789",
  ...props
}: PhoneInputProps) {
  const [value, setValue] = useState(() => formatUkPhone(defaultValue));

  return (
    <input
      {...props}
      name={name}
      type="tel"
      inputMode="tel"
      autoComplete="tel"
      placeholder={placeholder}
      value={value}
      onChange={(event) => setValue(formatUkPhone(event.target.value))}
      onKeyDown={(event) => {
        // Block obvious letter/symbol entry; allow "+" for +44 and control keys.
        if (
          event.key.length === 1 &&
          !event.metaKey &&
          !event.ctrlKey &&
          !/[0-9+]/.test(event.key)
        ) {
          event.preventDefault();
        }
      }}
    />
  );
}
