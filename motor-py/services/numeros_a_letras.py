"""
services/numeros_a_letras.py — Convierte números a palabras en español.

Las plantillas oficiales del estudio escriben los importes dos veces:
en números y en letras (ej. "$ 4.800.000 (pesos cuatro millones
ochocientos mil)"). Esto es código determinista y testeable: los números
en letras NO se le piden al LLM, porque podría escribirlos mal.
"""

UNIDADES = [
    "cero", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve",
    "diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete",
    "dieciocho", "diecinueve", "veinte", "veintiuno", "veintidós", "veintitrés",
    "veinticuatro", "veinticinco", "veintiséis", "veintisiete", "veintiocho", "veintinueve",
]
DECENAS = ["", "", "", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"]
CENTENAS = [
    "", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos",
    "seiscientos", "setecientos", "ochocientos", "novecientos",
]


def _menor_a_mil(n: int) -> str:
    """Convierte un número de 1 a 999 a palabras."""
    if n < 30:
        return UNIDADES[n]
    if n < 100:
        decena, unidad = divmod(n, 10)
        return DECENAS[decena] + (f" y {UNIDADES[unidad]}" if unidad else "")
    if n == 100:
        return "cien"
    centena, resto = divmod(n, 100)
    return CENTENAS[centena] + (" " + _menor_a_mil(resto) if resto else "")


def numero_a_palabras(monto) -> str:
    """Convierte un número (0 a 999.999.999) a palabras en español.

    Ejemplos:
      4800000 → "cuatro millones ochocientos mil"
      800000  → "ochocientos mil"
      6       → "seis"
    """
    n = int(abs(float(monto)))
    if n == 0:
        return "cero"

    millones, resto = divmod(n, 1_000_000)
    miles, unidades = divmod(resto, 1000)

    partes = []
    if millones:
        partes.append("un millón" if millones == 1 else f"{_menor_a_mil(millones)} millones")
    if miles:
        partes.append("mil" if miles == 1 else f"{_menor_a_mil(miles)} mil")
    if unidades:
        partes.append(_menor_a_mil(unidades))
    return " ".join(partes)
