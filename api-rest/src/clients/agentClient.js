/**
 * clients/agentClient.js — Cliente del microservicio IA (Python/FastAPI).
 *
 * Único punto del backend que habla con el servicio de IA. La URL base y el
 * timeout se configuran en src/config/env.js (AI_API_URL, AI_TIMEOUT_MS).
 *
 * El timeout es alto a propósito: el LLM local (qwen3:4b con razonamiento)
 * puede tardar varios minutos por turno en CPU.
 */
import { env } from "../config/env.js";
import { createHttpError } from "../middlewares/errorHandler.js";

/**
 * Envía un turno de la conversación al microservicio y devuelve su respuesta.
 *
 * @param {{ prompt: string, document_type: string, current_data: object|null }} payload
 * @returns {Promise<object>} { status, current_data, missing_fields, agent_message, rendered_document }
 * @throws Error con statusCode 502/504 si el servicio no responde.
 */
export const processDocumentTurn = async (payload) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.ai.timeoutMs);

  try {
    const response = await fetch(`${env.ai.baseUrl}/ai/process-contract`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      // FastAPI responde los errores del agente en `detail`
      const body = await response.json().catch(() => null);
      throw createHttpError(
        502,
        body?.detail || `El microservicio de IA respondió ${response.status}.`,
      );
    }

    return await response.json();
  } catch (error) {
    if (error.statusCode) throw error;
    if (error.name === "AbortError") {
      throw createHttpError(
        504,
        `El microservicio de IA no respondió en ${Math.round(env.ai.timeoutMs / 1000)} segundos.`,
      );
    }
    throw createHttpError(
      502,
      `No se pudo conectar con el microservicio de IA en ${env.ai.baseUrl}. Verifique que esté corriendo.`,
    );
  } finally {
    clearTimeout(timeout);
  }
};
