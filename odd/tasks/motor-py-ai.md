# Microservicio IA (Python + FastAPI + Ollama) — Acosta & Asociados

Objective: servicio de slot-filling que extrae entidades legales de texto libre con un LLM local (Ollama), detecta faltantes (RF04) y renderiza la plantilla oficial estricta con Jinja2 (RF05). El LLM NUNCA redacta el contrato: solo extrae JSON.
Branch: n/a. Delivery: bloque único (requirements.txt, schemas/contract.py, services/agent_service.py, main.py). Test runner: `uv run` + pruebas funcionales HTTP contra uvicorn con Ollama real (qwen3:4b).

## Specs

- S1: Stack: FastAPI + uvicorn, SDK `ollama`, `pydantic` v2, `jinja2`. Proyecto gestionado con uv (pyproject.toml existente ya declara las deps + python-docx + python-dotenv).
- S2: Patrón Slot Filling: el LLM solo extrae un JSON estructurado (`format="json"`); Python evalúa completitud y renderiza la plantilla fija. Sin alucinación de cláusulas.
- S3: `ContractData` (pydantic): contractor_name, contractor_tax_id, contractee_name, contractee_tax_id, service_object, start_date, end_date, duration_months, total_fee, payment_terms (todos opcionales durante el llenado).
- S4: `ProcessRequest`: prompt (str) + current_data (dict opcional con datos de turnos anteriores).
- S5: `ProcessResponse`: status ("INCOMPLETE"|"COMPLETE"), current_data (JSON consolidado), missing_fields (lista de strings), agent_message (texto para el usuario); si COMPLETE incluye rendered_document (str).
- S6: `services/agent_service.py` con: extract_entities(prompt, current_data) — prompt de sistema estricto "extractor JSON", pasa current_data + nuevo prompt, usa ollama.chat(format="json"); evaluate_completeness(data) — compara contra campos obligatorios del contrato de prestación de servicios; render_template(data) — plantilla oficial de 9 cláusulas (Primera a Novena: Objeto, Plazo, Honorarios, Forma de Pago, Obligaciones, Confidencialidad, Rescisión, Jurisdicción, Ejemplares/Firmas) con Jinja2; process_chat(request) — orquestador que decide status y arma ProcessResponse.
- S7: `main.py`: endpoint POST /ai/process-contract que recibe ProcessRequest, llama a process_chat y devuelve el resultado al backend Node.js.
- S8: requirements.txt con fastapi, uvicorn, ollama, pydantic, jinja2.
- S9 (integración existente): el backend Node ya tiene clients/agentClient.js que llama POST {AI_API_URL}/extract con {content} y GET /health → se exponen además /extract (adaptador) y /health para que esa integración funcione sin cambios.
- S10: Modelo LLM por defecto `qwen3:4b` (el instalado localmente), configurable vía OLLAMA_MODEL; host vía OLLAMA_HOST (default http://localhost:11434).

## Tasks

- T1 (S1-S10): bloque único — requirements.txt, schemas/contract.py, services/agent_service.py, templates/prestacion_servicios.j2, main.py, configuración env. Ruta: inline. Estado: DONE (verificado: unit OK; E2E en background al momento de esta edición).
- T2 (pedido del usuario): simplificar el código para que sea entendible/mantenible/explicable por un humano, cumpliendo todos los requerimientos. Ruta: inline. Estado: DONE.

## Log

- L1 (2026-11-06): Request original = system prompt "Desarrollo de Microservicio de IA (Python + FastAPI + Ollama) — Acosta & Asociados": un solo bloque estructurado (requirements.txt, schemas/contract.py, services/agent_service.py, main.py), slot filling estricto, RF02-RF05, endpoint POST /ai/process-contract.
- L2 (2026-11-06): motor-py/ ya existe con scaffold uv (pyproject con fastapi/jinja2/ollama/pydantic/python-docx/python-dotenv/uvicorn, uv.lock, main.py stub "Hello"). Python 3.14.3, uv 0.11.6, Ollama 0.40.14 con modelos: qwen3:4b (default elegido), qwen3-embedding:0.6b, nemotron-3-nano:30b-cloud. Decisión: respetar uv (requirements.txt se entrega igual por el plan, como referencia pip). El workspace pasó a ser repo git.
- L3 (2026-11-06): Puesta a punto de la extracción con qwen3:4b. Evidencia: think=False devuelve ranuras vacías ({} o todo null) aunque el prompt tenga few-shot; think activado + regla de roles + ejemplo en el system prompt extrae correctamente (contractee_name/contractee_tax_id OK en pruebas C y D). Costo: ~2-4 min por turno en CPU. nemotron-3-nano:30b-cloud no usable sin cuenta Ollama (401 Unauthorized). Decisión: dejar thinking por defecto (no pasar think=False), documentar latencia en README y subir AI_TIMEOUT_MS default del backend Node a 300000.
- L4 (2026-11-06): Pedido del usuario (verbatim): "necesito, de ser posible, que simplifiques el codigo, para que sea entendible,mantenible y explicable por un humano, que cumpla con todos los requerimientos planteados". → T2: reescritos schemas/contract.py (fuera validador wildcard y ramas AR exóticas del parseo de montos: queda "sacar puntos, coma→punto"; descripciones de campo como documentación), agent_service.py (prompt único integrado con regla de roles + ejemplo; un solo AgentError sin status_code; Jinja2 sin flags exóticos; comentarios pedagógicos del flujo slot-filling) y main.py (502 fijo para AgentError, docstrings cortos). Funcionalidad intacta: RF02-RF05, /ai/process-contract, /extract, /health. Verificación: unit test de coerciones/completitud/render/rutas OK.
- L5 (2026-11-06): E2E vía servicio falló 2 veces en turno 1 (qwen3:4b devolvió ranuras vacías). Evidencia comparativa: think=False siempre falla ({}); thinking activado + prompt largo con reglas 1-8 + aclaración de roles + ejemplo con nota = 2/2 OK en pruebas directas. Decisión: restaurar ese prompt probado (el texto del prompt no afecta la mantenibilidad del código), extraer _consultar_llm como único punto de contacto con Ollama y agregar reintento único cuando el modelo devuelve todo null ("se distrajo"). Unit re-verificado OK tras la edición. AI_TIMEOUT_MS default del backend Node subido a 300000 (turnos de 2-4 min en CPU). README documenta latencia y porqué el thinking queda activado. Pendiente: comparación A/B de prompts corriendo en background + re-run E2E completo.
- L6 (2026-11-06): Engram degradado ("could not resolve a safe project identity") — mirror de este documento queda PENDING; resincronizar cuando el servicio vuelva. El archivo local es la fuente de verdad.
