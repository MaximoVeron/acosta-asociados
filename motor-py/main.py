"""
main.py — Microservicio IA "Acosta & Asociados" (FastAPI + Ollama).

Genera los DOS documentos oficiales del estudio a partir de lenguaje
natural (plantillas en document/, réplicas Jinja2 en templates/):
  - CONTRATO:   Contrato de Prestación de Servicios Profesionales
  - EXPEDIENTE: Expediente Jurídico

Endpoints:
  POST /ai/process-contract → endpoint principal (slot filling, RF02-RF05).
                              Acepta document_type: "CONTRATO" | "EXPEDIENTE".
  POST /extract             → adaptador para el cliente Node existente
                              (api-rest/src/clients/agentClient.js).
  GET  /health              → health-check del servicio.

Variables de entorno (todas con defaults funcionales):
  OLLAMA_MODEL    modelo local          (default: gpt-oss:120b-cloud)
  OLLAMA_HOST     host de Ollama        (default: http://localhost:11434)
  DEEPSEEK_API_KEY si está definida, se usa DeepSeek en lugar de Ollama
  DEEPSEEK_MODEL  modelo de DeepSeek    (default: deepseek-flash)
  PORT            puerto del servicio   (default: 8000)
  AI_CORS_ORIGINS orígenes CORS, separados por comas
                  (default: backend Node 3000 + frontend Vite 5173)

Ejecución:
  uv run uvicorn main:app --reload --port 8000   (o: uv run main.py)
"""
import os

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from schemas.contract import DocumentType, ProcessRequest, ProcessResponse
from services.agent_service import MODELO_ACTIVO, AgentError, process_chat

load_dotenv()

app = FastAPI(
    title="Acosta & Asociados — Microservicio IA",
    description=(
        "Slot filling para contratos: extrae datos de texto libre con un LLM "
        "local (Ollama), detecta faltantes (RF04) y renderiza la plantilla "
        "oficial con Jinja2 (RF05). El LLM nunca redacta cláusulas."
    ),
    version="1.0.0",
)

# CORS para que el backend Node (3000) y el frontend (5173) puedan llamar
_origins = os.getenv("AI_CORS_ORIGINS", "http://localhost:3000,http://localhost:5173")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _origins.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    """Estado del servicio y modelo configurado."""
    return {"status": "ok", "service": "acosta-ai-agent", "model": MODELO_ACTIVO}


@app.post("/ai/process-contract", response_model=ProcessResponse)
def process_contract(request: ProcessRequest):
    """Procesa un turno de la conversación y devuelve ranuras + documento.

    Es `def` (no `async def`) a propósito: la llamada a Ollama es
    sincrónica y FastAPI la ejecuta en un threadpool sin bloquear el servidor.
    """
    try:
        return process_chat(request)
    except AgentError as exc:
        # Fallo del LLM/servicio externo → 502 Bad Gateway con el motivo
        raise HTTPException(status_code=502, detail=str(exc)) from exc


class ExtractRequest(BaseModel):
    """Cuerpo del adaptador /extract: así llama el cliente Node existente."""

    content: str = Field(min_length=1, description="Texto libre a procesar.")
    document_type: DocumentType = Field("CONTRATO", description="Tipo de documento a generar.")


@app.post("/extract", response_model=ProcessResponse)
def extract_adapter(request: ExtractRequest):
    """Equivalente a process-contract sin ranuras previas (para Node)."""
    try:
        return process_chat(
            ProcessRequest(
                prompt=request.content,
                document_type=request.document_type,
                current_data=None,
            )
        )
    except AgentError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", "8000")), reload=True)
