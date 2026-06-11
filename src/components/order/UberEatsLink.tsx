import type { ComponentProps, ReactNode } from "react";
import { TrackedOutboundLink } from "@/components/analytics/TrackedOutboundLink";
import { BUSINESS } from "@/lib/business";

type UberEatsLinkProps = Omit<
  ComponentProps<typeof TrackedOutboundLink>,
  "href" | "eventName" | "eventLabel" | "children"
> & {
  label: string;
  children: ReactNode;
};

export function UberEatsLink({
  label,
  children,
  ...props
}: UberEatsLinkProps) {
  return (
    <TrackedOutboundLink
      href={BUSINESS.order.uberEatsUrl}
      eventName="uber_eats_click"
      eventLabel={label}
      {...props}
    >
      {children}
    </TrackedOutboundLink>
  );
}
