/**
 * party.service.js — Lógica de negocio de Partes / Entidades Externas.
 */
import { Op } from "sequelize";
import { Party } from "../models/index.js";
import { createHttpError } from "../middlewares/errorHandler.js";

/**
 * Lista partes con búsqueda opcional por Razón Social o CUIT/DNI.
 * @param {string} [search] término parcial (ILIKE).
 */
export const listParties = async (search) => {
  const where = {};
  if (search) {
    where[Op.or] = [
      { legalName: { [Op.iLike]: `%${search}%` } },
      { taxId: { [Op.iLike]: `%${search}%` } },
    ];
  }
  return Party.findAll({ where, order: [["legalName", "ASC"]] });
};

/** Obtiene una parte por id. @throws 404 si no existe. */
export const getPartyById = async (id) => {
  const party = await Party.findByPk(id);
  if (!party) {
    throw createHttpError(404, "Parte no encontrada.");
  }
  return party;
};

/**
 * Crea una parte. @throws 409 si el taxId ya existe.
 */
export const createParty = async (data) => {
  const existing = await Party.findOne({ where: { taxId: data.taxId } });
  if (existing) {
    throw createHttpError(409, "Ya existe una parte con ese CUIT/CUIL/DNI.");
  }
  return Party.create(data);
};

/**
 * Actualiza una parte. @throws 404 si no existe, 409 si el taxId colisiona.
 */
export const updateParty = async (id, data) => {
  const party = await Party.findByPk(id);
  if (!party) {
    throw createHttpError(404, "Parte no encontrada.");
  }

  if (data.taxId && data.taxId !== party.taxId) {
    const existing = await Party.findOne({ where: { taxId: data.taxId } });
    if (existing) {
      throw createHttpError(409, "Ya existe otra parte con ese CUIT/CUIL/DNI.");
    }
  }

  await party.update(data);
  return party;
};

/**
 * Baja lógica de una parte (isActive = false): preserva la integridad
 * referencial de los contratos que ya la usan.
 * @throws 404 si no existe.
 */
export const deactivateParty = async (id) => {
  const party = await Party.findByPk(id);
  if (!party) {
    throw createHttpError(404, "Parte no encontrada.");
  }
  await party.update({ isActive: false });
  return party;
};
