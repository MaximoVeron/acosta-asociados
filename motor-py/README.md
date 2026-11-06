# Microservicio IA — Acosta & Asociados

Servicio de **Slot Filling** para generación de contratos legales, construido con
**FastAPI + Ollama (LLM local) + Pydantic + Jinja2**.

## Principio de diseño (anti-alucinación)

El LLM **nunca redacta el contrato**. Su única tarea es extraer un JSON
estructurado a partir del texto libre del empleado. Python valida ese JSON,
detecta las ranuras faltantes y, solo cuando están todas las obligatorias,
renderiza la **plantilla oficial fija** (9 cláusulas, Jinja2) del estudio.

```
Empleado (texto libre) → POST /ai/process-contract
    → extract_entities (ollama.chat, format="json")
    → evaluate_completeness (RF04)
        ├─ INCOMPLETE → missing_fields + agent_message pidiendo los datos
        └─ COMPLETE   → render_template (RF05) → rendered_document
```

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
| POST   | `/ai/process-contract` | Endpoint principal. Body: `{ "prompt": str, "current_data": dict? }`. Devuelve `{ status, current_data, missing_fields, agent_message, rendered_document? }`. |
| POST   | `/extract`             | Adaptador para el cliente Node existente (`api-rest/src/clients/agentClient.js`). Body: `{ "content": str }`. |
| GET    | `/health`              | Health-check del servicio y modelo configurado.                              |

### Flujo multi-turno (slot filling)

El frontend/backend conserva `current_data` entre turnos y lo reenvía en cada
request. El servicio lo fusiona con lo extraído del nuevo `prompt`:

```jsonc
// Turno 1
{ "prompt": "Contrato de servicios para Lucía Fernández, CUIL 35.678.901" }
// → status: "INCOMPLETE", missing_fields: ["contractor_name", ...]

// Turno 2 (se reenvían las ranuras ya llenas)
{ "prompt": "El contratante es Distribuidora del Litoral S.R.L., CUIT 30-71234567-8, ...",
  "current_data": { /* respuesta del turno 1 */ } }
// → status: "COMPLETE", rendered_document: "<contrato oficial>"
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
├── schemas/
│   └── contract.py                # Pydantic: ContractData, ProcessRequest, ProcessResponse
├── services/
│   └── agent_service.py           # Extracción (Ollama), completitud (RF04), render (RF05)
├── templates/
│   └── prestacion_servicios.j2    # Plantilla oficial fija (cláusulas Primera a Novena)
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
