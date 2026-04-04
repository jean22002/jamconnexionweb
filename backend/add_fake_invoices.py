"""
Script pour ajouter des factures fictives aux événements existants
pour tester le système de téléchargement ZIP
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

async def add_fake_invoices():
    # Connexion MongoDB
    mongo_url = os.environ.get('MONGO_URL') or os.environ.get('MONGO_URL_PRODUCTION')
    db_name = os.environ.get('DB_NAME', 'test_database').strip('"')
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print(f"🔌 Connexion à MongoDB: {db_name}")
    print("🔍 Recherche des établissements...")
    
    # Trouver le venue "bar" ou celui avec le plus d'événements
    venues_cursor = db.venues.find({}, {"_id": 0})
    venues = await venues_cursor.to_list(100)
    
    if not venues:
        print("❌ Aucun établissement trouvé")
        return
    
    # Chercher le venue avec le plus d'événements
    venue = None
    max_events = 0
    for v in venues:
        events_count = len(v.get("jams", [])) + len(v.get("concerts", [])) + len(v.get("karaokes", [])) + len(v.get("spectacles", []))
        if events_count > max_events:
            max_events = events_count
            venue = v
    
    if not venue:
        print("❌ Aucun établissement avec des événements trouvé")
        return
    
    venue_id = venue.get("id")
    print(f"✅ Établissement trouvé: {venue.get('name')} (ID: {venue_id})")
    
    # Factures fictives à ajouter
    fake_invoices = [
        "facture_jam_2026_001.pdf",
        "facture_concert_2026_002.pdf",
        "facture_karaoke_2026_003.pdf",
        "facture_spectacle_2026_004.pdf",
        "facture_jam_2026_005.pdf"
    ]
    
    total_updated = 0
    
    # Ajouter invoice_file aux Jams
    jams = venue.get("jams", [])
    if jams:
        print(f"\n📝 Mise à jour des Jams ({len(jams)} événements)...")
        for idx, jam in enumerate(jams[:5]):  # Limiter aux 5 premiers
            jam["invoice_file"] = fake_invoices[idx % len(fake_invoices)]
            jam["invoice_number"] = f"JAM-2026-{str(idx+1).zfill(3)}"
            if not jam.get("payment_method"):
                jam["payment_method"] = ["GUSO", "Facture", "Espèces", "Virement"][idx % 4]
            if not jam.get("payment_status"):
                jam["payment_status"] = "paid"
            total_updated += 1
        
        await db.venues.update_one(
            {"id": venue_id},
            {"$set": {"jams": jams}}
        )
        print(f"✅ {min(5, len(jams))} Jams mis à jour")
    
    # Ajouter invoice_file aux Concerts
    concerts = venue.get("concerts", [])
    if concerts:
        print(f"\n🎸 Mise à jour des Concerts ({len(concerts)} événements)...")
        for idx, concert in enumerate(concerts[:5]):
            concert["invoice_file"] = fake_invoices[idx % len(fake_invoices)]
            concert["invoice_number"] = f"CONCERT-2026-{str(idx+1).zfill(3)}"
            if not concert.get("payment_method"):
                concert["payment_method"] = ["GUSO", "Facture", "Espèces", "Chèque"][idx % 4]
            if not concert.get("payment_status"):
                concert["payment_status"] = "paid"
            total_updated += 1
        
        await db.venues.update_one(
            {"id": venue_id},
            {"$set": {"concerts": concerts}}
        )
        print(f"✅ {min(5, len(concerts))} Concerts mis à jour")
    
    # Ajouter invoice_file aux Karaokés
    karaokes = venue.get("karaokes", [])
    if karaokes:
        print(f"\n🎤 Mise à jour des Karaokés ({len(karaokes)} événements)...")
        for idx, karaoke in enumerate(karaokes[:5]):
            karaoke["invoice_file"] = fake_invoices[idx % len(fake_invoices)]
            karaoke["invoice_number"] = f"KARAOKE-2026-{str(idx+1).zfill(3)}"
            if not karaoke.get("payment_method"):
                karaoke["payment_method"] = ["Facture", "Espèces", "Virement", "Promotion"][idx % 4]
            if not karaoke.get("payment_status"):
                karaoke["payment_status"] = "paid"
            total_updated += 1
        
        await db.venues.update_one(
            {"id": venue_id},
            {"$set": {"karaokes": karaokes}}
        )
        print(f"✅ {min(5, len(karaokes))} Karaokés mis à jour")
    
    # Ajouter invoice_file aux Spectacles
    spectacles = venue.get("spectacles", [])
    if spectacles:
        print(f"\n🎭 Mise à jour des Spectacles ({len(spectacles)} événements)...")
        for idx, spectacle in enumerate(spectacles[:5]):
            spectacle["invoice_file"] = fake_invoices[idx % len(fake_invoices)]
            spectacle["invoice_number"] = f"SPECTACLE-2026-{str(idx+1).zfill(3)}"
            if not spectacle.get("payment_method"):
                spectacle["payment_method"] = ["GUSO", "Facture", "Chèque", "Virement"][idx % 4]
            if not spectacle.get("payment_status"):
                spectacle["payment_status"] = "paid"
            total_updated += 1
        
        await db.venues.update_one(
            {"id": venue_id},
            {"$set": {"spectacles": spectacles}}
        )
        print(f"✅ {min(5, len(spectacles))} Spectacles mis à jour")
    
    print(f"\n🎉 Terminé ! {total_updated} événements ont été mis à jour avec des factures fictives")
    print("\n📋 Récapitulatif:")
    print("   - Champs ajoutés: invoice_file, invoice_number")
    print("   - Méthodes de paiement: GUSO, Facture, Espèces, Virement, Chèque, Promotion")
    print("   - Statut de paiement: paid")
    print("\n✅ Vous pouvez maintenant tester le téléchargement ZIP sur jamconnexion.com")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(add_fake_invoices())
