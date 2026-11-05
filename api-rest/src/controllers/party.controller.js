/**
 * party.controller.js — Manejo HTTP de Partes / Entidades Externas.
 * Accesible para cualquier usuario autenticado (verifyToken en las rutas).
 */
import * as partyService from "../services/party.service.js";

/** GET /api/v1/parties?search=... — búsqueda por Razón Social o CUIT/DNI. */
export const listParties = async (req, res, next) => {
  try {
    const parties = await partyService.listParties(req.query.search);
    return res.json({ parties });
  } catch (error) {
    return next(error);
  }
};

/** GET /api/v1/parties/:id */
export const getParty = async (req, res, next) => {
  try {
    const party = await partyService.getPartyById(req.params.id);
    return res.json({ party });
  } catch (error) {
    return next(error);
  }
};

/** POST /api/v1/parties */
export const createParty = async (req, res, next) => {
  try {
    const party = await partyService.createParty(req.body);
    return res.status(201).json({ message: "Parte creada correctamente.", party });
  } catch (error) {
    return next(error);
  }
};

/** PUT /api/v1/parties/:id */
export const updateParty = async (req, res, next) => {
  try {
    const party = await partyService.updateParty(req.params.id, req.body);
    return res.json({ message: "Parte actualizada correctamente.", party });
  } catch (error) {
    return next(error);
  }
};

/** DELETE /api/v1/parties/:id — baja lógica (isActive=false). */
export const deleteParty = async (req, res, next) => {
  try {
    const party = await partyService.deactivateParty(req.params.id);
    return res.json({ message: "Parte desactivada correctamente.", party });
  } catch (error) {
    return next(error);
  }
};
