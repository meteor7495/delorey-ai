export type StoreSettings = {
  storeName: string;
  storeSlug: string;
  primaryColor: string;
  secondaryColor: string;
  themeId?: string | null;
  logoUrl?: string | null;
  tagline?: string | null;
  supportPhone?: string | null;
  codEnabled?: boolean;
  onlinePaymentEnabled?: boolean;
};

export type StoreCategory = {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
};
