/**
 * partyValidator.js — Reglas de express-validator para /api/v1/parties.
 */
import { body, param, query } from "express-validator";
import { ENTITY_TYPES } from "../models/Party.js";

/** POST /api/v1/parties */
export const createPartyRules = [
  body("legalName")
    .trim()
    .notEmpty().withMessage("El nombre o razón social es obligatorio.")
    .isLength({ max: 200 }).withMessage("El nombre no puede superar los 200 caracteres."),
  body("taxId")
    .trim()
    .notEmpty().withMessage("El CUIT/CUIL/DNI es obligatorio.")
    .isLength({ max: 30 }).withMessage("El CUIT/CUIL/DNI no puede superar los 30 caracteres."),
  body("entityType")
    .notEmpty().withMessage("El tipo de entidad es obligatorio.")
    .isIn(ENTITY_TYPES)
    .withMessage(`entityType debe ser uno de: ${ENTITY_TYPES.join(", ")}.`),
  body("address")
    .optional({ values: "null" })
    .trim()
    .isLength({ max: 255 }).withMessage("El domicilio no puede superar los 255 caracteres."),
  body("email")
    .optional({ values: "null" })
    .trim()
    .isEmail().withMessage("El email no tiene un formato válido.")
    .normalizeEmail(),
  body("phone")
    .optional({ values: "null" })
    .trim()
    .isLength({ max: 40 }).withMessage("El teléfono no puede superar los 40 caracteres."),
  body("representative")
    .optional({ values: "null" })
    .trim()
    .isLength({ max: 255 }).withMessage("El representante no puede superar los 255 caracteres."),
];

/** PUT /api/v1/parties/:id — todos los campos opcionales */
export const updatePartyRules = [
  param("id").isUUID().withMessage("El id debe ser un UUID válido."),
  body("legalName")
    .optional()
    .trim()
    .notEmpty().withMessage("El nombre o razón social no puede estar vacío.")
    .isLength({ max: 200 }).withMessage("El nombre no puede superar los 200 caracteres."),
  body("taxId")
    .optional()
    .trim()
    .notEmpty().withMessage("El CUIT/CUIL/DNI no puede estar vacío.")
    .isLength({ max: 30 }).withMessage("El CUIT/CUIL/DNI no puede superar los 30 caracteres."),
  body("entityType")
    .optional()
    .isIn(ENTITY_TYPES)
    .withMessage(`entityType debe ser uno de: ${ENTITY_TYPES.join(", ")}.`),
  body("address")
    .optional({ values: "null" })
    .trim()
    .isLength({ max: 255 }).withMessage("El domicilio no puede superar los 255 caracteres."),
  body("email")
    .optional({ values: "null" })
    .trim()
    .isEmail().withMessage("El email no tiene un formato válido.")
    .normalizeEmail(),
  body("phone")
    .optional({ values: "null" })
    .trim()
    .isLength({ max: 40 }).withMessage("El teléfono no puede superar los 40 caracteres."),
  body("representative")
    .optional({ values: "null" })
    .trim()
    .isLength({ max: 255 }).withMessage("El representante no puede superar los 255 caracteres."),
  body("isActive")
    .optional()
    .isBoolean().withMessage("isActive debe ser un booleano."),
];

/** GET /api/v1/parties/:id, PUT, DELETE */
export const partyIdParamRules = [
  param("id").isUUID().withMessage("El id debe ser un UUID válido."),
];

/** GET /api/v1/parties?search=... (Razón Social o CUIT/DNI) */
export const searchPartiesQueryRules = [
  query("search")
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage("El término de búsqueda es demasiado largo."),
];
