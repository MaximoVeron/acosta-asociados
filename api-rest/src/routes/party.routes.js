/**
 * party.routes.js — Rutas de Partes /api/v1/parties.
 * CRUD completo + búsqueda, accesible para usuarios autenticados.
 */
import { Router } from "express";
import {
  listParties,
  getParty,
  createParty,
  updateParty,
  deleteParty,
} from "../controllers/party.controller.js";
import {
  createPartyRules,
  updatePartyRules,
  partyIdParamRules,
  searchPartiesQueryRules,
} from "../validators/partyValidator.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = Router();

// Todas las rutas de partes requieren sesión válida
router.use(verifyToken);

router.get("/", validateRequest(searchPartiesQueryRules), listParties);
router.get("/:id", validateRequest(partyIdParamRules), getParty);
router.post("/", validateRequest(createPartyRules), createParty);
router.put("/:id", validateRequest(updatePartyRules), updateParty);
router.delete("/:id", validateRequest(partyIdParamRules), deleteParty);

export default router;
