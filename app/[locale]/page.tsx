import { HomePage } from "@/components/home-page";
import { courses } from "@/data/courses";
import { allMenuItems } from "@/data/menu";
import { authorizedPhotos } from "@/data/photos";
import { restaurant } from "@/data/restaurant";
import { getPublishedDictionary, getPublishedPayload, getPublishedPhotos } from "@/lib/content";
import type { LocalePageProps } from "@/types";
import { isLocale } from "@/lib/locale";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: LocalePageProps) {
  const { locale } = await params;
  const lang = isLocale(locale) ? locale : "en";
  return pageMetadata(lang, "", lang === "ja" ? "高田馬場のインド・ネパール料理" : "Indian & Nepalese Dining in Takadanobaba", lang === "ja" ? "高田馬場駅徒歩6分。カレー、タンドール、ランチ、ドリンク、宴会コースを楽しめるアジアンダイニングバー。" : "Curries, tandoori, lunch, drinks and group courses at a welcoming Asian dining bar six minutes from Takadanobaba Station.");
}

export default async function Page({ params }: LocalePageProps) {
  const { locale } = await params;
  const lang = isLocale(locale) ? locale : "en";
  const [dictionary, restaurantInfo, menuData, courseData, photos] = await Promise.all([getPublishedDictionary(lang), getPublishedPayload("restaurant", restaurant), getPublishedPayload("menu", allMenuItems), getPublishedPayload("courses", courses), getPublishedPhotos(authorizedPhotos)]);
  return <HomePage locale={lang} dictionary={dictionary} restaurantInfo={restaurantInfo} menuData={menuData} courseData={courseData} photos={photos} />;
}
