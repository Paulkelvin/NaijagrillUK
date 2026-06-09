import type { ContactInfoData } from "@/sanity/types";
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
          <p className="editorial-caption mb-3">Telephone</p>
          <a
            href={`tel:${contact.phone.replace(/\s/g, "")}`}
            className="text-charcoal transition-colors hover:text-gold"
          >
            {contact.phone}
          </a>
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
