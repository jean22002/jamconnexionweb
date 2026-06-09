"""
Helpers de normalisation des dates d'événement (Build 95).

Garantit que toutes les dates retournées par l'API sont au format `YYYY-MM-DD` strict,
même si la BDD contient (ou recevra un jour) des dates ISO datetime "YYYY-MM-DDTHH:MM:SS".
"""

from typing import Any, Iterable, List


def normalize_date_str(val: Any) -> Any:
    """Tronque une chaîne "YYYY-MM-DDTHH:MM:SS[.SSS][Z|+HH:MM]" à "YYYY-MM-DD".

    Retourne la valeur inchangée si :
    - non-string
    - chaîne < 10 chars
    - déjà au format YYYY-MM-DD (10 chars sans 'T')
    """
    if not isinstance(val, str) or len(val) < 10:
        return val
    return val[:10] if 'T' in val else val


def normalize_event_dates(docs: Iterable[dict], fields: List[str] = None) -> List[dict]:
    """Applique `normalize_date_str` sur les champs date d'une liste de documents.

    Args:
        docs: liste de documents (dicts)
        fields: liste de noms de champs à normaliser. Par défaut ['date', 'slot_date'].
    """
    if fields is None:
        fields = ['date', 'slot_date']
    out = []
    for d in docs:
        if isinstance(d, dict):
            for f in fields:
                if f in d:
                    d[f] = normalize_date_str(d[f])
        out.append(d)
    return out
