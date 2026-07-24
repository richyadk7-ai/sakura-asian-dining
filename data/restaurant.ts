import type { RestaurantInfo } from "@/types";

export const restaurantConfig = {
  canonicalUrl: "https://sakuradining.co",
  canonicalHost: "sakuradining.co",
  timeZone: "Asia/Tokyo",
  lastVerified: "2026-07-17",
  identity: {
    nameEn: "Sakura Asian Dining & Bar",
    nameJa: "さくらアジアンダイニング&バー",
  },
  contact: {
    reservationPhone: "050-5571-3032",
    directPhone: "090-8402-8144",
    decisionEmailSender: "richyadk7@gmail.com",
  },
  location: {
    addressJa: "東京都新宿区高田馬場3-22-5 相沢ビル",
    addressEn: "Aizawa Building, 3-22-5 Takadanobaba, Shinjuku-ku, Tokyo",
    streetAddress: "高田馬場3-22-5 相沢ビル",
    addressLocality: "新宿区",
    addressRegion: "東京都",
    postalCode: "169-0075",
    countryCode: "JP",
    stationNameEn: "Takadanobaba Station",
    stationNameJa: "高田馬場駅",
    stationWalkMinutes: 6,
    trainLines: ["JR Yamanote Line", "Seibu Shinjuku Line", "Tokyo Metro Tozai Line"],
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=%E6%9D%B1%E4%BA%AC%E9%83%BD%E6%96%B0%E5%AE%BF%E5%8C%BA%E9%AB%98%E7%94%B0%E9%A6%AC%E5%A0%B43-22-5%20%E7%9B%B8%E6%B2%A2%E3%83%93%E3%83%AB",
    mapsEmbedUrl: "https://www.google.com/maps?q=%E6%9D%B1%E4%BA%AC%E9%83%BD%E6%96%B0%E5%AE%BF%E5%8C%BA%E9%AB%98%E7%94%B0%E9%A6%AC%E5%A0%B43-22-5%20%E7%9B%B8%E6%B2%A2%E3%83%93%E3%83%AB&output=embed",
  },
  service: {
    lunch: { opens: "11:00", closes: "15:00", display: "11:00–15:00" },
    dinner: { opens: "17:00", closes: "23:00", display: "17:00–23:00" },
    businessStatusEn: "Open daily",
  },
  reservations: {
    minimumGuests: 1,
    maximumOnlineGuests: 40,
    timeSlots: [
      "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
      "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30",
      "21:00", "21:30", "22:00",
    ],
  },
  ownerVerificationRequired: [
    "Which published telephone number should be the primary customer contact.",
    "Current opening hours, last-order times, holiday closures and temporary closures.",
    "Physical seat count, maximum online party size and private-booking capacity.",
    "Exact station exit and walking time.",
    "Parking and accepted payment methods.",
    "Course party-size limits, promotional prices and timing restrictions.",
  ],
} as const;

export const restaurant: RestaurantInfo = {
  nameEn: restaurantConfig.identity.nameEn,
  nameJa: restaurantConfig.identity.nameJa,
  addressJa: restaurantConfig.location.addressJa,
  addressEn: restaurantConfig.location.addressEn,
  reservationPhone: restaurantConfig.contact.reservationPhone,
  directPhone: restaurantConfig.contact.directPhone,
  lunchHours: restaurantConfig.service.lunch.display,
  dinnerHours: restaurantConfig.service.dinner.display,
  closed: restaurantConfig.service.businessStatusEn,
  stationWalkMinutes: restaurantConfig.location.stationWalkMinutes,
  seats: null,
  lastVerified: restaurantConfig.lastVerified,
};

export const trainLines = restaurantConfig.location.trainLines;

export type RestaurantConfig = typeof restaurantConfig;
