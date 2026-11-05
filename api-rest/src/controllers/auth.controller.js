/**
 * auth.controller.js — Manejo HTTP de autenticación.
 *
 * ACÁ vive el "seteo" de la contraseña y del token (nunca en los modelos):
 *  - register: hashea la contraseña con helpers/bcrypt.js antes del service.
 *  - login:    compara con helpers/bcrypt.js y emite el JWT con
 *              helpers/jwt.js, inyectándolo en la cookie HttpOnly `token`.
 */
import { hashPassword, comparePassword } from "../helpers/bcrypt.js";
import { generateToken } from "../helpers/jwt.js";
import { authCookieOptions } from "../config/env.js";
import * as authService from "../services/auth.service.js";

/** Devuelve el usuario plano sin el hash de contraseña. */
const toSafeUser = (user) => {
  const { password, ...safe } = user.get({ plain: true });
  return safe;
};

/** POST /api/v1/auth/register */
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role, licenseNumber } = req.body;

    // Hasheo de la contraseña en el controller (bcrypt vía helper)
    const hashedPassword = await hashPassword(password);

    const user = await authService.registerUser({
      name,
      email,
      password: hashedPassword,
      role,
      licenseNumber,
    });

    return res.status(201).json({
      message: "Usuario registrado correctamente.",
      user: toSafeUser(user),
    });
  } catch (error) {
    return next(error);
  }
};

/** POST /api/v1/auth/login */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await authService.findUserByEmail(email);
    // Mensaje único para usuario inexistente y contraseña incorrecta:
    // no revelar qué emails están registrados.
    if (!user) {
      return res.status(401).json({ message: "Credenciales inválidas." });
    }
    if (!user.isActive) {
      return res
        .status(401)
        .json({ message: "Usuario desactivado. Contacte al administrador." });
    }

    const passwordOk = await comparePassword(password, user.password);
    if (!passwordOk) {
      return res.status(401).json({ message: "Credenciales inválidas." });
    }

    // Emisión del JWT (helpers/jwt.js) y cookie HttpOnly
    const token = generateToken({
      id: user.id,
      role: user.role,
      email: user.email,
      name: user.name,
    });
    res.cookie("token", token, authCookieOptions);

    return res.json({
      message: "Inicio de sesión exitoso.",
      user: toSafeUser(user),
    });
  } catch (error) {
    return next(error);
  }
};

/** POST /api/v1/auth/logout */
export const logout = (req, res) => {
  res.clearCookie("token", { path: authCookieOptions.path });
  return res.json({ message: "Sesión cerrada correctamente." });
};

/** GET /api/v1/auth/me — requiere verifyToken (req.user ya cargado). */
export const me = (req, res) => {
  return res.json({ user: toSafeUser(req.user) });
};
