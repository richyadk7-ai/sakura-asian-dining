import type { CourseDetailItem, CourseDetails, CourseDrinkGroup } from "@/types";

const item = (nameEn: string, nameJa: string, descriptionEn?: string, descriptionJa?: string): CourseDetailItem => ({
  nameEn,
  nameJa,
  ...(descriptionEn ? { descriptionEn } : {}),
  ...(descriptionJa ? { descriptionJa } : {}),
});

const drinkGroup = (nameEn: string, nameJa: string, itemsEn: string[], itemsJa: string[]): CourseDrinkGroup => ({ nameEn, nameJa, itemsEn, itemsJa });

const standardDrinkGroups: CourseDrinkGroup[] = [
  drinkGroup("Wine", "ワイン", ["Red wine", "White wine"], ["赤ワイン", "白ワイン"]),
  drinkGroup(
    "Cassis & lychee",
    "カシス・ライチ",
    ["Cassis orange", "Cassis oolong", "Cassis grapefruit", "Cassis soda", "Cassis pineapple", "Lychee grapefruit", "Lychee orange", "Lychee oolong", "Lychee soda"],
    ["カシスオレンジ", "カシスウーロン", "カシスグレープフルーツ", "カシスソーダ", "カシスパイン", "ライチグレープフルーツ", "ライチオレンジ", "ライチウーロン", "ライチソーダ"],
  ),
  drinkGroup(
    "Gin & vodka",
    "ジン・ウォッカ",
    ["Gin and tonic", "Gin lime", "Gin buck", "Screwdriver", "Moscow mule", "Bulldog", "Vodka tonic"],
    ["ジントニック", "ジンライム", "ジンバック", "スクリュードライバー", "モスコミュール", "ブルドッグ", "ウォッカトニック"],
  ),
  drinkGroup("Whisky", "ウイスキー", ["Highball", "Coke highball", "Ginger highball", "On the rocks", "With water"], ["ハイボール", "コークハイボール", "ジンジャーハイボール", "ロック", "水割り"]),
  drinkGroup("Shochu & plum wine", "焼酎・梅酒", ["On the rocks", "With water", "With soda"], ["ロック", "水割り", "ソーダ割り"]),
  drinkGroup(
    "Sours & tea highballs",
    "サワー・お茶割り",
    ["Lemon sour", "Grapefruit sour", "Lime sour", "Lychee sour", "Peach sour", "Calpis sour", "Orange sour", "Oolong high", "Green tea high"],
    ["レモンサワー", "グレープフルーツサワー", "ライムサワー", "ライチサワー", "ピーチサワー", "カルピスサワー", "オレンジサワー", "ウーロンハイ", "緑茶ハイ"],
  ),
  drinkGroup(
    "Soft drinks",
    "ソフトドリンク",
    ["Oolong tea", "Green tea", "Orange juice", "Grapefruit juice", "Pineapple juice", "Coca-Cola", "Ginger ale"],
    ["ウーロン茶", "緑茶", "オレンジジュース", "グレープフルーツジュース", "パインジュース", "コカ・コーラ", "ジンジャーエール"],
  ),
  drinkGroup("Lassi", "ラッシー", ["Mango lassi", "Plain lassi"], ["マンゴーラッシー", "ラッシー"]),
];

const extendedDrinkGroups: CourseDrinkGroup[] = [
  drinkGroup(
    "Wine & wine cocktails",
    "ワイン・ワインカクテル",
    ["Red wine", "White wine", "House sangria", "Kitty", "Kir", "Spritzer", "Operator", "Mimosa"],
    ["赤ワイン", "白ワイン", "自家製サングリア", "キティ", "キール", "スプリッツァー", "オペレーター", "ミモザ"],
  ),
  drinkGroup(
    "Cassis, lychee & peach",
    "カシス・ライチ・ピーチ",
    ["Cassis orange", "Cassis oolong", "Cassis grapefruit", "Cassis soda", "Cassis pineapple", "Lychee grapefruit", "Lychee orange", "Lychee oolong", "Lychee soda", "Peach oolong", "Peach orange", "Peach grapefruit", "Peach fizz"],
    ["カシスオレンジ", "カシスウーロン", "カシスグレープフルーツ", "カシスソーダ", "カシスパイン", "ライチグレープフルーツ", "ライチオレンジ", "ライチウーロン", "ライチソーダ", "ピーチウーロン", "ピーチオレンジ", "ピーチグレープフルーツ", "ピーチフィズ"],
  ),
  ...standardDrinkGroups.slice(2),
  drinkGroup("Beer", "ビール", ["Draft beer", "Shandy gaff"], ["生ビール", "シャンディーガフ"]),
];

const premiumDrinkGroups: CourseDrinkGroup[] = [
  drinkGroup("Beer", "生ビール", ["Draft beer", "Shandy gaff", "Panaché", "Campari beer"], ["生ビール", "シャンディーガフ", "パナシェ", "カンパリビール"]),
  drinkGroup("Wine cocktails", "ワインカクテル", ["House sangria", "Kitty", "Kir", "Spritzer", "Operator", "Mimosa"], ["自家製サングリア", "キティ", "キール", "スプリッツァー", "オペレーター", "ミモザ"]),
  drinkGroup(
    "Tequila, rum & Malibu",
    "テキーラ・ラム・マリブ",
    ["Tequila sunrise", "Tequila tonic", "Matador", "Rum and Coke", "Rum tonic", "Rum buck", "Malibu orange", "Malibu pineapple", "Malibu grapefruit", "Malibu Coke"],
    ["テキーラサンライズ", "テキーラトニック", "マタドール", "ラムコーク", "ラムトニック", "ラムバック", "マリブオレンジ", "マリブパイン", "マリブグレープフルーツ", "マリブコーク"],
  ),
  drinkGroup(
    "Peach & Campari",
    "ピーチ・カンパリ",
    ["Peach oolong", "Peach orange", "Peach grapefruit", "Peach fizz", "Campari orange", "Campari grapefruit", "Campari soda"],
    ["ピーチウーロン", "ピーチオレンジ", "ピーチグレープフルーツ", "ピーチフィズ", "カンパリオレンジ", "カンパリグレープフルーツ", "カンパリソーダ"],
  ),
];

const premiumUpgrade = {
  price: "+¥500",
  descriptionEn: "Adds approximately 40 premium drink choices. Request the upgrade when reserving.",
  descriptionJa: "約40種類のプレミアムドリンクを追加できます。予約時にお申し付けください。",
  groups: premiumDrinkGroups,
};

export const courseDetailsById: Record<string, CourseDetails> = {
  "welcome-party-course": {
    menuItems: [
      item("Seasonal green salad", "季節野菜のグリーンサラダ"),
      item("Papad", "パパド", "A crisp, spiced lentil cracker.", "豆粉を使ったスパイシーなインドせんべい。"),
      item("Fried young chicken", "若鶏の唐揚げ", "Fried until crisp.", "カリッと仕上げた若鶏の唐揚げ。"),
      item("Mixed grill", "ミックスグリル", "Juicy, spiced meats cooked in the tandoor.", "タンドール窯で焼き上げるジューシーでスパイシーなお肉。"),
      item("Butter and cumin potatoes", "バターとクミンのポテト", "Sweet butter balanced with aromatic cumin.", "バターの甘みとクミンの香りを合わせたポテト。"),
      item("Three-cheese naan", "3種のとろとろMIXチーズナン", "Cheddar, mozzarella and melting cheese. Fresh plain naan and rice refills are included.", "チェダー、モッツァレラ、とろけるチーズの3種MIX。焼きたてプレーンナンとライスはおかわり自由。"),
      item("Choice of curry", "選べるカレー", "Choose a preferred curry from the menu.", "メニューからお好きなカレーを選べます。"),
      item("Daily dessert", "日替わりデザート"),
    ],
    drinkGroups: standardDrinkGroups,
    notesEn: ["Two-hour course with more than 60 drink choices.", "For course reservations of 10 or more guests, the current offer includes one organizer free of charge."],
    notesJa: ["120分・60種類以上の飲み放題付きです。", "10名様以上のコース予約では、現在の特典として幹事様1名分が無料です。"],
  },
  "sakura-150-minute-course": {
    menuItems: [
      item("Indian salad", "インドサラダ"), item("Bean salad", "豆サラダ"), item("Sakura salad", "サクラサラダ"),
      item("Butter chicken curry", "バターチキンカレー"), item("Pork curry", "ポークカレー"), item("Mutton curry", "マトンカレー"), item("Seafood curry", "シーフードカレー"),
      item("Cheese naan", "チーズナン"), item("Garlic naan", "ガーリックナン"), item("Plain naan", "プレーンナン"), item("Garlic rice", "ガーリックライス"), item("Plain rice", "プレーンライス"),
      item("Chicken tikka", "チキンティッカ"), item("Tandoori chicken", "タンドリーチキン"), item("Seekh kebab", "シシカバブ"), item("Grilled sausage", "グリルソーセージ"),
      item("Momo", "モモ（ネパール餃子）"), item("French fries", "フライドポテト"), item("Onion rings", "オニオンリング"), item("Vanilla ice cream or today’s dessert", "バニラアイス または 本日のデザート"),
    ],
    drinkGroups: extendedDrinkGroups,
    notesEn: ["All listed food selections are included in the all-you-can-eat plan; the grill selection is served as a platter.", "The course is labeled as 22 items, although the currently itemized selection does not name all 22 separately. Sakura can confirm the remaining selection when reserving.", "Available between 11:00 and 23:00.", "Sakura serves five dishes at the beginning before additional orders.", "On Fridays, Saturdays and days before holidays, the drink plan is limited to two hours.", "For course reservations of 10 or more guests, the current offer includes one organizer free of charge."],
    notesJa: ["掲載料理はすべて食べ放題です。グリル4品は盛り合わせで提供します。", "コースは22品表記ですが、現在の内訳では22品すべての名称が個別に記載されていません。残りの内容は予約時に店舗へご確認ください。", "利用可能時間は11:00～23:00です。", "開始時に店舗から料理5品を提供します。", "金曜・土曜・祝前日は飲み放題が2時間制です。", "10名様以上のコース予約では、現在の特典として幹事様1名分が無料です。"],
  },
  "tandoori-bbq-course": {
    menuItems: [
      item("Choice of salad", "選べるサラダ", "Choose Indian salad, bean salad or Sakura salad.", "インドサラダ、豆サラダ、サクラサラダから選べます。"),
      item("Indian-style fried chicken", "インドチキンの唐揚げ", "Crisp chicken seasoned with coarse black pepper.", "粗挽き黒胡椒を効かせたインド式の鶏唐揚げ。"),
      item("Long seekh kebab", "ロングカバブ", "A long, spicy grilled lamb skewer served whole.", "長いまま提供する、羊肉のスパイシーな串焼き。"),
      item("Herb tandoori chicken on the bone", "串焼き骨付きハーブのタンドリーチキン", "Juicy bone-in chicken prepared specially for this course.", "このコース限定のジューシーな骨付きハーブチキン。"),
      item("White-cream herb chicken", "串焼きホワイトクリームの窯焼きハーブチキン", "Tandoor-baked chicken with rich white cream and Indian herbs.", "濃厚なホワイトクリームとインドのハーブを使った窯焼きチキン。"),
      item("Juicy momo", "肉汁たっぷりのモモ", "Nepalese dumplings filled with savory broth.", "だしの旨みが広がるネパール風の蒸し餃子。"),
      item("Choice of curry", "お好きなカレー", "Choose a preferred curry from the menu.", "メニューからお好きなカレーを選べます。"),
      item("Three-cheese naan", "3種のとろとろMIXチーズナン", "Cheddar, mozzarella and melting cheese. Fresh plain naan and rice refills are included.", "チェダー、モッツァレラ、とろけるチーズの3種MIX。焼きたてプレーンナンとライスはおかわり自由。"),
      item("Today’s dessert", "本日のデザート"),
    ],
    drinkGroups: extendedDrinkGroups,
    notesEn: ["Available for parties of 2–40 guests.", "Timing note: the course title advertises a 180-minute drink plan, while the listed stay time is 150 minutes. On Fridays, Saturdays and days before holidays, drinks are limited to 120 minutes. Please confirm timing with Sakura when reserving.", "For course reservations of 10 or more guests, the current offer includes one organizer free of charge."],
    notesJa: ["2～40名様で利用できます。", "時間について：コース名は180分飲み放題ですが、滞在可能時間は150分と記載されています。金曜・土曜・祝前日は飲み放題が120分制です。予約時に店舗へご確認ください。", "10名様以上のコース予約では、現在の特典として幹事様1名分が無料です。"],
  },
  "sakura-special-drink-course": {
    menuItems: [],
    drinkGroups: standardDrinkGroups,
    premiumDrinkUpgrade: premiumUpgrade,
    notesEn: ["Available for parties of 2–35 guests.", "This is a two-hour drink-only plan.", "For course reservations of 10 or more guests, the current offer includes one organizer free of charge."],
    notesJa: ["2～35名様で利用できます。", "料理を含まない2時間の飲み放題プランです。", "10名様以上のコース予約では、現在の特典として幹事様1名分が無料です。"],
  },
  "grilled-chicken-drink-course": {
    menuItems: [item("Appetizer", "前菜"), item("French fries", "ポテトフライ"), item("Grilled chicken", "グリルチキン")],
    drinkGroups: standardDrinkGroups,
    premiumDrinkUpgrade: premiumUpgrade,
    notesEn: ["Available for parties of 2–35 guests.", "Two-hour drink plan; bottles are excluded.", "For course reservations of 10 or more guests, the current offer includes one organizer free of charge."],
    notesJa: ["2～35名様で利用できます。", "2時間飲み放題付きです。ボトル・瓶は対象外です。", "10名様以上のコース予約では、現在の特典として幹事様1名分が無料です。"],
  },
};

export const courseDetailsLastVerified = "2026-07-17";
