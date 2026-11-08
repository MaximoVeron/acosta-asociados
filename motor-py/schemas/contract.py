"""
schemas/contract.py — Modelos Pydantic del microservicio IA.

Idea central (Slot Filling): cada documento oficial del estudio es un
formulario con "ranuras". Mientras dure la conversación las ranuras pueden
estar vacías (None). Cuando todas las obligatorias están llenas, el servicio
renderiza la plantilla oficial correspondiente.

Hay DOS tipos de documento (ver document/):
  - CONTRATO:   ContractData   → templates/contrato_prestacion_servicios.j2
  - EXPEDIENTE: ExpedienteData → templates/expediente_juridico.j2
"""
import re
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

# Tipos de documento oficial que el servicio sabe generar
DocumentType = Literal["CONTRATO", "EXPEDIENTE"]


class ContractData(BaseModel):
    """Ranuras del Contrato de Prestación de Servicios Profesionales.

    Reflejan el modelo oficial document/contrato_ejemplo_CONT-001.
    """

    # Si el LLM devuelve claves de más, se ignoran en vez de fallar
    model_config = ConfigDict(extra="ignore")

    # --- LA CONTRATANTE (el cliente que paga) ---
    contractor_name: Optional[str] = Field(None, description="Razón Social de LA CONTRATANTE.")
    contractor_tax_id: Optional[str] = Field(None, description="CUIT de LA CONTRATANTE (ej. 30-71234567-8).")
    contractor_address: Optional[str] = Field(None, description="Domicilio de LA CONTRATANTE.")
    contractor_representative: Optional[str] = Field(
        None, description="Representante de LA CONTRATANTE (ej. 'Marcos Ezequiel Ibarra, DNI 28.456.789, socio gerente')."
    )

    # --- EL PRESTADOR (quien hace el trabajo) ---
    contractee_name: Optional[str] = Field(None, description="Nombre de EL PRESTADOR.")
    contractee_tax_id: Optional[str] = Field(None, description="DNI/CUIT de EL PRESTADOR (ej. 35.678.901).")
    contractee_address: Optional[str] = Field(None, description="Domicilio de EL PRESTADOR.")

    # --- Objeto y plazo ---
    service_object: Optional[str] = Field(None, description="Descripción de los servicios profesionales (cláusula PRIMERA).")
    start_date: Optional[str] = Field(None, description="Fecha de inicio en español (ej. '1 de abril de 2026').")
    end_date: Optional[str] = Field(None, description="Fecha de finalización, si el usuario la indicó.")
    duration_months: Optional[int] = Field(None, description="Duración en meses (ej. 6).")

    # --- Honorarios ---
    total_fee: Optional[float] = Field(None, description="Monto total de honorarios en pesos.")
    payment_terms: Optional[str] = Field(None, description="Modalidad de pago (ej. 'seis (6) cuotas mensuales de $800.000').")
    payment_method: Optional[str] = Field(None, description="Medio de pago (default: transferencia bancaria).")

    # --- Legal ---
    jurisdiction: Optional[str] = Field(None, description="Jurisdicción; si no se dice, se usa la del estudio (Rosario).")

    # Los dos validadores de abajo existen porque el LLM a veces devuelve
    # los números como texto ("$4.800.000", "6 meses"). Los dejamos tipados.

    @field_validator("total_fee", mode="before")
    @classmethod
    def _parsear_monto(cls, v):
        """Convierte "$4.800.000" o "1.500.000,50" en un número.

        En Argentina el punto separa miles y la coma separa decimales,
        así que: sacamos los puntos (miles) y cambiamos la coma por punto.
        """
        if v is None or isinstance(v, (int, float)):
            return v
        solo_numero = re.sub(r"[^\d,.]", "", str(v))  # dejo dígitos, puntos y comas
        solo_numero = solo_numero.replace(".", "").replace(",", ".")
        try:
            return float(solo_numero)
        except ValueError:
            return None  # no era un monto reconocible → ranura vacía

    @field_validator("duration_months", mode="before")
    @classmethod
    def _parsear_meses(cls, v):
        """Convierte "6", "6 meses" o "seis (6) meses" en el entero 6."""
        if v is None or isinstance(v, (int, float)):
            return int(v) if v is not None else None
        numeros = re.search(r"\d+", str(v))
        return int(numeros.group()) if numeros else None


class ExpedienteData(BaseModel):
    """Ranuras del Expediente Jurídico.

    Reflejan el modelo oficial document/expediente_ejemplo_EXP-001.
    Casi todo es opcional: lo obligatorio lo define REQUIRED_FIELDS
    en agent_service.py (identificación, carátula y las dos partes).
    """

    model_config = ConfigDict(extra="ignore")

    # --- 1. Identificación ---
    numero_expediente: Optional[str] = Field(None, description="Número de expediente (ej. EXP-2026-0147).")
    fecha_apertura: Optional[str] = Field(None, description="Fecha de apertura en español.")
    tipo_expediente: Optional[str] = Field(None, description="Tipo (ej. 'Reclamo por incumplimiento contractual').")
    area_responsable: Optional[str] = Field(None, description="Área responsable (ej. 'Derecho Comercial').")
    profesional_responsable: Optional[str] = Field(None, description="Profesional responsable (ej. 'Dra. Valeria Acosta').")
    matricula: Optional[str] = Field(None, description="Matrícula del profesional (ej. 'T.º 12 F.º 345').")
    estado: Optional[str] = Field(None, description="Estado actual (ej. 'En trámite').")
    prioridad: Optional[str] = Field(None, description="Nivel de prioridad (ej. 'Alta').")

    # --- 2. Carátula ---
    caratula: Optional[str] = Field(None, description="Denominación (ej. 'X c/ Y s/ incumplimiento de contrato').")
    objeto: Optional[str] = Field(None, description="Objeto del expediente.")
    descripcion_general: Optional[str] = Field(None, description="Descripción general del caso.")

    # --- 3. Partes ---
    solicitante_name: Optional[str] = Field(None, description="Nombre o razón social de la parte solicitante.")
    solicitante_tax_id: Optional[str] = Field(None, description="DNI/CUIT de la parte solicitante.")
    solicitante_address: Optional[str] = Field(None, description="Domicilio de la solicitante.")
    solicitante_email: Optional[str] = Field(None, description="Email de la solicitante.")
    solicitante_phone: Optional[str] = Field(None, description="Teléfono de la solicitante.")
    contraparte_name: Optional[str] = Field(None, description="Nombre o razón social de la contraparte.")
    contraparte_tax_id: Optional[str] = Field(None, description="DNI/CUIT de la contraparte.")
    contraparte_address: Optional[str] = Field(None, description="Domicilio de la contraparte.")
    contraparte_info: Optional[str] = Field(None, description="Info adicional de la contraparte (ej. representante/apoderado).")

    # --- 4. Antecedentes ---
    antecedentes_descripcion: Optional[str] = Field(None, description="Descripción de los antecedentes.")
    antecedentes_fecha: Optional[str] = Field(None, description="Fecha del hecho principal.")
    antecedentes_origen: Optional[str] = Field(None, description="Origen de la solicitud.")
    antecedentes_documentacion: Optional[str] = Field(None, description="Documentación inicial aportada.")

    # --- 5 y 6. Tablas (opcionales) ---
    actuaciones: Optional[list] = Field(
        None, description="Lista de {fecha, actuacion, responsable, observaciones}."
    )
    documentacion: Optional[list] = Field(
        None, description="Lista de {identificador, nombre, fecha, descripcion}."
    )

    # --- 7 y 8. Observaciones y conclusiones ---
    observaciones: Optional[str] = Field(None, description="Observaciones generales.")
    info_pendiente: Optional[str] = Field(None, description="Información pendiente de incorporar.")
    documentacion_pendiente: Optional[str] = Field(None, description="Documentación pendiente.")
    proximas_acciones: Optional[str] = Field(None, description="Próximas acciones previstas.")
    resumen_situacion: Optional[str] = Field(None, description="Resumen de situación.")
    conclusiones: Optional[str] = Field(None, description="Conclusiones del profesional responsable.")
    fecha_actualizacion: Optional[str] = Field(None, description="Fecha de última actualización.")


class ProcessRequest(BaseModel):
    """Lo que el backend/frontend envía en cada turno de la conversación."""

    prompt: str = Field(min_length=1, description="Instrucción del empleado en lenguaje natural.")
    document_type: DocumentType = Field(
        "CONTRATO",
        description="Tipo de documento a generar. Lo decide el selector de plantilla del frontend (RF02), no el LLM.",
    )
    current_data: Optional[dict] = Field(
        None, description="Ranuras ya llenas en turnos anteriores (se van acumulando)."
    )


class ProcessResponse(BaseModel):
    """Lo que el servicio responde en cada turno."""

    status: Literal["INCOMPLETE", "COMPLETE"] = Field(
        description="INCOMPLETE: faltan ranuras obligatorias (RF04). COMPLETE: documento listo (RF05)."
    )
    current_data: dict = Field(description="Todas las ranuras tras este turno (para reenviar en el próximo).")
    missing_fields: list[str] = Field(default_factory=list, description="Ranuras obligatorias que siguen vacías.")
    agent_message: str = Field(description="Mensaje en lenguaje natural para mostrar al usuario.")
    rendered_document: Optional[str] = Field(
        None, description="El documento renderizado con la plantilla oficial (solo si status=COMPLETE)."
    )
