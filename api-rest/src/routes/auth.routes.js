/**
 * auth.routes.js — Rutas de autenticación /api/v1/auth.
 */
import { Router } from "express";
import { register, login, logout, me } from "../controllers/auth.controller.js";
import { registerRules, loginRules } from "../validators/authValidator.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = Router();

// Registro público con validación de inputs; la contraseña se hashea
// en el controller (helpers/bcrypt.js).
router.post("/register", validateRequest(registerRules), register);

// Login: verifica credenciales, genera el JWT (helpers/jwt.js) y lo
// inyecta en la cookie HttpOnly `token`.
router.post("/login", validateRequest(loginRules), login);

// Logout: limpia la cookie `token`.
router.post("/logout", logout);

// Perfil del usuario autenticado.
router.get("/me", verifyToken, me);

export default router;
