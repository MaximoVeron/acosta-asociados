/**
 * ai.controller.js — Puente HTTP entre el frontend y el microservicio IA.
 *
 * El navegador nunca llama directo al servicio Python: pasa por acá, con la
 * cookie JWT verificada, para que la IA quede detrás de la autenticación del
 * backend y en un solo origen.
 */
import * as agentClient from "../clients/agentClient.js";

/** POST /api/v1/ai/process — procesa un turno del asistente. */
export const processDocument = async (req, res, next) => {
  try {
    const { prompt, document_type = "CONTRATO", current_data = null } = req.body;

    const resultado = await agentClient.processDocumentTurn({
      prompt,
      document_type,
      current_data,
    });

    return res.json(resultado);
  } catch (error) {
    return next(error);
  }
};
