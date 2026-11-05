/**
 * authValidator.js — Reglas de express-validator para /api/v1/auth.
 */
import { body } from "express-validator";
import { env } from "../config/env.js";
import { USER_ROLES } from "../models/User.js";

/**
 * Política de contraseñas por entorno:
 *  - desarrollo: se permiten contraseñas cortas como "123" (usuarios de prueba)
 *  - producción: mínimo 8 caracteres
 * El máximo 72 respeta el límite de entrada de bcrypt.
 */
const PASSWORD_MIN_LENGTH = env.isProduction ? 8 : 1;

/** POST /api/v1/auth/register */
export const registerRules = [
  body("name")
    .trim()
    .notEmpty().withMessage("El nombre es obligatorio.")
    .isLength({ max: 120 }).withMessage("El nombre no puede superar los 120 caracteres."),
  body("email")
    .trim()
    .notEmpty().withMessage("El email es obligatorio.")
    .isEmail().withMessage("El email no tiene un formato válido.")
    .normalizeEmail(),
  body("password")
    .notEmpty().withMessage("La contraseña es obligatoria.")
    .isLength({ min: PASSWORD_MIN_LENGTH, max: 72 })
    .withMessage(
      `La contraseña debe tener entre ${PASSWORD_MIN_LENGTH} y 72 caracteres.`,
    ),
  body("role")
    .optional()
    .isIn(USER_ROLES)
    .withMessage(`El rol debe ser uno de: ${USER_ROLES.join(", ")}.`),
  body("licenseNumber")
    .optional({ values: "null" })
    .trim()
    .isLength({ max: 60 })
    .withMessage("La matrícula no puede superar los 60 caracteres."),
];

/** POST /api/v1/auth/login */
export const loginRules = [
  body("email")
    .trim()
    .notEmpty().withMessage("El email es obligatorio.")
    .isEmail().withMessage("El email no tiene un formato válido.")
    .normalizeEmail(),
  body("password")
    .notEmpty().withMessage("La contraseña es obligatoria."),
];
