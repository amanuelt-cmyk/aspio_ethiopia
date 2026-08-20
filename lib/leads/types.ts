export type LeadKind = "demo" | "contact";

export type LeadSource =
  | "ethiopia-registration"
  | "ethiopia-contact"
  | "ethiopia-business";

export type LeadPayload = {
  kind: LeadKind;
  source: LeadSource;
  name: string;
  email: string;
  phone: string;
  businessName?: string;
  message?: string;
  locale?: string;
  website?: string;
};

export type LeadRecord = Omit<LeadPayload, "website"> & {
  id: string;
  submittedAt: string;
};

export type LeadDeliveryResult = {
  emailId: string;
  crmSynced: boolean;
};
