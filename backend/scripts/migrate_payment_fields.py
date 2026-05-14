"""
Migration : sépare payment_method en deux champs (payment_method + payment_mode).

Avant : payment_method ∈ {especes, cheque, virement, facture, guso, promotion, ...}
Après :
  payment_method ∈ {facture, guso, promotion, null}
  payment_mode   ∈ {especes, cheque, virement, null}

Pour les documents dont payment_method ∈ {especes, cheque, virement} (ancien mélange),
on déplace la valeur dans payment_mode et on met payment_method à "facture" par défaut.

Usage :
  cd /app/backend && python3 scripts/migrate_payment_fields.py --dry-run
  cd /app/backend && python3 scripts/migrate_payment_fields.py --apply
"""

import asyncio
import os
import sys
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv('/app/backend/.env')

OLD_MODES = {"especes", "cheque", "virement"}
# Mapping pour normaliser les anciennes valeurs FR éventuellement utilisées
NORMALIZE_OLD_VALUE = {
    "espèces": "especes",
    "espece": "especes",
    "Espèces": "especes",
    "Espèce": "especes",
    "Espèces": "especes",
    "chèque": "cheque",
    "Chèque": "cheque",
    "virement": "virement",
    "Virement": "virement",
    "GUSO": "guso",
    "Guso": "guso",
    "Facture": "facture",
    "Promotion": "promotion",
}

COLLECTIONS = ["jams", "concerts", "karaoke", "spectacle"]


async def migrate(dry_run: bool = True):
    client = AsyncIOMotorClient(os.environ["MONGO_URL"])
    db = client[os.environ["DB_NAME"]]

    total_inspected = 0
    total_migrated = 0
    total_normalized_only = 0

    for coll_name in COLLECTIONS:
        coll = db[coll_name]
        print(f"\n=== Collection: {coll_name} ===")
        cursor = coll.find({}, {"_id": 1, "id": 1, "payment_method": 1, "payment_mode": 1, "amount": 1})
        async for doc in cursor:
            total_inspected += 1
            current_method = doc.get("payment_method")
            current_mode = doc.get("payment_mode")
            new_method = current_method
            new_mode = current_mode

            # Normaliser anciennes valeurs FR
            if current_method in NORMALIZE_OLD_VALUE:
                new_method = NORMALIZE_OLD_VALUE[current_method]

            # Si payment_method = especes/cheque/virement → déplacer dans payment_mode
            if new_method in OLD_MODES:
                new_mode = new_method
                new_method = "facture"

            # Si rien à changer, skip
            if new_method == current_method and new_mode == current_mode:
                continue

            update = {"payment_method": new_method, "payment_mode": new_mode}
            print(f"  - {doc.get('id', doc.get('_id'))}: "
                  f"method '{current_method}'→'{new_method}', mode '{current_mode}'→'{new_mode}'")
            total_migrated += 1

            if not dry_run:
                await coll.update_one({"_id": doc["_id"]}, {"$set": update})

    print(f"\n=== RÉSUMÉ ===")
    print(f"Documents inspectés : {total_inspected}")
    print(f"Documents migrés    : {total_migrated}")
    if dry_run:
        print("(DRY RUN — aucune écriture. Relancer avec --apply pour appliquer.)")
    else:
        print("✅ Migration appliquée.")


if __name__ == "__main__":
    dry = "--apply" not in sys.argv
    asyncio.run(migrate(dry_run=dry))
