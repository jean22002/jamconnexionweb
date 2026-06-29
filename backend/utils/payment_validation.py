"""
Validation centralisée des champs comptables `payment_method` + `payment_mode`.

Sémantique 2026-05 :
- payment_method  → type de document/nature du revenu :  facture | guso | promotion | None
- payment_mode    → mode de paiement effectif         :  especes | cheque | virement | None
- amount          → montant en € (None autorisé sauf en mode promotion où il est forcé à 0)

Règles :
 - payment_method = "promotion" → payment_mode obligatoirement None, amount forcé à 0
 - payment_method ∈ {facture, guso} → payment_mode obligatoire dans {especes, cheque, virement}
 - payment_method = None → payment_mode peut être None (événement sans compta)
"""

from fastapi import HTTPException

VALID_PAYMENT_METHODS = {"facture", "guso", "promotion"}
VALID_PAYMENT_MODES = {"especes", "cheque", "virement"}


def validate_and_normalize_payment_fields(data: dict) -> dict:
    """
    Valide et normalise les champs payment_method, payment_mode et amount d'un dict d'event.
    Modifie data en place et le retourne.
    Lève HTTPException(400) si les règles métier ne sont pas respectées.
    """
    method = data.get("payment_method")
    mode = data.get("payment_mode")

    # Si rien n'est fourni, on laisse passer
    if method is None and mode is None:
        return data

    # Valider payment_method
    if method is not None and method not in VALID_PAYMENT_METHODS:
        raise HTTPException(
            status_code=400,
            detail=f"payment_method invalide. Valeurs autorisées : {sorted(VALID_PAYMENT_METHODS)}"
        )

    # Valider payment_mode
    if mode is not None and mode not in VALID_PAYMENT_MODES:
        raise HTTPException(
            status_code=400,
            detail=f"payment_mode invalide. Valeurs autorisées : {sorted(VALID_PAYMENT_MODES)}"
        )

    # Règles métier
    if method == "promotion":
        # Promotion = gratuit. On force amount à 0 et on enlève le mode.
        data["payment_mode"] = None
        data["amount"] = 0
    elif method in ("facture", "guso"):
        if not mode:
            raise HTTPException(
                status_code=400,
                detail="payment_mode est obligatoire quand payment_method est 'facture' ou 'guso'"
            )

    return data
