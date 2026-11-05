/**
 * user.service.js — Lógica de negocio de gestión de usuarios.
 *
 * Solo interactúa con los modelos. Las contraseñas llegan YA hasheadas
 * desde el controller (helpers/bcrypt.js).
 */
import { User } from "../models/index.js";
import { createHttpError } from "../middlewares/errorHandler.js";

/** Nunca exponer el hash en respuestas de usuarios. */
const SAFE_ATTRIBUTES = { exclude: ["password"] };

/**
 * Lista usuarios.
 * @param {object} options
 * @param {boolean} [options.isActive] filtro opcional por estado.
 * @param {boolean} options.activeOnly cuando true, fuerza solo activos
 *        (regla RBAC: LAWYER/ASSISTANT solo ven personal activo).
 */
export const listUsers = async ({ isActive, activeOnly = false } = {}) => {
  const where = {};
  if (activeOnly) {
    where.isActive = true;
  } else if (typeof isActive === "boolean") {
    where.isActive = isActive;
  }
  return User.findAll({ where, attributes: SAFE_ATTRIBUTES, order: [["createdAt", "DESC"]] });
};

/** Obtiene un usuario por id (sin password). @throws 404 si no existe. */
export const getUserById = async (id) => {
  const user = await User.findByPk(id, { attributes: SAFE_ATTRIBUTES });
  if (!user) {
    throw createHttpError(404, "Usuario no encontrado.");
  }
  return user;
};

/**
 * Crea un usuario (flujo ADMIN). Recibe la contraseña YA hasheada.
 * @throws 409 si el email ya existe.
 */
export const createUser = async (data) => {
  const existing = await User.findOne({ where: { email: data.email } });
  if (existing) {
    throw createHttpError(409, "Ya existe un usuario con ese email.");
  }
  return User.create(data);
};

/**
 * Actualiza un usuario. Si viene `password`, el controller ya lo hasheó.
 * @throws 404 si no existe.
 */
export const updateUser = async (id, data) => {
  const user = await User.findByPk(id);
  if (!user) {
    throw createHttpError(404, "Usuario no encontrado.");
  }

  // Evita colisión de email con OTRO usuario existente
  if (data.email && data.email !== user.email) {
    const existing = await User.findOne({ where: { email: data.email } });
    if (existing) {
      throw createHttpError(409, "Ya existe otro usuario con ese email.");
    }
  }

  await user.update(data);
  const { password, ...safe } = user.get({ plain: true });
  return safe;
};

/**
 * Desactiva un usuario (baja lógica; conserva sus contratos creados/aprobados).
 * @throws 404 si no existe.
 */
export const deactivateUser = async (id) => {
  const user = await User.findByPk(id);
  if (!user) {
    throw createHttpError(404, "Usuario no encontrado.");
  }
  await user.update({ isActive: false });
  const { password, ...safe } = user.get({ plain: true });
  return safe;
};
