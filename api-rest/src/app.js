/**
 * app.js — Configuración de la aplicación Express.
 *
 * Orden de middlewares (importante):
 *  1. cors (con credentials: true para permitir la cookie HttpOnly)
 *  2. express.json (parseo de cuerpos JSON)
 *  3. cookie-parser (lectura de req.cookies.token)
 *  4. rutas /api/v1
 *  5. notFoundHandler (404)
 *  6. errorHandler (centralizado, siempre al final)
 *
 * Este módulo NO levanta el servidor ni toca la base de datos:
 * eso lo hace server.js, que importa esta app.
 */
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import apiRoutes from "./routes/index.routes.js";
import { notFoundHandler, errorHandler } from "./middlewares/errorHandler.js";

const app = express();

// CORS: credenciales habilitadas para que el frontend (otro origen)
// pueda enviar y recibir la cookie HttpOnly `token`.
app.use(
  cors({
    origin: env.cors.origins,
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

// Health-check simple (no requiere autenticación ni DB)
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "acosta-asociados-api", env: env.nodeEnv });
});

// Rutas REST bajo el prefijo de versión
app.use("/api/v1", apiRoutes);

// 404 + manejo centralizado de errores (siempre al final)
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
