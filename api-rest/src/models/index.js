/**
 * models/index.js — Registro de modelos y asociaciones.
 *
 * Patrón: cada archivo de modelo exporta una función define*(sequelize)
 * para evitar imports circulares. Este módulo es el único punto que
 * instancia los modelos y cablea las relaciones; services y controllers
 * importan { User, Party, Contract } desde aquí.
 */
import { sequelize } from "../config/database.js";
import { defineUser } from "./User.js";
import { defineParty } from "./Party.js";
import { defineContract } from "./Contract.js";

export const User = defineUser(sequelize);
export const Party = defineParty(sequelize);
export const Contract = defineContract(sequelize);

// --- Asociaciones: Contract ↔ Party ---
// Un contrato tiene un contratante y un contratista (ambos Party).
Contract.belongsTo(Party, { as: "contractor", foreignKey: "contractorId" });
Contract.belongsTo(Party, { as: "contractee", foreignKey: "contracteeId" });
Party.hasMany(Contract, { as: "contractsAsContractor", foreignKey: "contractorId" });
Party.hasMany(Contract, { as: "contractsAsContractee", foreignKey: "contracteeId" });

// --- Asociaciones: Contract ↔ User ---
// Un contrato registra quién lo creó y (al aprobarse) quién lo aprobó.
Contract.belongsTo(User, { as: "createdBy", foreignKey: "createdById" });
Contract.belongsTo(User, { as: "approvedBy", foreignKey: "approvedById" });
User.hasMany(Contract, { as: "createdContracts", foreignKey: "createdById" });
User.hasMany(Contract, { as: "approvedContracts", foreignKey: "approvedById" });

// Incluye por defecto al listar/buscar contratos, útil para los GET de
// la ruta /api/v1/contracts (partes + usuario creador + aprobador).
export const CONTRACT_DEFAULT_INCLUDE = [
  { model: Party, as: "contractor" },
  { model: Party, as: "contractee" },
  {
    model: User,
    as: "createdBy",
    attributes: { exclude: ["password"] },
  },
  {
    model: User,
    as: "approvedBy",
    attributes: { exclude: ["password"] },
  },
];

export { sequelize };
