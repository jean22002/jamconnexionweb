"""
Ajouter des factures fictives aux événements de Bar Test
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient

async def add_invoices_to_events():
    mongo_url = os.environ.get('MONGO_URL') or os.environ.get('MONGO_URL_PRODUCTION')
    db_name = os.environ.get('DB_NAME', 'test_database').strip('"')
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    venue_id = "venue-1771535930121"  # Bar Test
    
    print(f"🎯 Ajout de factures fictives pour venue: {venue_id}\n")
    
    total_updated = 0
    
    # Mise à jour des Jams
    print("🎵 Mise à jour des Jams...")
    jams = await db.jams.find({"venue_id": venue_id}, {"_id": 0}).to_list(1000)
    for idx, jam in enumerate(jams):
        if not jam.get("invoice_file"):
            await db.jams.update_one(
                {"id": jam["id"]},
                {"$set": {
                    "invoice_file": f"facture_jam_{idx+1:03d}.pdf",
                    "invoice_number": f"JAM-2026-{idx+1:03d}",
                    "payment_status": "paid"
                }}
            )
            total_updated += 1
    print(f"   ✅ {len([j for j in jams if not j.get('invoice_file')])} jams mis à jour")
    
    # Mise à jour des Concerts
    print("\n🎸 Mise à jour des Concerts...")
    concerts = await db.concerts.find({"venue_id": venue_id}, {"_id": 0}).to_list(1000)
    for idx, concert in enumerate(concerts):
        if not concert.get("invoice_file"):
            await db.concerts.update_one(
                {"id": concert["id"]},
                {"$set": {
                    "invoice_file": f"facture_concert_{idx+1:03d}.pdf",
                    "invoice_number": f"CONCERT-2026-{idx+1:03d}",
                    "payment_status": "paid"
                }}
            )
            total_updated += 1
    print(f"   ✅ {len([c for c in concerts if not c.get('invoice_file')])} concerts mis à jour")
    
    # Mise à jour des Karaokés
    print("\n🎤 Mise à jour des Karaokés...")
    karaokes = await db.karaoke.find({"venue_id": venue_id}, {"_id": 0}).to_list(1000)
    for idx, karaoke in enumerate(karaokes):
        if not karaoke.get("invoice_file"):
            await db.karaoke.update_one(
                {"id": karaoke["id"]},
                {"$set": {
                    "invoice_file": f"facture_karaoke_{idx+1:03d}.pdf",
                    "invoice_number": f"KARAOKE-2026-{idx+1:03d}",
                    "payment_status": "paid"
                }}
            )
            total_updated += 1
    print(f"   ✅ {len([k for k in karaokes if not k.get('invoice_file')])} karaokés mis à jour")
    
    # Mise à jour des Spectacles
    print("\n🎭 Mise à jour des Spectacles...")
    spectacles = await db.spectacle.find({"venue_id": venue_id}, {"_id": 0}).to_list(1000)
    for idx, spectacle in enumerate(spectacles):
        if not spectacle.get("invoice_file"):
            await db.spectacle.update_one(
                {"id": spectacle["id"]},
                {"$set": {
                    "invoice_file": f"facture_spectacle_{idx+1:03d}.pdf",
                    "invoice_number": f"SPECTACLE-2026-{idx+1:03d}",
                    "payment_status": "paid"
                }}
            )
            total_updated += 1
    print(f"   ✅ {len([s for s in spectacles if not s.get('invoice_file')])} spectacles mis à jour")
    
    print(f"\n🎉 Terminé ! {total_updated} événements ont été mis à jour")
    print("\n✅ Vous pouvez maintenant tester le téléchargement ZIP sur jamconnexion.com")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(add_invoices_to_events())
