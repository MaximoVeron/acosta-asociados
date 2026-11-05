/**
 * helpers/bcrypt.js — Única puerta de entrada a bcrypt.
 *
 * Toda la lógica de hasheo/comparación de contraseñas vive acá.
 * Quienes la usan: auth.controller.js (register/login),
 * user.controller.js (alta/edición de usuarios por ADMIN) y seed.js.
 */
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

/**
 * Hashea una contraseña en texto plano.
 * @param {string} plainPassword
 * @returns {Promise<string>} hash bcrypt
 */
export const hashPassword = (plainPassword) =>
  bcrypt.hash(plainPassword, SALT_ROUNDS);

/**
 * Compara una contraseña en texto plano contra un hash almacenado.
 * @param {string} plainPassword
 * @param {string} hashedPassword
 * @returns {Promise<boolean>}
 */
export const comparePassword = (plainPassword, hashedPassword) =>
  bcrypt.compare(plainPassword, hashedPassword);
