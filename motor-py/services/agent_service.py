"""
services/agent_service.py — El corazón del microservicio (patrón Slot Filling).

El servicio genera los DOS documentos oficiales del estudio, cuyas plantillas
viven en document/ y se reproducen en templates/:
  - CONTRATO:   Contrato de Prestación de Servicios Profesionales (CONT-001)
  - EXPEDIENTE: Expediente Jurídico (EXP-001)

Cómo funciona un turno de conversación:
  1. extract_entities()      → el LLM lee el texto libre y devuelve SOLO un
                               JSON con las ranuras del documento elegido
                               (nunca redacta el documento: no puede alucinar).
  2. evaluate_completeness() → comparamos el JSON contra las ranuras
                               obligatorias de ese tipo de documento (RF04).
  3. render_template()       → si no falta nada, rellenamos la plantilla
                               oficial fija con Jinja2 (RF05).
  4. process_chat()          → orquesta los 3 pasos y arma la respuesta.

El tipo de documento NO lo adivina el LLM: lo manda el frontend en
ProcessRequest.document_type (selector de plantilla, RF02).
"""
import json
import os
from datetime import date
from pathlib import Path

import ollama
from dotenv import load_dotenv
from jinja2 import Environment, FileSystemLoader

from schemas.contract import ContractData, ExpedienteData, ProcessRequest, ProcessResponse
from services.numeros_a_letras import numero_a_palabras

load_dotenv()  # lee un .env local si existe; si no, valen los defaults

# --- Configuración ---
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen3:4b")  # modelo local instalado
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")

_cliente = ollama.Client(host=OLLAMA_HOST)

# Jinja2 carga las plantillas oficiales desde la carpeta templates/.
# trim/lstrip_blocks evitan líneas en blanco extra por las etiquetas {% %}.
_jinja = Environment(
    loader=FileSystemLoader(str(Path(__file__).parent.parent / "templates")),
    trim_blocks=True,
    lstrip_blocks=True,
)

MESES_ES = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
]

# ---------------------------------------------------------------------------
# Tablas de configuración por tipo de documento.
# Todo el "enrutado" del servicio se resume en estos 4 diccionarios:
# qué esquema Pydantic valida, qué prompt extrae, qué campos son
# obligatorios y qué plantilla se renderiza.
# ---------------------------------------------------------------------------

# Esquema Pydantic de cada documento
ESQUEMAS = {"CONTRATO": ContractData, "EXPEDIENTE": ExpedienteData}

# Plantilla oficial Jinja2 de cada documento
PLANTILLAS = {
    "CONTRATO": "contrato_prestacion_servicios.j2",
    "EXPEDIENTE": "expediente_juridico.j2",
}

# Ranuras obligatorias para dar el documento por completo (RF04)
REQUIRED_FIELDS = {
    "CONTRATO": [
        "contractor_name",
        "contractor_tax_id",
        "contractee_name",
        "contractee_tax_id",
        "service_object",
        "start_date",
        "duration_months",
        "total_fee",
        "payment_terms",
    ],
    "EXPEDIENTE": [
        "numero_expediente",
        "fecha_apertura",
        "tipo_expediente",
        "caratula",
        "objeto",
        "solicitante_name",
        "solicitante_tax_id",
        "contraparte_name",
        "contraparte_tax_id",
        "profesional_responsable",
    ],
}

# Nombres legibles de cada ranura, para el mensaje de "me falta esto"
FIELD_LABELS = {
    # Contrato
    "contractor_name": "Razón Social de LA CONTRATANTE (el cliente)",
    "contractor_tax_id": "CUIT de LA CONTRATANTE",
    "contractee_name": "Nombre de EL PRESTADOR",
    "contractee_tax_id": "DNI/CUIT de EL PRESTADOR",
    "service_object": "Objeto del contrato (qué servicio se presta)",
    "start_date": "Fecha de inicio",
    "duration_months": "Duración en meses",
    "total_fee": "Monto total de honorarios",
    "payment_terms": "Modalidad de pago (cuotas, vencimientos)",
    # Expediente
    "numero_expediente": "Número de expediente (ej. EXP-2026-0147)",
    "fecha_apertura": "Fecha de apertura",
    "tipo_expediente": "Tipo de expediente",
    "caratula": "Carátula (denominación del expediente)",
    "objeto": "Objeto del expediente",
    "solicitante_name": "Nombre o razón social de la parte solicitante",
    "solicitante_tax_id": "DNI/CUIT de la parte solicitante",
    "contraparte_name": "Nombre o razón social de la contraparte",
    "contraparte_tax_id": "DNI/CUIT de la contraparte",
    "profesional_responsable": "Profesional responsable del expediente",
}

# ---------------------------------------------------------------------------
# Prompts de sistema: el LLM es un EXTRACTOR de datos, no un redactor.
# Los modelos chicos (4B) necesitan reglas explícitas de roles y un ejemplo
# de entrada/salida; sin ellos devuelven todo null o invierten los roles.
# ---------------------------------------------------------------------------

_REGLAS_COMUNES = """REGLAS ESTRICTAS:
1. Devolvé ÚNICAMENTE JSON válido, sin texto adicional, sin markdown, sin explicaciones.
2. NO inventes ni completes datos que el usuario no mencionó explícitamente.
   Si el dato no está en la instrucción ni en DATOS_PREVIOS, el valor es null.
3. Recibís DATOS_PREVIOS (ranuras ya llenas de turnos anteriores): conservá esos
   valores y actualizá únicamente las claves que el usuario mencione o corrija ahora.
4. Normalizá: fechas como texto legible en español ('1 de abril de 2026');
   los montos como número sin símbolo (4800000); los CUIT/CUIL/DNI tal cual
   los escribió el usuario ('30-71234567-8', '35.678.901').
5. Si la instrucción no aporta ningún dato nuevo, devolvé DATOS_PREVIOS sin cambios."""

_PROMPT_CONTRATO = f"""Sos un extractor de datos legales para el estudio jurídico Acosta & Asociados.
Tu ÚNICA tarea es extraer información de la instrucción del usuario y devolver un objeto JSON válido.

El JSON debe tener EXACTAMENTE estas claves (usá null cuando el dato no esté presente):
contractor_name, contractor_tax_id, contractor_address, contractor_representative,
contractee_name, contractee_tax_id, contractee_address, service_object,
start_date, end_date, duration_months, total_fee, payment_terms,
payment_method, jurisdiction.

{_REGLAS_COMUNES}

ACLARACIÓN IMPORTANTE SOBRE LOS ROLES:
- En un "contrato de prestación de servicios", la PERSONA CONTRATADA (quien presta el servicio, el profesional) es SIEMPRE contractee.
- La EMPRESA O CLIENTE que encarga y paga el servicio es SIEMPRE contractor.
- Pista práctica: "contrato para [nombre]" casi siempre significa que [nombre] es la prestadora (contractee).
- Las personas físicas con CUIL suelen ser las prestadoras; las S.R.L./S.A. con CUIT suelen ser las contratantes.

EJEMPLO DE ENTRADA/SALIDA (seguidlo como referencia de formato y criterio):
Instrucción: "Armá un contrato para Lucía Fernández, CUIL 35.678.901, con Distribuidora del Litoral S.R.L., CUIT 30-71234567-8, por 6 meses desde abril de 2026, honorarios $4.800.000 en 6 cuotas mensuales de $800.000"
Salida JSON: {{"contractor_name": "Distribuidora del Litoral S.R.L.", "contractor_tax_id": "30-71234567-8", "contractor_address": null, "contractor_representative": null, "contractee_name": "Lucía Fernández", "contractee_tax_id": "35.678.901", "contractee_address": null, "service_object": null, "start_date": "abril de 2026", "end_date": null, "duration_months": 6, "total_fee": 4800000, "payment_terms": "6 cuotas mensuales de $800.000", "payment_method": null, "jurisdiction": null}}
Nota del ejemplo: "contrato PARA Lucía Fernández" = Lucía es LA PRESTADORA (contractee), porque es quien presta el servicio."""

_PROMPT_EXPEDIENTE = f"""Sos un extractor de datos legales para el estudio jurídico Acosta & Asociados.
Tu ÚNICA tarea es extraer información de la instrucción del usuario y devolver un objeto JSON válido, para cargar un EXPEDIENTE JURÍDICO.

El JSON debe tener EXACTAMENTE estas claves (usá null cuando el dato no esté presente):
numero_expediente, fecha_apertura, tipo_expediente, area_responsable,
profesional_responsable, matricula, estado, prioridad, caratula, objeto,
descripcion_general, solicitante_name, solicitante_tax_id, solicitante_address,
solicitante_email, solicitante_phone, contraparte_name, contraparte_tax_id,
contraparte_address, contraparte_info, antecedentes_descripcion,
antecedentes_fecha, antecedentes_origen, antecedentes_documentacion,
actuaciones, documentacion, observaciones, info_pendiente,
documentacion_pendiente, proximas_acciones, resumen_situacion, conclusiones,
fecha_actualizacion.

{_REGLAS_COMUNES}

ACLARACIONES:
- solicitante = quien inicia el reclamo (el cliente del estudio).
- contraparte = contra quien se dirige el reclamo.
- actuaciones y documentacion son listas de objetos:
  actuaciones → [{{"fecha": ..., "actuacion": ..., "responsable": ..., "observaciones": ...}}]
  documentacion → [{{"identificador": ..., "nombre": ..., "fecha": ..., "descripcion": ...}}]
  Usá null si el usuario no menciona filas.

EJEMPLO DE ENTRADA/SALIDA:
Instrucción: "Cargá el expediente EXP-2026-0147, abierto el 12 de febrero de 2026, reclamo por incumplimiento contractual. Carátula: Distribuidora del Litoral S.R.L. c/ Transportes Río Paraná S.A. s/ incumplimiento de contrato de transporte. Objeto: reclamo por daños y perjuicios por demoras en las entregas. La solicitante es Distribuidora del Litoral S.R.L., CUIT 30-71234567-8; la contraparte es Transportes Río Paraná S.A., CUIT 30-70987654-3. Responsable: Dra. Valeria Acosta, matrícula T.º 12 F.º 345. Prioridad alta, estado en trámite."
Salida JSON: {{"numero_expediente": "EXP-2026-0147", "fecha_apertura": "12 de febrero de 2026", "tipo_expediente": "Reclamo por incumplimiento contractual", "area_responsable": null, "profesional_responsable": "Dra. Valeria Acosta", "matricula": "T.º 12 F.º 345", "estado": "En trámite", "prioridad": "Alta", "caratula": "Distribuidora del Litoral S.R.L. c/ Transportes Río Paraná S.A. s/ incumplimiento de contrato de transporte", "objeto": "Reclamo por daños y perjuicios por demoras en las entregas", "descripcion_general": null, "solicitante_name": "Distribuidora del Litoral S.R.L.", "solicitante_tax_id": "30-71234567-8", "solicitante_address": null, "solicitante_email": null, "solicitante_phone": null, "contraparte_name": "Transportes Río Paraná S.A.", "contraparte_tax_id": "30-70987654-3", "contraparte_address": null, "contraparte_info": null, "antecedentes_descripcion": null, "antecedentes_fecha": null, "antecedentes_origen": null, "antecedentes_documentacion": null, "actuaciones": null, "documentacion": null, "observaciones": null, "info_pendiente": null, "documentacion_pendiente": null, "proximas_acciones": null, "resumen_situacion": null, "conclusiones": null, "fecha_actualizacion": null}}"""

PROMPTS = {"CONTRATO": _PROMPT_CONTRATO, "EXPEDIENTE": _PROMPT_EXPEDIENTE}

# Nombre legible de cada documento, para los mensajes al usuario
NOMBRE_DOCUMENTO = {"CONTRATO": "contrato", "EXPEDIENTE": "expediente"}


class AgentError(Exception):
    """Cualquier fallo del agente (Ollama caído, JSON inválido, ...).

    main.py la atrapa y la convierte en una respuesta HTTP de error.
    """


def _consultar_llm(mensaje_usuario: str, system_prompt: str) -> dict:
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
                {"role": "system", "content": system_prompt},
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


def extract_entities(
    prompt: str, current_data: dict | None = None, document_type: str = "CONTRATO"
) -> dict:
    """RF02/RF03 — Le pide al LLM las ranuras del documento, en JSON.

    Recibe la instrucción nueva + las ranuras de turnos anteriores, para que
    el modelo las combine. Devuelve un dict con las claves del esquema del
    tipo de documento elegido.
    """
    esquema = ESQUEMAS[document_type]
    previas = esquema.model_validate(current_data or {}).model_dump()
    mensaje_usuario = (
        f"DATOS_PREVIOS (JSON):\n{json.dumps(previas, ensure_ascii=False, default=str)}\n\n"
        f"NUEVA INSTRUCCIÓN DEL USUARIO:\n{prompt}"
    )

    datos = _consultar_llm(mensaje_usuario, PROMPTS[document_type])

    # Los modelos chicos a veces "se distraen" y no extraen nada.
    # Si vino todo null, reintentamos una única vez antes de rendirnos.
    if all(v is None for v in datos.values()):
        datos = _consultar_llm(mensaje_usuario, PROMPTS[document_type])

    # Pydantic limpia y tipa lo que vino del LLM (montos como texto, etc.).
    # Las claves desconocidas se ignoran; los valores raros quedan None.
    return esquema.model_validate(datos).model_dump()


def evaluate_completeness(data: dict, document_type: str = "CONTRATO") -> list[str]:
    """RF04 — Devuelve la lista de ranuras obligatorias que siguen vacías."""
    return [
        campo
        for campo in REQUIRED_FIELDS[document_type]
        if data.get(campo) in (None, "", [], {})
    ]


def _contexto_contrato(data: dict) -> dict:
    """Prepara las variables calculadas del contrato (fechas y montos en letras)."""
    hoy = date.today()  # fecha de firma: hoy, salvo que se implemente otra cosa
    monto = data.get("total_fee")
    meses = data.get("duration_months")
    return {
        **data,
        "firma_dia": hoy.day,
        "firma_mes": MESES_ES[hoy.month - 1],
        "firma_anio": hoy.year,
        # Monto con puntos de miles, estilo argentino: 4800000 → "4.800.000"
        "total_fee_display": (
            f"{int(monto):,}".replace(",", ".") if isinstance(monto, (int, float)) else "________"
        ),
        # Monto y duración en letras: "cuatro millones ochocientos mil", "seis"
        "total_fee_palabras": numero_a_palabras(monto) if monto else "________",
        "duracion_palabras": numero_a_palabras(meses) if meses else "____",
    }


def render_template(data: dict, document_type: str = "CONTRATO") -> str:
    """RF05 — Rellena la plantilla oficial fija con los datos validados.

    Es texto legal preaprobado + Jinja2: el LLM no participa acá, así que
    es imposible que invente cláusulas. Los valores por defecto menores
    (jurisdicción Rosario, medio de pago, estado "En trámite") viven en la
    propia plantilla, a la vista de quien la edite.
    """
    contexto = dict(data)
    if document_type == "CONTRATO":
        contexto = _contexto_contrato(data)
    return _jinja.get_template(PLANTILLAS[document_type]).render(**contexto)


def _pedir_datos_faltantes(faltantes: list[str], document_type: str) -> str:
    """Arma el mensaje que le pide al usuario, en criollo, lo que falta (RF04)."""
    lista = "\n".join(f"  • {FIELD_LABELS.get(campo, campo)}" for campo in faltantes)
    return (
        f"Para generar el {NOMBRE_DOCUMENTO[document_type]} con la plantilla oficial "
        "del estudio todavía necesito estos datos:\n"
        f"{lista}\n\n"
        "Puede indicármelos en un mensaje, por ejemplo: «El CUIT del "
        "contratante es 30-71234567-8 y el monto total es $4.800.000 en 6 cuotas»."
    )


def process_chat(request: ProcessRequest) -> ProcessResponse:
    """Orquesta un turno completo: extraer → consolidar → evaluar → responder."""
    tipo = request.document_type

    # 1. El LLM extrae lo que pueda de la instrucción nueva
    nuevas = extract_entities(request.prompt, request.current_data, tipo)

    # 2. Consolidamos ranuras: partimos de las previas y las pisamos solo
    #    con datos nuevos que NO sean null (el LLM no debe borrar lo ya cargado)
    esquema = ESQUEMAS[tipo]
    previas = esquema.model_validate(request.current_data or {}).model_dump()
    datos = {**previas, **{k: v for k, v in nuevas.items() if v is not None}}

    # 3. ¿Falta algo obligatorio?
    faltantes = evaluate_completeness(datos, tipo)
    if faltantes:
        return ProcessResponse(
            status="INCOMPLETE",
            current_data=datos,
            missing_fields=faltantes,
            agent_message=_pedir_datos_faltantes(faltantes, tipo),
        )

    # 4. Todo completo → renderizamos el documento oficial
    return ProcessResponse(
        status="COMPLETE",
        current_data=datos,
        missing_fields=[],
        agent_message=(
            f"Todos los datos obligatorios están completos. Generé el "
            f"{NOMBRE_DOCUMENTO[tipo]} con la plantilla oficial de Acosta & "
            "Asociados. Recuerde: es un borrador hasta que un abogado "
            "matriculado lo apruebe formalmente en el sistema."
        ),
        rendered_document=render_template(datos, tipo),
    )
