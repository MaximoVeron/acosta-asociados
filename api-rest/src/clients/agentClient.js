/**
 * clients/agentClient.js — STUB del cliente del microservicio de IA (Python).
 *
 * Preparado para la futura integración: cuando el microservicio esté
 * disponible, exponerá endpoints para extraer datos estructurados del
 * texto de un contrato (plazos, montos, objeto) que se guardarán en
 * Contract.extractedData (JSONB).
 *
 * La URL base y el timeout se configuran en src/config/env.js
 * (AI_API_URL, AI_TIMEOUT_MS). Este cliente NO está conectado a ninguna
 * ruta todavía.
 */
import { env } from "../config/env.js";

/**
 * Extrae datos estructurados del contenido de un contrato usando el
 * microservicio de IA.
 *
 * @param {string} content Cuerpo completo del contrato en texto.
 * @returns {Promise<object>} Datos extraídos (objeto, monto, plazos, ...).
 * @throws Error si el microservicio no responde o responde con error.
 *
 * STUB: la implementación real ya está escrita contra la API acordada
 * (POST {AI_API_URL}/extract con { content }); cuando el servicio Python
 * no exista, la llamada fallará y el caller deberá decidir si continuar
 * sin extractedData.
 */
export const extractContractData = async (content) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.ai.timeoutMs);

  try {
    const response = await fetch(`${env.ai.baseUrl}/extract`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(
        `El microservicio de IA respondió ${response.status}: ${response.statusText}`,
      );
    }

    return await response.json();
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(
        `Timeout de ${env.ai.timeoutMs}ms al contactar el microservicio de IA.`,
      );
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
};

/**
 * Health-check del microservicio de IA.
 * STUB: útil para verificar la conexión cuando se integre el servicio.
 * @returns {Promise<boolean>} true si el servicio responde.
 */
export const checkAgentHealth = async () => {
  try {
    const response = await fetch(`${env.ai.baseUrl}/health`, {
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
};
