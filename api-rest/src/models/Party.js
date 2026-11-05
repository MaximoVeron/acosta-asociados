/**
 * Party.js — Modelo de Parte / Entidad Externa.
 *
 * Personas físicas o jurídicas que intervienen en contratos o expedientes
 * (Clientes, Contratantes, Prestadores, Contrapartes).
 * IMPORTANTE: las Party NO inician sesión; no tienen credenciales.
 * Quienes inician sesión son los User (src/models/User.js).
 *
 * MODELO PURAMENTE DECLARATIVO: la validación de datos vive en
 * src/validators/partyValidator.js (express-validator).
 */
import { DataTypes } from "sequelize";

/** Tipos de parte válidos (los consumen los validators). */
export const ENTITY_TYPES = ["INDIVIDUAL", "COMPANY"];

export const defineParty = (sequelize) => {
  const Party = sequelize.define(
    "Party",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      legalName: {
        // Nombre completo (persona física) o Razón Social (persona jurídica)
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      taxId: {
        // CUIT / CUIL / DNI — identificador fiscal único
        type: DataTypes.STRING(30),
        allowNull: false,
        unique: true,
      },
      entityType: {
        type: DataTypes.ENUM(...ENTITY_TYPES),
        allowNull: false,
      },
      address: {
        // Domicilio legal
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING(160),
        allowNull: true,
      },
      phone: {
        type: DataTypes.STRING(40),
        allowNull: true,
      },
      representative: {
        // Datos del socio gerente o apoderado, si aplica
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      tableName: "parties",
    },
  );

  return Party;
};
