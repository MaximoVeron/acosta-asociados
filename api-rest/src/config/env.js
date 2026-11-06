/**
 * env.js — Configuración central de variables de entorno.
 *
 * Único punto de lectura de process.env: el resto del código importa
 * `env` desde aquí, de modo que los nombres de variables y sus valores
 * por defecto viven en un solo lugar.
 */
import "dotenv/config";

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  isProduction: process.env.NODE_ENV === "production",
  port: Number(process.env.PORT) || 3000,

  db: {
    name: process.env.DB_NAME || "acosta_asociados",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 5432,
    dialect: process.env.DB_DIALECT || "postgres",
  },

  jwt: {
    secret: process.env.JWT_SECRET || "super-secreto-dev-acosta-2026",
    expiresIn: process.env.JWT_EXPIRES_IN || "8h",
  },

  // Orígenes permitidos por CORS (se admite una lista separada por comas)
  cors: {
    origins: (process.env.CORS_ORIGIN || "http://localhost:5173")
      .split(",")
      .map((origin) => origin.trim()),
  },

  // Microservicio de IA (Python) — usado por clients/agentClient.js
  // Timeout alto a propósito: el LLM local (qwen3:4b con razonamiento)
  // puede tardar varios minutos por turno en CPU.
  ai: {
    baseUrl: process.env.AI_API_URL || "http://localhost:8000",
    timeoutMs: Number(process.env.AI_TIMEOUT_MS) || 300000,
  },
};

/**
 * Opciones de la cookie que transporta el JWT.
 * httpOnly: no accesible desde JavaScript del navegador (mitiga XSS).
 * sameSite 'strict': no se envía en requests originados por otros sitios (mitiga CSRF).
 * secure: solo HTTPS, exigible en producción.
 */
export const authCookieOptions = {
  httpOnly: true,
  sameSite: "strict",
  secure: env.isProduction,
  path: "/",
};
