/**
 * errorHandler.js — Manejo centralizado de errores.
 *
 * notFoundHandler: 404 para rutas inexistentes.
 * errorHandler:     traduce errores conocidos (Sequelize, JWT, http-errors)
 *                   a respuestas JSON consistentes y registra el resto como 500.
 *
 * Convención: los services pueden lanzar errores con `statusCode` propio
 * (ej. const err = new Error("..."); err.statusCode = 404) y este handler
 * los respeta. En producción nunca se filtra el stack trace al cliente.
 */
import {
  ValidationError,
  UniqueConstraintError,
  ForeignKeyConstraintError,
} from "sequelize";
import { env } from "../config/env.js";

/**
 * Crea un Error con statusCode HTTP, para que los services lancen
 * errores de negocio (404, 409, ...) que el errorHandler traduce.
 * Uso: throw createHttpError(404, "Parte no encontrada.");
 */
export const createHttpError = (statusCode, message) =>
  Object.assign(new Error(message), { statusCode });

/** Responde 404 JSON para cualquier ruta no registrada. */
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    message: `Recurso no encontrado: ${req.method} ${req.originalUrl}`,
  });
};

/** Handler de errores (debe ir al final de la cadena de middlewares). */
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Error interno del servidor.";
  let details;

  // Validaciones de modelo Sequelize (allowNull, isEmail, notEmpty, ...)
  if (err instanceof ValidationError) {
    statusCode = 400;
    message = "Datos inválidos.";
    details = err.errors.map((e) => ({ field: e.path, message: e.message }));
  }

  // Índices únicos violados (email de User, taxId de Party, ...)
  if (err instanceof UniqueConstraintError) {
    statusCode = 409;
    message = "Ya existe un registro con esos datos (campo único duplicado).";
    details = err.errors.map((e) => ({ field: e.path, message: e.message }));
  }

  // FK inválidas (ej. contractorId inexistente al crear un contrato)
  if (err instanceof ForeignKeyConstraintError) {
    statusCode = 400;
    message = "Referencia inválida a otro registro (clave foránea inexistente).";
  }

  // Errores de JWT que pudieran llegar acá
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Token inválido.";
  }
  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Sesión expirada.";
  }

  // Solo loguear el detalle completo en el servidor
  if (statusCode >= 500) {
    console.error("💥 Error no controlado:", err);
  }

  res.status(statusCode).json({
    message,
    ...(details ? { errors: details } : {}),
    // Útil para depurar en desarrollo; oculto en producción
    ...(!env.isProduction && statusCode >= 500 ? { stack: err.stack } : {}),
  });
};
