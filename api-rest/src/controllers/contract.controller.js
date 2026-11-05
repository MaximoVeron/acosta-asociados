/**
 * contract.controller.js — Manejo HTTP de Contratos.
 *
 * RF07: el endpoint de aprobación (PATCH /:id/approve) está protegido en
 * la ruta por authorizeRoles('LAWYER','ADMIN'); el service registra
 * approvedById = req.user.id.
 */
import * as contractService from "../services/contract.service.js";

/** GET /api/v1/contracts — lista con partes y usuarios relacionados. */
export const listContracts = async (req, res, next) => {
  try {
    const contracts = await contractService.listContracts();
    return res.json({ contracts });
  } catch (error) {
    return next(error);
  }
};

/** GET /api/v1/contracts/:id */
export const getContract = async (req, res, next) => {
  try {
    const contract = await contractService.getContractById(req.params.id);
    return res.json({ contract });
  } catch (error) {
    return next(error);
  }
};

/** POST /api/v1/contracts — creado por el usuario autenticado. */
export const createContract = async (req, res, next) => {
  try {
    const contract = await contractService.createContract(
      req.body,
      req.user.id, // createdById = quien inicia el borrador
    );
    return res
      .status(201)
      .json({ message: "Contrato creado correctamente.", contract });
  } catch (error) {
    return next(error);
  }
};

/** PUT /api/v1/contracts/:id — actualiza datos o contenido. */
export const updateContract = async (req, res, next) => {
  try {
    const contract = await contractService.updateContract(req.params.id, req.body);
    return res.json({ message: "Contrato actualizado correctamente.", contract });
  } catch (error) {
    return next(error);
  }
};

/**
 * PATCH /api/v1/contracts/:id/approve — RF07.
 * Solo LAWYER/ADMIN llegan acá (lo garantiza authorizeRoles en la ruta).
 */
export const approveContract = async (req, res, next) => {
  try {
    const contract = await contractService.approveContract(
      req.params.id,
      req.user.id, // approvedById = el abogado/admin que aprueba
    );
    return res.json({ message: "Contrato aprobado formalmente.", contract });
  } catch (error) {
    return next(error);
  }
};
