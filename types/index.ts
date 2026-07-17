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
  imageId?: string;
  details?: CourseDetails;
  enabled: boolean;
};

export type CourseDetailItem = {
  nameEn: string;
  nameJa: string;
  descriptionEn?: string;
  descriptionJa?: string;
};

export type CourseDrinkGroup = {
  nameEn: string;
  nameJa: string;
  itemsEn: string[];
  itemsJa: string[];
};

export type CourseDetails = {
  menuItems: CourseDetailItem[];
  drinkGroups: CourseDrinkGroup[];
  premiumDrinkUpgrade?: {
    price: string;
    descriptionEn: string;
    descriptionJa: string;
    groups: CourseDrinkGroup[];
  };
  notesEn: string[];
  notesJa: string[];
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

export type ReservationStatus = "pending" | "confirmed" | "rejected" | "cancelled" | "completed" | "no_show";
export type SeatingPreference = "no_preference" | "table" | "booth";
export type ReservationOccasion = "none" | "birthday" | "anniversary" | "business" | "celebration" | "other";

export type ReservationRequest = {
  courseId: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  reservationDate: string;
  reservationTime: string;
  guestCount: number;
  seatingPreference: SeatingPreference;
  occasion: ReservationOccasion;
  allergies: string;
  specialRequests: string;
  preferredLanguage: Locale;
  agreement: true;
  submissionToken: string;
};

export type ReservationConfirmation = {
  reservationReference: string;
  courseId: string | null;
  customerName: string;
  reservationDate: string;
  reservationTime: string;
  guestCount: number;
  status: "pending";
};

export type OwnerReservation = {
  id: string;
  reservation_reference: string;
  course_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  reservation_date: string;
  reservation_time: string;
  guest_count: number;
  seating_preference: SeatingPreference;
  occasion: ReservationOccasion;
  allergies: string | null;
  special_requests: string | null;
  preferred_language: Locale;
  status: ReservationStatus;
  owner_notes: string | null;
  created_at: string;
  updated_at: string;
  confirmed_at: string | null;
  cancelled_at: string | null;
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
