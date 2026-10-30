import { z } from "zod";

export const checkoutSchema = z
  .object({
    checkoutId: z
      .string()
      .uuid("checkoutId debe ser un UUID válido")
      .describe("Identificador idempotente generado por el cliente"),
    items: z
      .array(
        z
          .object({
            id: z.string().trim().min(1).max(128),
            quantity: z.coerce
              .number({ invalid_type_error: "La cantidad debe ser un número" })
              .int("La cantidad debe ser un entero")
              .min(1, "La cantidad debe ser mayor que cero"),
          })
          .strict()
      )
      .min(1, "El carrito está vacío")
      .max(50, "El carrito tiene demasiados productos distintos"),
    couponCode: z.string().trim().max(50).optional().nullable(),
  })
  .strict()
  .superRefine((data, ctx) => {
    const ids = new Set();
    data.items.forEach((item, index) => {
      if (ids.has(item.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["items", index, "id"],
          message: "No repitas el mismo producto en el carrito",
        });
      }
      ids.add(item.id);
    });
  });

export const couponCodeSchema = z
  .object({
    code: z.string().trim().min(1, "Ingresa un cupón").max(50),
  })
  .strict();

export const salesDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe tener el formato YYYY-MM-DD");
