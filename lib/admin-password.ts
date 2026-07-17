import { z } from "zod";

const ownerPasswordSchema = z
  .string()
  .min(12, "Use at least 12 characters.")
  .max(128, "Use no more than 128 characters.")
  .regex(/[a-z]/, "Include at least one lowercase letter.")
  .regex(/[A-Z]/, "Include at least one uppercase letter.")
  .regex(/[0-9]/, "Include at least one number.");

export function validateOwnerPassword(password: string, confirmation: string) {
  const result = ownerPasswordSchema.safeParse(password);
  if (!result.success) return result.error.issues[0]?.message ?? "Choose a stronger password.";
  if (password !== confirmation) return "The passwords do not match.";
  return null;
}
