import { LAST_VERIFIED } from "@/lib/constants";
import type { RestaurantInfo } from "@/types";

export const restaurant: RestaurantInfo = {
  nameEn: "Sakura Asian Dining & Bar",
  nameJa: "さくらアジアンダイニング&バー",
  addressJa: "東京都新宿区高田馬場3-22-5 相沢ビル",
  addressEn: "Aizawa Building, 3-22-5 Takadanobaba, Shinjuku-ku, Tokyo",
  reservationPhone: "050-5571-3032",
  directPhone: "090-8402-8144",
  lunchHours: "11:00–15:00",
  dinnerHours: "17:00–23:00",
  closed: "Open daily",
  stationWalkMinutes: 6,
  seats: 32,
  lastVerified: LAST_VERIFIED,
};

export const trainLines = ["JR Yamanote Line", "Seibu Shinjuku Line", "Tokyo Metro Tozai Line"];
