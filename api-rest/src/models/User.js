/**
 * User.js — Modelo de Usuario del Sistema (quienes inician sesión).
 *
 * Roles (RBAC):
 *  - ADMIN:     control total del sistema y gestión de usuarios.
 *  - LAWYER:    abogado matriculado; junto con ADMIN es el único rol
 *               autorizado a aprobar contratos (RF07).
 *  - ASSISTANT: personal administrativo; puede cargar partes y pasar
 *               contratos a revisión, pero NUNCA aprobarlos.
 *
 * MODELO PURAMENTE DECLARATIVO:
 *  - El hasheo de contraseñas vive en src/helpers/bcrypt.js y lo invocan
 *    los controllers (auth.controller.js / user.controller.js).
 *  - La validación de datos vive en src/validators/ (express-validator).
 *  - La emisión/verificación de JWT vive en src/helpers/jwt.js.
 */
import { DataTypes } from "sequelize";

/** Roles válidos del sistema (lo consumen validators y middlewares). */
export const USER_ROLES = ["ADMIN", "LAWYER", "ASSISTANT"];

export const defineUser = (sequelize) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(120),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(160),
        allowNull: false,
        unique: true,
      },
      password: {
        // Se almacena SIEMPRE hasheada (bcrypt); el hasheo se hace en el
        // controller antes de llamar al service, nunca en el modelo.
        type: DataTypes.STRING,
        allowNull: false,
      },
      role: {
        type: DataTypes.ENUM(...USER_ROLES),
        allowNull: false,
        defaultValue: "ASSISTANT",
      },
      licenseNumber: {
        // Matrícula del abogado (nullable para los demás roles)
        type: DataTypes.STRING(60),
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      tableName: "users",
    },
  );

  return User;
};
