export interface Tenant {
  id?: number;
  slug: string;
  tenant?: string;
  name?: string;
  brand_name: string;
  legal_name: string;
  tax_id: string;
  contact_phone: string;
  contact_email: string;
  address: string;
  country: string;
  industry: string;
  website: string;
  logo_url?: string;
  logo_light_url: string;
  logo_dark_url: string;
  primary_color: string;
  accent_color: string;
  favicon_url: string;
  terms_url: string | null;
  privacy_url: string | null;
  active: boolean;
}
