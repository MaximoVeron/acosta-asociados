/**
 * database.js — Instancia y conexión de Sequelize.
 *
 * Exporta la instancia única `sequelize` que usan los modelos
 * (src/models/index.js) y una función para probar la conexión
 * al iniciar el servidor.
 */
import { Sequelize } from "sequelize";
import { env } from "./env.js";

export const sequelize = new Sequelize(
  env.db.name,
  env.db.user,
  env.db.password,
  {
    host: env.db.host,
    port: env.db.port,
    dialect: env.db.dialect,
    // Sin logs SQL en producción; en desarrollo ayudan a depurar
    logging: env.isProduction ? false : console.log,
  },
);

/**
 * Verifica la conexión con PostgreSQL. Lanza un error con la causa
 * original si no se pudo conectar (el servidor aborta el arranque).
 */
export const testDbConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Conexión a la base de datos establecida correctamente.");
  } catch (error) {
    console.error("❌ No se pudo conectar a la base de datos:", error.message);
    throw new Error("Database connection failed", { cause: error });
  }
};
