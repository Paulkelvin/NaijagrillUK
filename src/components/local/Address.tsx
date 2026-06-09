import { formattedAddress } from "@/lib/business";
import type { ContactInfoData } from "@/sanity/types";

type AddressProps = {
  contact?: ContactInfoData;
  className?: string;
};

export function Address({ contact, className = "" }: AddressProps) {
  return (
    <address className={`not-italic ${className}`}>
      {contact ? (
        <>
          <p>{contact.street}</p>
          <p>{contact.area}</p>
          <p>
            {contact.city}, {contact.postcode}
          </p>
          <p>{contact.country}</p>
        </>
      ) : (
        <p>{formattedAddress}</p>
      )}
    </address>
  );
}
