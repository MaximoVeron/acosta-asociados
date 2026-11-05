/**
 * contract.routes.js — Rutas de Contratos /api/v1/contracts.
 *
 * RF07: PATCH /:id/approve está protegido por
 * authorizeRoles('LAWYER','ADMIN') — ASSISTANT nunca puede aprobar.
 */
import { Router } from "express";
import {
  listContracts,
  getContract,
  createContract,
  updateContract,
  approveContract,
} from "../controllers/contract.controller.js";
import {
  createContractRules,
  updateContractRules,
  contractIdParamRules,
} from "../validators/contractValidator.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { verifyToken, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = Router();

// Todas las rutas de contratos requieren sesión válida
router.use(verifyToken);

router.get("/", listContracts);
router.get("/:id", validateRequest(contractIdParamRules), getContract);

// Cualquier rol autenticado (incluido ASSISTANT) puede crear borradores
router.post("/", validateRequest(createContractRules), createContract);

router.put("/:id", validateRequest(updateContractRules), updateContract);

// Endpoint crítico (RF07): aprobación formal exclusiva de LAWYER/ADMIN
router.patch(
  "/:id/approve",
  authorizeRoles("LAWYER", "ADMIN"),
  validateRequest(contractIdParamRules),
  approveContract,
);

export default router;
