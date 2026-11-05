/**
 * validateRequest.js — Middleware reutilizable de validación.
 *
 * Recibe un array de cadenas de validación de express-validator
 * (definidas en src/validators/), las ejecuta sobre el request y,
 * si hay errores, responde 422 con el detalle sin llegar al controller.
 *
 * Uso en rutas:
 *   router.post("/", validateRequest(createPartyRules), createParty);
 */
import { validationResult } from "express-validator";

export const validateRequest = (validations) => {
  return async (req, res, next) => {
    try {
      // Ejecuta todas las cadenas de validación en paralelo
      await Promise.all(validations.map((validation) => validation.run(req)));

      const errors = validationResult(req);
      if (errors.isEmpty()) {
        return next();
      }

      // Devuelve una lista limpia: campo + mensaje
      return res.status(422).json({
        message: "Error de validación en la solicitud.",
        errors: errors.array().map((err) => ({
          field: err.path,
          message: err.msg,
        })),
      });
    } catch (error) {
      return next(error);
    }
  };
};
