/**
 * auth.service.js — Lógica de negocio de autenticación.
 *
 * Solo interactúa con los modelos. NO hashea contraseñas ni genera
 * tokens: eso lo hacen los helpers (bcrypt.js / jwt.js) invocados
 * desde auth.controller.js.
 */
import { User } from "../models/index.js";
import { createHttpError } from "../middlewares/errorHandler.js";

/**
 * Registra un usuario nuevo. Recibe la contraseña YA hasheada.
 * @throws 409 si el email ya existe.
 */
export const registerUser = async ({ name, email, password, role, licenseNumber }) => {
  const existing = await User.findOne({ where: { email } });
  if (existing) {
    throw createHttpError(409, "Ya existe un usuario registrado con ese email.");
  }

  const user = await User.create({
    name,
    email,
    password, // hash bcrypt generado en el controller
    role: role || "ASSISTANT",
    licenseNumber: licenseNumber || null,
  });

  return user;
};

/** Busca un usuario por email (incluye el password para la comparación). */
export const findUserByEmail = async (email) => {
  return User.findOne({ where: { email } });
};
