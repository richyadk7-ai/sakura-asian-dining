import type { Course } from "@/types";

export const courses: Course[] = [
  {
    id: "welcome-party-course",
    sourceOrder: 1,
    nameEn: "Welcome & Farewell Party: 8 Dishes, Unlimited Naan & Rice, 120-Minute Drink Plan",
    nameJa: "【歓送迎会に♪】ポテトやミックスグリルなど全8品◇ナン＆ライスが食べ放題のお得なコース＋120分60種以上飲み放題付",
    summaryEn: "Eight Asian favorites with mixed grill, three-cheese naan, curry and dessert; naan, rice and more than 60 drinks are included.",
    summaryJa: "ミックスグリル、3種チーズナン、カレー、デザートなど全8品。ナン＆ライス食べ放題、60種以上の飲み放題付き。",
    previousPrice: "¥3,480",
    price: "¥2,480",
    durationMinutes: 120,
    itemCount: 8,
    allYouCanEat: true,
    allYouCanDrink: true,
    imageId: "food-013",
    enabled: true,
  },
  {
    id: "sakura-150-minute-course",
    sourceOrder: 2,
    nameEn: "Sakura 150-Minute All-You-Can-Eat & Drink Course",
    nameJa: "サクラお腹いっぱい食べ飲み放題150分コース",
    summaryEn: "A generous 22-item Sakura course with 150 minutes of all-you-can-eat and all-you-can-drink dining.",
    summaryJa: "サクラダイニングのメニュー22品を150分たっぷり楽しめる食べ飲み放題コース。",
    price: "¥3,300",
    durationMinutes: 150,
    itemCount: 22,
    allYouCanEat: true,
    allYouCanDrink: true,
    imageId: "food-013",
    enabled: true,
  },
  {
    id: "tandoori-bbq-course",
    sourceOrder: 3,
    nameEn: "Tandoori Skewer BBQ Course with 180-Minute Drink Plan",
    nameJa: "【歓送迎会に♪】串焼きタンドリーBBQコース＋生ビールもOK！180分60種以上飲み放題付",
    summaryEn: "Nine dishes centered on tandoor-grilled meats, long kebabs and freshly baked naan, with draft beer included in the drink plan.",
    summaryJa: "タンドールBBQ、ロングカバブ、特製チキン、焼きたてナンなど肉料理を中心にした全9品。生ビールも飲み放題。",
    previousPrice: "¥4,480",
    price: "¥3,480",
    durationMinutes: 180,
    itemCount: 9,
    allYouCanEat: true,
    allYouCanDrink: true,
    imageId: "food-011",
    enabled: true,
  },
  {
    id: "sakura-special-drink-course",
    sourceOrder: 4,
    nameEn: "Sakura Special Two-Hour All-You-Can-Drink Plan",
    nameJa: "サクラスペシャルコース2時間飲み放題プラン【2580円→1580円】",
    summaryEn: "A special-value two-hour all-you-can-drink plan for groups of two to 35 guests.",
    summaryJa: "2～35名様で利用できる、お得な2時間飲み放題プラン。",
    previousPrice: "¥2,580",
    price: "¥1,580",
    durationMinutes: 120,
    allYouCanEat: false,
    allYouCanDrink: true,
    imageId: "food-013",
    enabled: true,
  },
  {
    id: "grilled-chicken-drink-course",
    sourceOrder: 5,
    nameEn: "Two-Hour Drink Plan with Appetizer, Fries & Grilled Chicken",
    nameJa: "【2時間飲み放題付き】前菜＋ポテトフライ＋グリルチキン付きお得なコースです！！",
    summaryEn: "A compact three-dish course with appetizer, fries and grilled chicken, plus a two-hour drink plan.",
    summaryJa: "前菜、ポテトフライ、グリルチキンの全3品に2時間飲み放題が付いたコース。",
    previousPrice: "¥2,980",
    price: "¥2,000",
    durationMinutes: 120,
    itemCount: 3,
    allYouCanEat: false,
    allYouCanDrink: true,
    imageId: "food-013",
    enabled: true,
  },
];

export function getCourseById(value: unknown, courseData: Course[] = courses) {
  if (typeof value !== "string") return undefined;
  return courseData.find((course) => course.id === value && course.enabled);
}

export function isCourseId(value: unknown): value is string {
  return Boolean(getCourseById(value));
}
