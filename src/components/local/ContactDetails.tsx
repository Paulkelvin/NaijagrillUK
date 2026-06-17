import type { ContactInfoData } from "@/sanity/types";
import { CopyablePhoneLink } from "@/components/ui/CopyablePhoneLink";
import { Address } from "./Address";

type ContactDetailsProps = {
  contact: ContactInfoData;
  showLocationNote?: boolean;
  className?: string;
};

export function ContactDetails({
  contact,
  showLocationNote = false,
  className = "",
}: ContactDetailsProps) {
  return (
    <div className={`space-y-8 text-lg leading-relaxed text-stone ${className}`}>
      <div>
        <p className="editorial-caption mb-3">Email</p>
        <a
          href={`mailto:${contact.email}`}
          className="text-charcoal transition-colors hover:text-gold"
        >
          {contact.email}
        </a>
      </div>
      {contact.phone && (
        <div>
          <p className="editorial-caption mb-3">Mobile</p>
          <CopyablePhoneLink
            phone={contact.phone}
            href={`tel:${contact.phone.replace(/\s/g, "")}`}
            linkClassName="text-charcoal transition-colors hover:text-gold"
          />
        </div>
      )}
      {contact.landline && (
        <div>
          <p className="editorial-caption mb-3">Landline</p>
          <CopyablePhoneLink
            phone={contact.landline}
            href={`tel:${contact.landline.replace(/\s/g, "")}`}
            linkClassName="text-charcoal transition-colors hover:text-gold"
          />
        </div>
      )}
      <div>
        <p className="editorial-caption mb-3">Address</p>
        <Address contact={contact} className="text-stone" />
      </div>
      {showLocationNote && contact.locationNote && (
        <p className="max-w-xl text-base leading-[1.8]">{contact.locationNote}</p>
      )}
    </div>
  );
}
