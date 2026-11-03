import { describe, expect, it } from "vitest";
import { formatUkPhone } from "./PhoneInput";

describe("formatUkPhone", () => {
  it("formats mobiles as 5-6", () => {
    expect(formatUkPhone("07438757560")).toBe("07438 757560");
  });

  it("formats 02 area codes as 3-4-4", () => {
    expect(formatUkPhone("02079460018")).toBe("020 7946 0018");
  });

  it("formats city and non-geographic numbers as 4-3-4", () => {
    expect(formatUkPhone("01212345678")).toBe("0121 234 5678");
    expect(formatUkPhone("08001234567")).toBe("0800 123 4567");
  });

  it("converts a +44 prefix to 0", () => {
    expect(formatUkPhone("+44 7438 757560")).toBe("07438 757560");
  });

  it("formats partial input as it is typed", () => {
    expect(formatUkPhone("")).toBe("");
    expect(formatUkPhone("0743")).toBe("0743");
    expect(formatUkPhone("074387")).toBe("07438 7");
    expect(formatUkPhone("02079")).toBe("020 79");
  });

  it("strips non-digits and caps at 11 digits", () => {
    expect(formatUkPhone("07438-757560999")).toBe("07438 757560");
  });
});
