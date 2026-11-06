"""
services/agent_service.py — El corazón del microservicio (patrón Slot Filling).

Cómo funciona un turno de conversación:
  1. extract_entities()    → el LLM lee el texto libre y devuelve SOLO un JSON
                             con las ranuras del contrato (nunca redacta nada).
  2. evaluate_completeness() → comparamos ese JSON contra la lista de campos
                             obligatorios (RF04).
  3. render_template()     → si no falta nada, rellenamos la plantilla oficial
                             fija con Jinja2 (RF05). El texto legal nunca lo
                             toca el LLM: por eso no puede alucinar cláusulas.
  4. process_chat()        → orquesta los 3 pasos y arma la respuesta.
"""
import json
import os
from pathlib import Path

import ollama
from dotenv import load_dotenv
from jinja2 import Environment, FileSystemLoader

from schemas.contract import ContractData, ProcessRequest, ProcessResponse

load_dotenv()  # lee un .env local si existe; si no, valen los defaults

# --- Configuración ---
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen3:4b")  # modelo local instalado
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")

# Jurisdicción institucional: se usa si el usuario no indica otra
DEFAULT_JURISDICTION = "ciudad de Rosario, Provincia de Santa Fe, República Argentina"

_cliente = ollama.Client(host=OLLAMA_HOST)

# Jinja2 carga la plantilla oficial desde la carpeta templates/
_jinja = Environment(loader=FileSystemLoader(str(Path(__file__).parent.parent / "templates")))
PLANTILLA_OFICIAL = "prestacion_servicios.j2"

# --- Qué necesita sí o sí un contrato de prestación de servicios (RF04) ---
REQUIRED_FIELDS = [
    "contractor_name",
    "contractor_tax_id",
    "contractee_name",
    "contractee_tax_id",
    "service_object",
    "start_date",
    "duration_months",
    "total_fee",
    "payment_terms",
]

# Nombres legibles de cada ranura, para armar el mensaje de "me falta esto"
FIELD_LABELS = {
    "contractor_name": "Nombre o Razón Social del CONTRATANTE",
    "contractor_tax_id": "CUIT del CONTRATANTE",
    "contractee_name": "Nombre de la PRESTADORA o contratista",
    "contractee_tax_id": "CUIT/CUIL/DNI de la PRESTADORA",
    "service_object": "Objeto del contrato (qué servicio se presta)",
    "start_date": "Fecha de inicio",
    "duration_months": "Duración en meses",
    "total_fee": "Monto total de honorarios",
    "payment_terms": "Forma de pago",
}

# --- Prompt de sistema: el LLM es un EXTRACTOR de datos, no un redactor ---
# Los modelos chicos (4B) necesitan reglas explícitas de roles y un ejemplo
# de entrada/salida; sin ellos devuelven todo null o invierten contratante/prestadora.
_SYSTEM_PROMPT = """Sos un extractor de datos legales para el estudio jurídico Acosta & Asociados.
Tu ÚNICA tarea es extraer información de la instrucción del usuario y devolver un objeto JSON válido.

REGLAS ESTRICTAS:
1. Devolvé ÚNICAMENTE JSON válido, sin texto adicional, sin markdown, sin explicaciones.
2. El JSON debe tener EXACTAMENTE estas claves (usá null cuando el dato no esté presente):
   contractor_name, contractor_tax_id, contractee_name, contractee_tax_id,
   service_object, start_date, end_date, duration_months, total_fee,
   payment_terms, jurisdiction.
3. NO inventes ni completes datos que el usuario no mencionó explícitamente.
   Si el dato no está en la instrucción ni en DATOS_PREVIOS, el valor es null.
4. Recibís DATOS_PREVIOS (ranuras ya llenas de turnos anteriores): conservá esos
   valores y actualizá únicamente las claves que el usuario mencione o corrija ahora.
5. contractor = quien CONTRATA el servicio (cliente/contratante).
   contractee = quien PRESTA el servicio (prestador/profesional).
6. Normalizá: fechas como texto legible en español ('1 de abril de 2026');
   total_fee como número en pesos (sin símbolo: 4800000);
   duration_months como número entero de meses.
7. Conservá los identificadores fiscales tal como los escribió el usuario
   (ej. '30-71234567-8', '35.678.901').
8. Si la instrucción no aporta ningún dato nuevo, devolvé DATOS_PREVIOS sin cambios.

ACLARACIÓN IMPORTANTE SOBRE LOS ROLES:
- En un "contrato de prestación de servicios", la PERSONA CONTRATADA (quien presta el servicio, el profesional) es SIEMPRE contractee.
- La EMPRESA O CLIENTE que encarga y paga el servicio es SIEMPRE contractor.
- Pista práctica: "contrato para [nombre]" casi siempre significa que [nombre] es la prestadora (contractee).
- Las personas físicas con CUIL suelen ser las prestadoras; las S.R.L./S.A. con CUIT suelen ser las contratantes.

EJEMPLO DE ENTRADA/SALIDA (seguidlo como referencia de formato y criterio):
Instrucción: "Armá un contrato para Lucía Fernández, CUIL 35.678.901, con Distribuidora del Litoral S.R.L., CUIT 30-71234567-8, por 6 meses desde abril de 2026, honorarios $4.800.000 en 6 cuotas mensuales de $800.000"
Salida JSON: {"contractor_name": "Distribuidora del Litoral S.R.L.", "contractor_tax_id": "30-71234567-8", "contractee_name": "Lucía Fernández", "contractee_tax_id": "35.678.901", "service_object": null, "start_date": "abril de 2026", "end_date": null, "duration_months": 6, "total_fee": 4800000, "payment_terms": "6 cuotas mensuales de $800.000", "jurisdiction": null}
Nota del ejemplo: "contrato PARA Lucía Fernández" = Lucía es LA PRESTADORA (contractee), porque es quien presta el servicio."""


class AgentError(Exception):
    """Cualquier fallo del agente (Ollama caído, JSON inválido, ...).

    main.py la atrapa y la convierte en una respuesta HTTP de error.
    """


def _consultar_llm(mensaje_usuario: str) -> dict:
    """Llama a Ollama y devuelve el JSON crudo que extrajo el modelo.

    Único punto del código que habla con el LLM. Ante cualquier fallo
    (Ollama caído, JSON inválido) lanza AgentError con un mensaje claro.
    """
    # format="json" fuerza salida estructurada; temperature=0 la hace
    # determinista. El "thinking" del modelo se deja activado a propósito:
    # sin razonamiento, qwen3:4b devuelve todas las ranuras en null.
    try:
        respuesta = _cliente.chat(
            model=OLLAMA_MODEL,
            messages=[
                {"role": "system", "content": _SYSTEM_PROMPT},
                {"role": "user", "content": mensaje_usuario},
            ],
            format="json",
            options={"temperature": 0},
        )
    except Exception as exc:
        raise AgentError(
            f"No se pudo consultar a Ollama en {OLLAMA_HOST} (modelo '{OLLAMA_MODEL}'). "
            "Verifique que Ollama esté corriendo y el modelo instalado."
        ) from exc

    texto = respuesta["message"]["content"]
    try:
        datos = json.loads(texto)
    except json.JSONDecodeError as exc:
        raise AgentError("El modelo no devolvió un JSON válido. Intente nuevamente.") from exc

    if not isinstance(datos, dict):
        raise AgentError("El modelo devolvió un JSON que no es un objeto.")
    return datos


def extract_entities(prompt: str, current_data: dict | None = None) -> dict:
    """RF02/RF03 — Le pide al LLM las ranuras del contrato, en JSON.

    Recibe la instrucción nueva + las ranuras de turnos anteriores, para que
    el modelo las combine. Devuelve un dict con las claves de ContractData.
    """
    previas = ContractData.model_validate(current_data or {}).model_dump()
    mensaje_usuario = (
        f"DATOS_PREVIOS (JSON):\n{json.dumps(previas, ensure_ascii=False)}\n\n"
        f"NUEVA INSTRUCCIÓN DEL USUARIO:\n{prompt}"
    )

    datos = _consultar_llm(mensaje_usuario)

    # Los modelos chicos a veces "se distraen" y no extraen nada.
    # Si vino todo null, reintentamos una única vez antes de rendirnos.
    if all(v is None for v in datos.values()):
        datos = _consultar_llm(mensaje_usuario)

    # Pydantic limpia y tipa lo que vino del LLM (montos como texto, etc.).
    # Las claves desconocidas se ignoran; los valores raros quedan None.
    return ContractData.model_validate(datos).model_dump()


def evaluate_completeness(data: dict) -> list[str]:
    """RF04 — Devuelve la lista de ranuras obligatorias que siguen vacías."""
    return [campo for campo in REQUIRED_FIELDS if data.get(campo) in (None, "")]


def render_template(data: dict) -> str:
    """RF05 — Rellena la plantilla oficial fija con los datos validados.

    Es texto legal preaprobado + Jinja2: el LLM no participa acá, así que
    es imposible que invente cláusulas.
    """
    monto = data.get("total_fee")
    # Monto con puntos de miles, estilo argentino: 4800000 → "4.800.000"
    monto_texto = f"{int(monto):,}".replace(",", ".") if isinstance(monto, (int, float)) else "________"

    contexto = {
        **data,
        "jurisdiction": data.get("jurisdiction") or DEFAULT_JURISDICTION,
        "total_fee_display": monto_texto,
    }
    return _jinja.get_template(PLANTILLA_OFICIAL).render(**contexto)


def _pedir_datos_faltantes(faltantes: list[str]) -> str:
    """Arma el mensaje que le pide al usuario, en criollo, lo que falta (RF04)."""
    lista = "\n".join(f"  • {FIELD_LABELS.get(campo, campo)}" for campo in faltantes)
    return (
        "Para generar el contrato con la plantilla oficial del estudio "
        "todavía necesito estos datos:\n"
        f"{lista}\n\n"
        "Puede indicármelos en un mensaje, por ejemplo: «El CUIT del "
        "contratante es 30-71234567-8 y el monto total es $4.800.000 en 6 cuotas»."
    )


def process_chat(request: ProcessRequest) -> ProcessResponse:
    """Orquesta un turno completo: extraer → consolidar → evaluar → responder."""
    # 1. El LLM extrae lo que pueda de la instrucción nueva
    nuevas = extract_entities(request.prompt, request.current_data)

    # 2. Consolidamos ranuras: partimos de las previas y las pisamos solo
    #    con datos nuevos que NO sean null (el LLM no debe borrar lo ya cargado)
    previas = ContractData.model_validate(request.current_data or {}).model_dump()
    datos = {**previas, **{k: v for k, v in nuevas.items() if v is not None}}

    # 3. ¿Falta algo obligatorio?
    faltantes = evaluate_completeness(datos)
    if faltantes:
        return ProcessResponse(
            status="INCOMPLETE",
            current_data=datos,
            missing_fields=faltantes,
            agent_message=_pedir_datos_faltantes(faltantes),
        )

    # 4. Todo completo → renderizamos el documento oficial
    return ProcessResponse(
        status="COMPLETE",
        current_data=datos,
        missing_fields=[],
        agent_message=(
            "Todos los datos obligatorios están completos. Generé el contrato "
            "con la plantilla oficial de Acosta & Asociados (cláusulas Primera "
            "a Novena). Recuerde: es un borrador hasta que un abogado "
            "matriculado lo apruebe formalmente en el sistema."
        ),
        rendered_document=render_template(datos),
    )
