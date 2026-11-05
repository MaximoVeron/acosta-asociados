/**
 * Contract.js — Modelo de Contrato.
 *
 * Ciclo de vida (status):
 *   DRAFT → UNDER_REVIEW → APPROVED (solo LAWYER/ADMIN, RF07)
 *                        ↘ CANCELLED
 *
 * Relaciones (definidas en src/models/index.js):
 *   contractorId → Party (el contratante / cliente)
 *   contracteeId → Party (la contraparte / prestadora)
 *   createdById  → User  (quién cargó el contrato)
 *   approvedById → User  (quién lo aprobó, nullable hasta la aprobación)
 */
import { DataTypes } from "sequelize";

/** Estados válidos del contrato. */
export const CONTRACT_STATUSES = [
  "DRAFT",
  "UNDER_REVIEW",
  "APPROVED",
  "CANCELLED",
];

export const defineContract = (sequelize) => {
  const Contract = sequelize.define(
    "Contract",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      title: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: { notEmpty: { msg: "El título es obligatorio." } },
      },
      type: {
        // Ej.: 'PRESTACION_SERVICIOS', 'LOCACION', 'CONVENIO', ...
        type: DataTypes.STRING(80),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM(...CONTRACT_STATUSES),
        allowNull: false,
        defaultValue: "DRAFT",
      },
      extractedData: {
        // Datos estructurados del contrato (plazos, montos, objeto, etc.).
        // JSONB permite consultarlos eficientemente en PostgreSQL.
        type: DataTypes.JSONB,
        allowNull: true,
      },
      content: {
        // Cuerpo completo del contrato en texto
        type: DataTypes.TEXT,
        allowNull: true,
      },
      contractorId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      contracteeId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      createdById: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      approvedById: {
        type: DataTypes.UUID,
        allowNull: true,
      },
    },
    {
      tableName: "contracts",
    },
  );

  return Contract;
};
