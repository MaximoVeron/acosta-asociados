/**
 * aiValidator.js — Reglas de express-validator para /api/v1/ai.
 */
import { body } from "express-validator";

/** Tipos de documento que sabe generar el microservicio IA. */
export const DOCUMENT_TYPES = ["CONTRATO", "EXPEDIENTE"];

/** POST /api/v1/ai/process — un turno de la conversación con el asistente. */
export const processDocumentRules = [
  body("prompt")
    .trim()
    .notEmpty()
    .withMessage("La instrucción es obligatoria.")
    .isLength({ max: 4000 })
    .withMessage("La instrucción no puede superar los 4000 caracteres."),
  body("document_type")
    .optional()
    .isIn(DOCUMENT_TYPES)
    .withMessage(`document_type debe ser uno de: ${DOCUMENT_TYPES.join(", ")}.`),
  body("current_data")
    .optional({ values: "null" })
    .isObject()
    .withMessage("current_data debe ser un objeto JSON."),
];
