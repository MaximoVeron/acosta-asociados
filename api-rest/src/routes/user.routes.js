/**
 * user.routes.js — Rutas de gestión de usuarios /api/v1/users.
 *
 * RBAC:
 *  - Listar: cualquier usuario autenticado (LAWYER/ASSISTANT solo ven
 *    personal activo; esa regla vive en user.controller.js).
 *  - Crear, editar (roles) y desactivar: exclusivo de ADMIN.
 */
import { Router } from "express";
import {
  listUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/user.controller.js";
import {
  createUserRules,
  updateUserRules,
  userIdParamRules,
  listUsersQueryRules,
} from "../validators/userValidator.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { verifyToken, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = Router();

// Todas las rutas de usuarios requieren sesión válida
router.use(verifyToken);

router.get("/", validateRequest(listUsersQueryRules), listUsers);
router.get("/:id", validateRequest(userIdParamRules), getUser);

// Gestión exclusiva de ADMIN
router.post(
  "/",
  authorizeRoles("ADMIN"),
  validateRequest(createUserRules),
  createUser,
);
router.put(
  "/:id",
  authorizeRoles("ADMIN"),
  validateRequest(updateUserRules),
  updateUser,
);
router.delete(
  "/:id",
  authorizeRoles("ADMIN"),
  validateRequest(userIdParamRules),
  deleteUser,
);

export default router;
