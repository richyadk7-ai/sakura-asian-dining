export type Locale = "en" | "ja";
export type LocalePageProps = { params: Promise<{ locale: string }> };

export type MenuSection = "food" | "courses" | "drinks" | "lunch" | "photos";

export type MenuItem = {
  id: string;
  sourceOrder: number;
  section: Exclude<MenuSection, "courses" | "photos">;
  categoryEn: string;
  categoryJa: string;
  nameEn: string;
  nameJa: string;
  descriptionEn?: string;
  descriptionJa?: string;
  price?: string;
  image?: string;
  spicy?: boolean;
  vegetarian?: boolean;
  recommended?: boolean;
  enabled: boolean;
  kind?: "item" | "notice";
};

export type Course = {
  id: string;
  sourceOrder: number;
  nameEn: string;
  nameJa: string;
  summaryEn: string;
  summaryJa: string;
  price: string;
  previousPrice?: string;
  durationMinutes: number;
  itemCount?: number;
  allYouCanEat: boolean;
  allYouCanDrink: boolean;
  tabelogUrl: string;
  imageId?: string;
  enabled: boolean;
};

export type RestaurantPhotoCategory =
  | "food"
  | "drinks"
  | "interior"
  | "exterior"
  | "menu"
  | "course";

export type RestaurantPhoto = {
  id: string;
  src: string;
  altEn: string;
  altJa: string;
  category: RestaurantPhotoCategory;
  width: number;
  height: number;
  featured?: boolean;
  authorized: boolean;
  excluded?: boolean;
  blurDataUrl?: string;
};

export type ImageInventoryEntry = {
  referenceId: string;
  category: RestaurantPhotoCategory;
  sourceOrder: number;
  expectedFilename: string;
  localPath: string;
  suppliedFilename: string | null;
  authorizationConfirmed: boolean;
  status: "missing" | "imported" | "excluded";
  width: number | null;
  height: number | null;
  sha256: string | null;
  perceptualHash: string | null;
  reviewReason: string | null;
};

export type PhotoQualityResult = {
  file: string;
  flags: Array<"tiny" | "blurry" | "underexposed" | "corrupted">;
  included: boolean;
  reason?: string;
};

export type ReservationHandoff = {
  date: string;
  time: string;
  guests: number;
};

export type RestaurantInfo = {
  nameEn: string;
  nameJa: string;
  addressJa: string;
  addressEn: string;
  reservationPhone: string;
  directPhone: string;
  lunchHours: string;
  dinnerHours: string;
  closed: string;
  stationWalkMinutes: number;
  seats: number;
  lastVerified: string;
};

export type ContentDocument<T = unknown> = {
  id: "restaurant" | "menu" | "courses" | "pages";
  payload: T;
  updatedAt?: string;
  publishedAt?: string;
};
