# Microservicio IA — Acosta & Asociados

Servicio de **Slot Filling** para generación de documentos legales, construido con
**FastAPI + Ollama (LLM local) + Pydantic + Jinja2**.

Genera los **dos documentos oficiales** del estudio, replicando fielmente los
modelos de la carpeta `document/`:

| `document_type` | Documento                                   | Modelo oficial                       | Plantilla Jinja2                          |
| --------------- | ------------------------------------------- | ------------------------------------ | ----------------------------------------- |
| `CONTRATO`      | Contrato de Prestación de Servicios Profesionales | `contrato_ejemplo_CONT-001(1).docx.md` | `templates/contrato_prestacion_servicios.j2` |
| `EXPEDIENTE`    | Expediente Jurídico                          | `expediente_ejemplo_EXP-001(1).docx.md` | `templates/expediente_juridico.j2`        |

## Principio de diseño (anti-alucinación)

El LLM **nunca redacta el documento**. Su única tarea es extraer un JSON
estructurado a partir del texto libre del empleado. Python valida ese JSON,
detecta las ranuras faltantes y, solo cuando están todas las obligatorias,
renderiza la **plantilla oficial fija** (Jinja2 → texto legal idéntico al
modelo de `document/`). Los montos en letras los calcula un módulo
determinista (`services/numeros_a_letras.py`), nunca el LLM.

```
Empleado (texto libre) → POST /ai/process-contract { prompt, document_type, current_data }
    → extract_entities (ollama.chat, format="json")
    → evaluate_completeness (RF04)
        ├─ INCOMPLETE → missing_fields + agent_message pidiendo los datos
        └─ COMPLETE   → render_template (RF05) → rendered_document
```

El tipo de documento lo decide el **selector de plantilla del frontend**
(`document_type`), no el LLM: es determinista y más confiable.

## Requisitos

- Python ≥ 3.13 (gestionado con [uv](https://docs.astral.sh/uv/))
- [Ollama](https://ollama.com) corriendo localmente (`ollama serve`)
- Un modelo local instalado. Por defecto se usa **`qwen3:4b`**:
  ```bash
  ollama pull qwen3:4b
  ```

## Instalación y ejecución

```bash
uv sync
uv run uvicorn main:app --reload --port 8000
# o simplemente:
uv run main.py
```

Documentación interactiva: http://localhost:8000/docs

## Variables de entorno

| Variable          | Default                                          | Descripción                          |
| ----------------- | ------------------------------------------------ | ------------------------------------ |
| `OLLAMA_MODEL`    | `qwen3:4b`                                       | Modelo local a usar                  |
| `OLLAMA_HOST`     | `http://localhost:11434`                         | Host de Ollama                       |
| `PORT`            | `8000`                                           | Puerto del servicio (`uv run main.py`) |
| `AI_CORS_ORIGINS` | `http://localhost:3000,http://localhost:5173`    | Orígenes CORS (backend Node y frontend) |

## Endpoints

| Método | Ruta                   | Descripción                                                                 |
| ------ | ---------------------- | --------------------------------------------------------------------------- |
| POST   | `/ai/process-contract` | Endpoint principal. Body: `{ "prompt": str, "document_type": "CONTRATO"\|"EXPEDIENTE", "current_data": dict? }`. Devuelve `{ status, current_data, missing_fields, agent_message, rendered_document? }`. |
| POST   | `/extract`             | Adaptador para el cliente Node existente (`api-rest/src/clients/agentClient.js`). Body: `{ "content": str, "document_type"? }`. |
| GET    | `/health`              | Health-check del servicio y modelo configurado.                              |

### Flujo multi-turno (slot filling)

El frontend/backend conserva `current_data` entre turnos y lo reenvía en cada
request. El servicio lo fusiona con lo extraído del nuevo `prompt`:

```jsonc
// Turno 1
{ "document_type": "CONTRATO",
  "prompt": "Contrato de servicios para Lucía Fernández, CUIL 35.678.901" }
// → status: "INCOMPLETE", missing_fields: ["contractor_name", ...]

// Turno 2 (se reenvían las ranuras ya llenas)
{ "document_type": "CONTRATO",
  "prompt": "El contratante es Distribuidora del Litoral S.R.L., CUIT 30-71234567-8, ...",
  "current_data": { /* respuesta del turno 1 */ } }
// → status: "COMPLETE", rendered_document: "<contrato oficial>"

// Expediente (mismo endpoint, otro document_type)
{ "document_type": "EXPEDIENTE",
  "prompt": "Cargá el expediente EXP-2026-0147, abierto el 12/02/2026, ..." }
```

## El modelo local y su latencia (leer antes de demo)

El servicio usa por defecto **`qwen3:4b`** (modelo local instalado con Ollama).
Dos aprendizajes importantes de la puesta a punto, reflejados en el código:

1. **El razonamiento ("thinking") debe quedar activado.** Con el thinking
   desactivado, un modelo de 4B devuelve todas las ranuras en `null` aunque el
   prompt incluya ejemplos. Con thinking activado, extrae y asigna roles
   correctamente. Por eso `extract_entities` NO pasa `think=False`.
2. **A cambio, cada turno tarda minutos en CPU.** La cadena de razonamiento es
   larga: espere ~2-4 minutos por llamada en una máquina sin GPU. La UI debe
   mostrar un spinner y los clientes HTTP deben usar timeouts altos
   (el backend Node ya configura `AI_TIMEOUT_MS=300000`).

Si dispone de un modelo local más grande o GPU, cámbielo con
`OLLAMA_MODEL=otro-modelo` sin tocar el código.

## Estructura

```
motor-py/
├── main.py                        # FastAPI: endpoints y CORS
├── document/                      # Modelos oficiales del estudio (fuente de verdad)
│   ├── contrato_ejemplo_CONT-001(1).docx.md
│   └── expediente_ejemplo_EXP-001(1).docx.md
├── schemas/
│   └── contract.py                # Pydantic: ContractData, ExpedienteData, ProcessRequest/Response
├── services/
│   ├── agent_service.py           # Extracción (Ollama), completitud (RF04), render (RF05)
│   └── numeros_a_letras.py        # Montos en letras (determinista, sin LLM)
├── templates/                     # Réplicas Jinja2 de los modelos oficiales
│   ├── contrato_prestacion_servicios.j2
│   └── expediente_juridico.j2
├── requirements.txt               # Referencia pip (el proyecto usa uv/pyproject.toml)
└── pyproject.toml                 # Dependencias gestionadas con uv
```

## Integración con el resto del sistema

- **API Node.js** (`api-rest/`): `src/clients/agentClient.js` ya apunta a
  `/extract` y `/health` (configurable con `AI_API_URL`, default
  `http://localhost:8000`).
- **Frontend React** (`frontend/`): el asistente de contratos consume
  `/ai/process-contract` (CORS habilitado para `http://localhost:5173`).

> El documento renderizado es un **borrador** hasta su aprobación formal por un
> abogado matriculado en el sistema principal (RF07).
