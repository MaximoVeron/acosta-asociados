/**
 * server.js — Punto de entrada del servidor.
 *
 * Secuencia de arranque:
 *  1. Verifica la conexión con PostgreSQL.
 *  2. Sincroniza el esquema de Sequelize (en desarrollo usa alter:true
 *     para reflejar cambios de modelos sin migraciones).
 *  3. Ejecuta el seeder automático (findOrCreate, idempotente).
 *  4. Levanta el servidor Express (src/app.js).
 */
import app from "./src/app.js";
import { env } from "./src/config/env.js";
import { sequelize, testDbConnection } from "./src/config/database.js";
import { runSeed } from "./src/config/seed.js";

const start = async () => {
  try {
    // 1. Conexión a la base de datos
    await testDbConnection();

    // 2. Sincronización del esquema
    // alter:true solo en desarrollo (conveniente pero potencialmente
    // destructivo); en producción el esquema se gestiona con migraciones.
    await sequelize.sync({ alter: !env.isProduction });
    console.log("🔄 Esquema de base de datos sincronizado.");

    // 3. Semilla de datos de desarrollo (idempotente)
    await runSeed();

    // 4. Servidor Express
    app.listen(env.port, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${env.port}`);
      console.log(`   Entorno: ${env.nodeEnv}`);
      console.log(`   Health-check: http://localhost:${env.port}/api/health`);
    });
  } catch (error) {
    console.error("❌ Error al iniciar el servidor:", error.message);
    process.exit(1);
  }
};

start();
