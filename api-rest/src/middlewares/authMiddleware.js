/**
 * authMiddleware.js — Autenticación (JWT) y autorización (RBAC).
 *
 * verifyToken:      valida el JWT de la sesión y carga el usuario en req.user.
 * authorizeRoles:   restringe una ruta a los roles indicados (usar SIEMPRE
 *                   después de verifyToken).
 *
 * El JWT viaja en la cookie HttpOnly `token` (seteada en el login). Como
 * respaldo se acepta el header `Authorization: Bearer <token>`, útil para
 * probar la API con clientes como Postman/Thunder Client sin cookies.
 *
 * La verificación criptográfica delega en src/helpers/jwt.js.
 */
import { verifyJwt } from "../helpers/jwt.js";
import { User } from "../models/index.js";

/** Extrae el token de la cookie `token` o del header Authorization. */
const extractToken = (req) => {
  const cookieToken = req.cookies?.token;
  if (cookieToken) return cookieToken;

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length).trim();
  }
  return null;
};

/**
 * Middleware de autenticación: verifica el JWT y adjunta el usuario
 * activo a req.user. Responde 401 ante token ausente, inválido,
 * expirado o usuario inexistente/desactivado.
 */
export const verifyToken = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return res
        .status(401)
        .json({ message: "No autenticado: falta el token de sesión." });
    }

    const payload = verifyJwt(token);

    // Se recarga el usuario desde la DB para reflejar cambios de rol o
    // desactivaciones hechas después de emitido el token.
    const user = await User.findByPk(payload.id);
    if (!user) {
      return res.status(401).json({ message: "No autenticado: usuario inexistente." });
    }
    if (!user.isActive) {
      return res.status(401).json({ message: "Usuario desactivado. Contacte al administrador." });
    }

    req.user = user;
    return next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Sesión expirada, inicie sesión nuevamente." });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Token inválido." });
    }
    return next(error);
  }
};

/**
 * Middleware de autorización por roles (RBAC).
 * Uso: router.patch("/:id/approve", verifyToken, authorizeRoles("LAWYER", "ADMIN"), handler)
 *
 * @param {...string} roles Roles permitidos (valores de USER_ROLES).
 */
export const authorizeRoles = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "No autenticado." });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      message: "Acceso denegado: su rol no tiene permisos para esta operación.",
      requiredRoles: roles,
    });
  }
  return next();
};
