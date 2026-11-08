/**
 * ai.routes.js — Rutas del asistente IA /api/v1/ai.
 *
 * Requieren sesión válida: el backend actúa de proxy autenticado hacia el
 * microservicio Python (POST {AI_API_URL}/ai/process-contract).
 */
import { Router } from "express";
import { processDocument } from "../controllers/ai.controller.js";
import { processDocumentRules } from "../validators/aiValidator.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = Router();

router.use(verifyToken);
router.post("/process", validateRequest(processDocumentRules), processDocument);

export default router;
