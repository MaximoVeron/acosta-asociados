/**
 * userValidator.js — Reglas de express-validator para /api/v1/users.
 */
import { body, param, query } from "express-validator";
import { env } from "../config/env.js";
import { USER_ROLES } from "../models/User.js";

const PASSWORD_MIN_LENGTH = env.isProduction ? 8 : 1;

/** POST /api/v1/users (solo ADMIN) */
export const createUserRules = [
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
    .notEmpty().withMessage("El rol es obligatorio.")
    .isIn(USER_ROLES)
    .withMessage(`El rol debe ser uno de: ${USER_ROLES.join(", ")}.`),
  body("licenseNumber")
    .optional({ values: "null" })
    .trim()
    .isLength({ max: 60 })
    .withMessage("La matrícula no puede superar los 60 caracteres."),
];

/** PUT /api/v1/users/:id (solo ADMIN) — todos los campos opcionales */
export const updateUserRules = [
  param("id").isUUID().withMessage("El id debe ser un UUID válido."),
  body("name")
    .optional()
    .trim()
    .notEmpty().withMessage("El nombre no puede estar vacío.")
    .isLength({ max: 120 }).withMessage("El nombre no puede superar los 120 caracteres."),
  body("email")
    .optional()
    .trim()
    .isEmail().withMessage("El email no tiene un formato válido.")
    .normalizeEmail(),
  body("password")
    .optional()
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
  body("isActive")
    .optional()
    .isBoolean().withMessage("isActive debe ser un booleano."),
];

/** GET /api/v1/users/:id */
export const userIdParamRules = [
  param("id").isUUID().withMessage("El id debe ser un UUID válido."),
];

/** GET /api/v1/users?isActive=true|false (filtro opcional) */
export const listUsersQueryRules = [
  query("isActive")
    .optional()
    .isBoolean().withMessage("isActive debe ser un booleano (true/false).")
    .toBoolean(),
];
