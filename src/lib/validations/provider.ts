import { z } from "zod";

const emptyToUndefined = (val: unknown) =>
  val === null || (typeof val === "string" && val.trim() === "")
    ? undefined
    : val;

export const providerSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  taxId: z.preprocess(emptyToUndefined, z.string().optional()),
  email: z.preprocess(emptyToUndefined, z.email("Email no válido").optional()),
  phone: z.preprocess(emptyToUndefined, z.string().optional()),
  address: z.preprocess(emptyToUndefined, z.string().optional()),
  postalCode: z.preprocess(emptyToUndefined, z.string().optional()),
  city: z.preprocess(emptyToUndefined, z.string().optional()),
  province: z.preprocess(emptyToUndefined, z.string().optional()),
  country: z.preprocess(emptyToUndefined, z.string().optional()).default("ES"),
  notes: z.preprocess(emptyToUndefined, z.string().optional()),
});

export type ProviderFormValues = z.infer<typeof providerSchema>;
