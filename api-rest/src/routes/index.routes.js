/**
 * index.routes.js — Punto de montaje de todas las rutas REST.
 * Se monta en app.js bajo el prefijo /api/v1.
 */
import { Router } from "express";
import authRoutes from "./auth.routes.js";
import userRoutes from "./user.routes.js";
import partyRoutes from "./party.routes.js";
import contractRoutes from "./contract.routes.js";
import aiRoutes from "./ai.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/parties", partyRoutes);
router.use("/contracts", contractRoutes);
router.use("/ai", aiRoutes);

export default router;
