/**
 * user.controller.js — Manejo HTTP de gestión de usuarios.
 *
 * RBAC (aplicado en las rutas con authorizeRoles):
 *  - ADMIN: crea, edita (incluido rol) y desactiva usuarios.
 *  - LAWYER / ASSISTANT: solo listan personal activo.
 *
 * El hasheo de contraseñas se hace ACÁ con helpers/bcrypt.js.
 */
import { hashPassword } from "../helpers/bcrypt.js";
import * as userService from "../services/user.service.js";

/** GET /api/v1/users — no ADMIN solo ven personal activo. */
export const listUsers = async (req, res, next) => {
  try {
    const isAdmin = req.user.role === "ADMIN";
    const users = await userService.listUsers({
      isActive: req.query.isActive,
      activeOnly: !isAdmin, // fuerza isActive=true para LAWYER/ASSISTANT
    });
    return res.json({ users });
  } catch (error) {
    return next(error);
  }
};

/** GET /api/v1/users/:id */
export const getUser = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);
    return res.json({ user });
  } catch (error) {
    return next(error);
  }
};

/** POST /api/v1/users — solo ADMIN. */
export const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, licenseNumber } = req.body;

    // Hasheo de la contraseña en el controller (bcrypt vía helper)
    const hashedPassword = await hashPassword(password);

    const user = await userService.createUser({
      name,
      email,
      password: hashedPassword,
      role,
      licenseNumber: licenseNumber || null,
    });

    const { password: _hash, ...safe } = user.get({ plain: true });
    return res.status(201).json({ message: "Usuario creado.", user: safe });
  } catch (error) {
    return next(error);
  }
};

/** PUT /api/v1/users/:id — solo ADMIN (puede cambiar rol). */
export const updateUser = async (req, res, next) => {
  try {
    const { password, ...rest } = req.body;

    // Si el ADMIN cambia la contraseña, se hashea antes de persistir
    const data = { ...rest };
    if (password) {
      data.password = await hashPassword(password);
    }

    const user = await userService.updateUser(req.params.id, data);
    return res.json({ message: "Usuario actualizado.", user });
  } catch (error) {
    return next(error);
  }
};

/** DELETE /api/v1/users/:id — solo ADMIN; baja lógica (isActive=false). */
export const deleteUser = async (req, res, next) => {
  try {
    // Evita que el ADMIN se desactive a sí mismo y pierda el control
    if (req.params.id === req.user.id) {
      return res
        .status(400)
        .json({ message: "No puede desactivarse a sí mismo." });
    }

    const user = await userService.deactivateUser(req.params.id);
    return res.json({ message: "Usuario desactivado.", user });
  } catch (error) {
    return next(error);
  }
};
