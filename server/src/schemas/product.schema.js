import { z } from "zod";
import { PRODUCT_CATEGORY_IDS } from "../../../shared/constants.js";

const localImagePattern = /^\/products\/[A-Za-z0-9._-]+$/;

const imageUrlSchema = z
  .string()
  .trim()
  .max(2048)
  .refine(
    (value) => value === "" || localImagePattern.test(value) || isValidUrl(value),
    "La imagen debe ser una URL válida o una ruta /products/..."
  );

function isValidUrl(value) {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

const imagePathSchema = z
  .string()
  .trim()
  .max(255)
  .regex(
    /^products\/[A-Za-z0-9._-]+$/,
    "La ruta de la imagen debe apuntar a products/"
  )
  .or(z.literal(""));

const productFields = {
  name: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(120, "El nombre no puede superar 120 caracteres"),
  price: z.coerce
    .number({ invalid_type_error: "El precio debe ser un número" })
    .finite()
    .positive("El precio debe ser mayor que cero")
    .max(1_000_000, "El precio es demasiado alto"),
  availability: z.coerce
    .number({ invalid_type_error: "La disponibilidad debe ser un número" })
    .int("La disponibilidad debe ser un entero")
    .min(0, "La disponibilidad no puede ser negativa")
    .max(1_000_000, "La disponibilidad es demasiado alta"),
  category: z.coerce
    .number({ invalid_type_error: "La categoría debe ser un número" })
    .int()
    .refine(
      (value) => PRODUCT_CATEGORY_IDS.includes(value),
      "La categoría seleccionada no existe"
    ),
  image: imageUrlSchema.default(""),
  imagePath: imagePathSchema.default(""),
};

export const createProductSchema = z.object(productFields).strict();

export const updateProductSchema = z
  .object({
    name: productFields.name.optional(),
    price: productFields.price.optional(),
    availability: productFields.availability.optional(),
    category: productFields.category.optional(),
    image: imageUrlSchema.optional(),
    imagePath: imagePathSchema.optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debes enviar al menos un campo para actualizar",
  });

export const productIdSchema = z.string().trim().min(1).max(128);
