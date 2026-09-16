"use client";

import { useState, type InputHTMLAttributes } from "react";

/**
 * Formats a raw string into UK phone format as the user types.
 *
 * Domestic (leading 0, 11 digits total): mobiles (07xxx xxxxxx) get the
 * 5+6 grouping actually used for them; other numbers (landlines, whose
 * area-code length varies by region) get the generic 4+3+4 grouping UK
 * forms commonly fall back to:
 *   "07438757560"  -> "07438 757560"
 *   "01212160249"  -> "0121 216 0249"
 *
 * International (typed with a leading "+" or "44"/"0044" country code —
 * the trunk 0 is dropped, per how "+44" numbers are actually written):
 *   "+447935252534"   -> "+44 7935 252534"
 *   "447935252534"    -> "+44 7935 252534"
 *   "+441214960000"   -> "+44 121 496 0000"
 * A redundant leading 0 typed after the country code by habit (e.g.
 * "+44 07935 ...") is dropped rather than kept as part of the number.
 */
export function formatUkPhone(value: string): string {
  const hasPlus = value.trim().startsWith("+");
  const rawDigits = value.replace(/\D/g, "");
  const digits = rawDigits.startsWith("0044") ? rawDigits.slice(2) : rawDigits;
  const isInternational = hasPlus || digits.startsWith("44");

  if (isInternational) {
    let subscriber = digits.startsWith("44") ? digits.slice(2) : digits;
    if (subscriber.startsWith("0")) subscriber = subscriber.slice(1);
    subscriber = subscriber.slice(0, 10);

    if (subscriber.length === 0) return "+44";
    if (subscriber.startsWith("7")) {
      return subscriber.length <= 4
        ? `+44 ${subscriber}`
        : `+44 ${subscriber.slice(0, 4)} ${subscriber.slice(4)}`;
    }
    if (subscriber.length <= 3) return `+44 ${subscriber}`;
    if (subscriber.length <= 6) return `+44 ${subscriber.slice(0, 3)} ${subscriber.slice(3)}`;
    return `+44 ${subscriber.slice(0, 3)} ${subscriber.slice(3, 6)} ${subscriber.slice(6)}`;
  }

  const local = digits.slice(0, 11);
  const { length } = local;
  if (length === 0) return "";
  if (local.startsWith("07")) {
    if (length <= 5) return local;
    return `${local.slice(0, 5)} ${local.slice(5)}`;
  }
  if (length <= 4) return local;
  if (length <= 7) return `${local.slice(0, 4)} ${local.slice(4)}`;
  return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`;
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
      inputMode="tel"
      autoComplete="tel"
      placeholder={placeholder}
      value={value}
      onChange={(event) => setValue(formatUkPhone(event.target.value))}
      onKeyDown={(event) => {
        // Block obvious letter/symbol entry; allow control & navigation keys
        // and "+" for a leading country code.
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
