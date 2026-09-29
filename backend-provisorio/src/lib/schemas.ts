import { z } from "zod";

// ============================================================
// CAMPOS REUTILIZABLES
// ============================================================

export const tipoDocumentoSchema = z
  .string()
  .trim()
  .min(2, "El tipo de documento es obligatorio")
  .max(30, "El tipo de documento no puede superar 30 caracteres");

export const dniSchema = z
  .string()
  .trim()
  .min(5, "El número de documento debe tener al menos 5 caracteres")
  .max(50, "El número de documento no puede superar 50 caracteres")
  .regex(
    /^[A-Za-z0-9_-]+$/,
    "El número de documento solo puede contener letras, números, guiones y guiones bajos"
  );

export const nombreSchema = z
  .string()
  .trim()
  .min(2, "Debe tener al menos 2 caracteres")
  .max(100, "No puede superar 100 caracteres")
  .regex(
    /^[\p{L}\s'().-]+$/u,
    "Solo puede contener letras, espacios, guiones o apóstrofes"
  );

export const apellidoSchema = z
  .string()
  .trim()
  .min(2, "Debe tener al menos 2 caracteres")
  .max(100, "No puede superar 100 caracteres")
  .regex(
    /^[\p{L}\s'().-]+$/u,
    "Solo puede contener letras, espacios, guiones o apóstrofes"
  );

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Formato de correo electrónico inválido")
  .max(150, "El correo electrónico no puede superar 150 caracteres");

export const celularSchema = z
  .string()
  .trim()
  .min(7, "El teléfono es demasiado corto")
  .max(30, "El teléfono es demasiado largo")
  .regex(
    /^\+?[0-9\s\-()]+$/,
    "Formato de teléfono inválido"
  );


// ============================================================
// REGISTRO PÚBLICO
// ============================================================

export const registerSchema = z.object({
  tipo_documento: tipoDocumentoSchema,

  dni_pasaporte: dniSchema,

  nombre: nombreSchema,

  apellido: apellidoSchema,

  email: emailSchema,

  celular: celularSchema,

  institucion: z
    .string()
    .trim()
    .max(200, "La institución no puede superar 200 caracteres")
    .optional()
    .nullable(),

  rol_principal_id: z
    .number()
    .int()
    .positive("Debe seleccionar un rol válido"),

  roles_adicionales_ids: z
    .array(z.number().int().positive())
    .default([]),

  condiciones_adicionales: z
    .string()
    .trim()
    .max(1000, "Las condiciones adicionales son demasiado extensas")
    .optional()
    .nullable(),

  intereses: z
    .string()
    .trim()
    .max(2000, "Los intereses son demasiado extensos")
    .optional()
    .nullable(),

  acepta_comunicaciones: z
    .boolean()
    .default(false),

  consentimiento_datos: z
    .boolean()
    .default(false)
    .refine(
      (valor) => valor === true,
      "Debés aceptar el tratamiento de datos para completar la inscripción"
    ),
});


// ============================================================
// LOGIN
// ============================================================

export const loginSchema = z.object({
  email: emailSchema,

  password: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres"),

  recordar: z
    .boolean()
    .default(false),
});