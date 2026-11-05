/**
 * helpers/jwt.js — Única puerta de entrada a jsonwebtoken.
 *
 * Toda la lógica de emisión/verificación de tokens vive acá.
 * Quienes la usan: auth.controller.js (login → generateToken) y
 * authMiddleware.js (verifyToken → verifyJwt).
 */
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

/**
 * Genera un JWT firmado con el payload del usuario.
 * @param {object} payload Datos mínimos: { id, role, email, name }
 * @returns {string} token firmado
 */
export const generateToken = (payload) =>
  jwt.sign(payload, env.jwt.secret, { expiresIn: env.jwt.expiresIn });

/**
 * Verifica la firma y vigencia de un JWT.
 * Lanza TokenExpiredError / JsonWebTokenError si falla.
 * @param {string} token
 * @returns {object} payload decodificado
 */
export const verifyJwt = (token) => jwt.verify(token, env.jwt.secret);
