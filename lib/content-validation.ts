import { z } from "zod";
import type { ContentDocument } from "@/types";

const restaurantSchema = z.object({
  nameEn: z.string().min(1), nameJa: z.string().min(1), addressJa: z.string().min(1), addressEn: z.string().min(1),
  reservationPhone: z.string().min(1), directPhone: z.string().min(1), lunchHours: z.string().min(1), dinnerHours: z.string().min(1),
  closed: z.string().min(1), stationWalkMinutes: z.number().int().positive(), seats: z.number().int().positive().nullable(), lastVerified: z.string().min(1),
});

const menuSchema = z.array(z.object({
  id: z.string().min(1), sourceOrder: z.number().int().positive(), section: z.enum(["food", "drinks", "lunch"]),
  categoryEn: z.string().min(1), categoryJa: z.string().min(1), nameEn: z.string().min(1), nameJa: z.string().min(1),
  price: z.string().optional(), descriptionEn: z.string().optional(), descriptionJa: z.string().optional(), image: z.string().optional(),
  spicy: z.boolean().optional(), vegetarian: z.boolean().optional(), recommended: z.boolean().optional(), enabled: z.boolean(), kind: z.enum(["item", "notice"]).optional(),
}));

const courseDrinkGroupSchema = z.object({
  nameEn: z.string().min(1), nameJa: z.string().min(1), itemsEn: z.array(z.string().min(1)).min(1), itemsJa: z.array(z.string().min(1)).min(1),
});

const courseDetailsSchema = z.object({
  menuItems: z.array(z.object({ nameEn: z.string().min(1), nameJa: z.string().min(1), descriptionEn: z.string().optional(), descriptionJa: z.string().optional() })),
  drinkGroups: z.array(courseDrinkGroupSchema).min(1),
  premiumDrinkUpgrade: z.object({
    price: z.string().min(1), descriptionEn: z.string().min(1), descriptionJa: z.string().min(1), groups: z.array(courseDrinkGroupSchema).min(1),
  }).optional(),
  notesEn: z.array(z.string().min(1)).min(1), notesJa: z.array(z.string().min(1)).min(1),
});

const coursesSchema = z.array(z.object({
  id: z.string().min(1), sourceOrder: z.number().int().positive(), nameEn: z.string().min(1), nameJa: z.string().min(1), summaryEn: z.string().min(1), summaryJa: z.string().min(1),
  price: z.string().min(1), previousPrice: z.string().optional(), durationMinutes: z.number().int().positive(), itemCount: z.number().int().positive().optional(),
  allYouCanEat: z.boolean(), allYouCanDrink: z.boolean(), imageId: z.string().optional(), details: courseDetailsSchema.optional(), enabled: z.boolean(),
}));

const dictionarySchema = z.record(z.string(), z.unknown()).refine((value) => Object.keys(value).length > 0, "Dictionary cannot be empty");
const pagesSchema = z.object({ en: dictionarySchema, ja: dictionarySchema });
const schemas = { restaurant: restaurantSchema, menu: menuSchema, courses: coursesSchema, pages: pagesSchema } as const;

export function validateContentDocument(id: ContentDocument["id"], payload: unknown) {
  return schemas[id].safeParse(payload);
}

export function assertValidContentDocument(id: ContentDocument["id"], payload: unknown) {
  const result = validateContentDocument(id, payload);
  if (!result.success) throw new Error(`Invalid ${id} document: ${result.error.issues.slice(0, 5).map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ")}`);
  return result.data;
}
