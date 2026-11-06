"""
schemas/contract.py — Modelos Pydantic del microservicio IA.

Idea central (Slot Filling): el contrato es un formulario con "ranuras".
ContractData tiene una ranura por dato del contrato. Mientras dure la
conversación, las ranuras pueden estar vacías (None). Cuando todas las
obligatorias están llenas, el servicio puede renderizar el documento.
"""
import re
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ContractData(BaseModel):
    """Las ranuras del Contrato de Prestación de Servicios Profesionales."""

    # Si el LLM devuelve claves de más, se ignoran en vez de fallar
    model_config = ConfigDict(extra="ignore")

    # --- Las dos partes del contrato ---
    contractor_name: Optional[str] = Field(None, description="Razón Social del CONTRATANTE (el cliente que paga).")
    contractor_tax_id: Optional[str] = Field(None, description="CUIT del CONTRATANTE (ej. 30-71234567-8).")
    contractee_name: Optional[str] = Field(None, description="Nombre de la PRESTADORA (quien hace el trabajo).")
    contractee_tax_id: Optional[str] = Field(None, description="CUIT/CUIL/DNI de la PRESTADORA (ej. 35.678.901).")

    # --- Qué se contrata y por cuánto tiempo ---
    service_object: Optional[str] = Field(None, description="Descripción del servicio a prestar.")
    start_date: Optional[str] = Field(None, description="Fecha de inicio, como texto en español (ej. '1 de abril de 2026').")
    end_date: Optional[str] = Field(None, description="Fecha de fin, si el usuario la dijo explícitamente.")
    duration_months: Optional[int] = Field(None, description="Duración en meses (ej. 6).")

    # --- Plata ---
    total_fee: Optional[float] = Field(None, description="Monto total de honorarios en pesos.")
    payment_terms: Optional[str] = Field(None, description="Forma de pago (ej. '6 cuotas mensuales de $800.000').")

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
        """Convierte "6", "6 meses" o "doce (6) meses" en el entero 6."""
        if v is None or isinstance(v, (int, float)):
            return int(v) if v is not None else None
        numeros = re.search(r"\d+", str(v))
        return int(numeros.group()) if numeros else None


class ProcessRequest(BaseModel):
    """Lo que el backend/frontend envía en cada turno de la conversación."""

    prompt: str = Field(min_length=1, description="Instrucción del empleado en lenguaje natural.")
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
        None, description="El contrato renderizado con la plantilla oficial (solo si status=COMPLETE)."
    )
