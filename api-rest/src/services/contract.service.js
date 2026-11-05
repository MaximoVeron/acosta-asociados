/**
 * contract.service.js — Lógica de negocio de Contratos.
 *
 * Reglas clave:
 *  - Todo contrato nace con createdById = usuario autenticado.
 *  - RF07: la aprobación (status APPROVED + approvedById) es exclusiva
 *    del flujo approveContract, protegido por authorizeRoles('LAWYER','ADMIN').
 */
import { Contract, Party, User, CONTRACT_DEFAULT_INCLUDE } from "../models/index.js";
import { createHttpError } from "../middlewares/errorHandler.js";

/** Lista todos los contratos con partes y usuarios relacionados. */
export const listContracts = async () => {
  return Contract.findAll({
    include: CONTRACT_DEFAULT_INCLUDE,
    order: [["createdAt", "DESC"]],
  });
};

/** Obtiene un contrato por id con sus relaciones. @throws 404. */
export const getContractById = async (id) => {
  const contract = await Contract.findByPk(id, { include: CONTRACT_DEFAULT_INCLUDE });
  if (!contract) {
    throw createHttpError(404, "Contrato no encontrado.");
  }
  return contract;
};

/** Valida que las Party referenciadas existan y estén activas. */
const assertPartiesExist = async ({ contractorId, contracteeId }) => {
  for (const partyId of [contractorId, contracteeId]) {
    const party = await Party.findByPk(partyId);
    if (!party) {
      throw createHttpError(400, `No existe la parte con id ${partyId}.`);
    }
  }
};

/**
 * Crea un contrato (borrador o en revisión) y lo vincula al usuario
 * autenticado como creador.
 */
export const createContract = async (data, createdById) => {
  await assertPartiesExist(data);

  return Contract.create({
    ...data,
    status: data.status || "DRAFT",
    createdById,
    approvedById: null,
  });
};

/**
 * Actualiza datos o contenido de un contrato.
 * Regla de negocio: un contrato APPROVED o CANCELLED ya no es editable.
 * @throws 404 si no existe, 409 si está en estado terminal.
 */
export const updateContract = async (id, data) => {
  const contract = await Contract.findByPk(id);
  if (!contract) {
    throw createHttpError(404, "Contrato no encontrado.");
  }
  if (["APPROVED", "CANCELLED"].includes(contract.status)) {
    throw createHttpError(
      409,
      `Un contrato en estado ${contract.status} no puede editarse.`,
    );
  }

  if (data.contractorId || data.contracteeId) {
    await assertPartiesExist({
      contractorId: data.contractorId || contract.contractorId,
      contracteeId: data.contracteeId || contract.contracteeId,
    });
  }

  await contract.update(data);
  return getContractById(id);
};

/**
 * RF07 — Aprobación formal de un contrato.
 * Solo llega acá quien pasó por authorizeRoles('LAWYER','ADMIN').
 * Setea status = 'APPROVED' y approvedById = usuario aprobador.
 * @throws 404 si no existe, 409 si ya está aprobado o cancelado.
 */
export const approveContract = async (id, approvedById) => {
  const contract = await Contract.findByPk(id);
  if (!contract) {
    throw createHttpError(404, "Contrato no encontrado.");
  }
  if (contract.status === "APPROVED") {
    throw createHttpError(409, "El contrato ya se encuentra aprobado.");
  }
  if (contract.status === "CANCELLED") {
    throw createHttpError(409, "No se puede aprobar un contrato cancelado.");
  }

  await contract.update({ status: "APPROVED", approvedById });
  return getContractById(id);
};
