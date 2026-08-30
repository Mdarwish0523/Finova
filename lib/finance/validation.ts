import { z } from "zod";
import { ALL_CATEGORIES, CURRENCIES, TIME_ZONES } from "@/lib/finance/constants";
import { amountStringToCents } from "@/lib/finance/format";

const optionalText = z
  .string()
  .trim()
  .max(500)
  .transform((value) => value || null);

const amountSchema = z.string().trim().refine((value) => {
  const cents = amountStringToCents(value);
  return cents !== null && cents > 0 && cents <= 999_999_999_99;
}, "Enter a valid amount greater than zero");

export const transactionSchema = z.object({
  id: z.string().uuid().optional(),
  kind: z.enum(["income", "expense"]),
  amount: amountSchema,
  transactionDate: z.iso.date(),
  category: z.string().trim().min(1).max(60).refine((value) => ALL_CATEGORIES.some((category) => category === value)),
  merchant: z.string().trim().max(120).transform((value) => value || null),
  description: optionalText,
  notes: optionalText,
  recurringExpenseId: z.union([z.string().uuid(), z.literal("")]).transform((value) => value || null),
});

export const recurringExpenseSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, "Name is required").max(120),
  amount: amountSchema,
  category: z.string().trim().min(1).max(60).refine((value) => ALL_CATEGORIES.some((category) => category === value)),
  dueDay: z.coerce.number().int().min(1).max(31),
  active: z.boolean(),
  notes: optionalText,
});

export const freeTrialSchema = z.object({
  id: z.string().uuid().optional(),
  serviceName: z.string().trim().min(1, "Service name is required").max(120),
  startDate: z.iso.date(),
  durationDays: z.coerce.number().int().min(1, "Trial length must be greater than zero").max(36_500),
  cardLabel: z
    .string()
    .trim()
    .min(1, "Card label is required")
    .max(120)
    .refine((label) => (label.match(/\d/g) ?? []).length < 12, "Use only a card label or last four digits"),
  notes: optionalText,
  status: z.enum(["active", "cancelled"]),
  remindTwoDays: z.boolean(),
  remindOneDay: z.boolean(),
});

export const settingsSchema = z.object({
  startingBalance: z.string().trim().refine((value) => amountStringToCents(value) !== null, "Enter a valid balance"),
  monthlyBudget: z.union([z.literal(""), amountSchema]),
  currency: z.string().refine((value) => CURRENCIES.includes(value)),
  timezone: z.string().refine((value) => TIME_ZONES.includes(value)),
});
