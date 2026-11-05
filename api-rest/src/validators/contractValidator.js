/**
 * contractValidator.js — Reglas de express-validator para /api/v1/contracts.
 */
import { body, param } from "express-validator";

/**
 * Estados que puede recibir un contrato al CREARSE (POST):
 * el asistente puede iniciar un borrador (DRAFT) o pasarlo directo a
 * revisión (UNDER_REVIEW). APPROVED solo se alcanza vía PATCH /:id/approve
 * (RF07) y CANCELLED vía PUT.
 */
const CREATABLE_STATUSES = ["DRAFT", "UNDER_REVIEW"];

/** POST /api/v1/contracts */
export const createContractRules = [
  body("title")
    .trim()
    .notEmpty().withMessage("El título es obligatorio.")
    .isLength({ max: 200 }).withMessage("El título no puede superar los 200 caracteres."),
  body("type")
    .trim()
    .notEmpty().withMessage("El tipo de contrato es obligatorio.")
    .isLength({ max: 80 }).withMessage("El tipo no puede superar los 80 caracteres."),
  body("contractorId")
    .notEmpty().withMessage("El contratante (contractorId) es obligatorio.")
    .isUUID().withMessage("contractorId debe ser un UUID válido."),
  body("contracteeId")
    .notEmpty().withMessage("La contraparte (contracteeId) es obligatoria.")
    .isUUID().withMessage("contracteeId debe ser un UUID válido.")
    .custom((value, { req }) => {
      if (value === req.body.contractorId) {
        throw new Error("El contratante y la contraparte no pueden ser la misma parte.");
      }
      return true;
    }),
  body("status")
    .optional()
    .isIn(CREATABLE_STATUSES)
    .withMessage(`Al crear, el estado debe ser uno de: ${CREATABLE_STATUSES.join(", ")}.`),
  body("content")
    .optional({ values: "null" })
    .isString().withMessage("El contenido debe ser texto."),
  body("extractedData")
    .optional({ values: "null" })
    .isObject().withMessage("extractedData debe ser un objeto JSON."),
];

/** PUT /api/v1/contracts/:id — todos los campos opcionales */
export const updateContractRules = [
  param("id").isUUID().withMessage("El id debe ser un UUID válido."),
  body("title")
    .optional()
    .trim()
    .notEmpty().withMessage("El título no puede estar vacío.")
    .isLength({ max: 200 }).withMessage("El título no puede superar los 200 caracteres."),
  body("type")
    .optional()
    .trim()
    .notEmpty().withMessage("El tipo no puede estar vacío.")
    .isLength({ max: 80 }).withMessage("El tipo no puede superar los 80 caracteres."),
  body("status")
    .optional()
    // RF07: 'APPROVED' NO se puede setear por PUT; solo vía
    // PATCH /:id/approve con rol LAWYER/ADMIN.
    .isIn(["DRAFT", "UNDER_REVIEW", "CANCELLED"])
    .withMessage("Por PUT el estado solo puede ser: DRAFT, UNDER_REVIEW o CANCELLED. La aprobación es exclusiva de PATCH /:id/approve."),
  body("contractorId")
    .optional()
    .isUUID().withMessage("contractorId debe ser un UUID válido."),
  body("contracteeId")
    .optional()
    .isUUID().withMessage("contracteeId debe ser un UUID válido."),
  body("content")
    .optional({ values: "null" })
    .isString().withMessage("El contenido debe ser texto."),
  body("extractedData")
    .optional({ values: "null" })
    .isObject().withMessage("extractedData debe ser un objeto JSON."),
];

/** GET /api/v1/contracts/:id y PATCH /api/v1/contracts/:id/approve */
export const contractIdParamRules = [
  param("id").isUUID().withMessage("El id debe ser un UUID válido."),
];
