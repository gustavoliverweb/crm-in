import { z } from "zod";

const emptyToUndefined = (val: unknown) =>
  val === null || (typeof val === "string" && val.trim() === "")
    ? undefined
    : val;

export const contactSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  email: z.preprocess(emptyToUndefined, z.email("Email no válido").optional()),
  phone: z.preprocess(emptyToUndefined, z.string().optional()),
  company: z.preprocess(emptyToUndefined, z.string().optional()),
  clientId: z.preprocess(emptyToUndefined, z.string().optional()),
  notes: z.preprocess(emptyToUndefined, z.string().optional()),
});

export type ContactFormValues = z.infer<typeof contactSchema>;
