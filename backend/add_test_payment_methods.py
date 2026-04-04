"""
Ajouter des événements de test avec toutes les méthodes de paiement
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta
import uuid

async def add_test_events():
    mongo_url = os.environ.get('MONGO_URL') or os.environ.get('MONGO_URL_PRODUCTION')
    db_name = os.environ.get('DB_NAME', 'test_database').strip('"')
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    venue_id = "venue-1771535930121"  # Bar Test
    
    print("🎯 Ajout d'événements de test avec toutes les méthodes de paiement\n")
    
    # Méthodes manquantes à tester
    test_methods = [
        ("Espèces", "especes"),
        ("Virement", "virement"),
        ("Chèque", "cheque"),
        ("Promotion", "promotion")
    ]
    
    base_date = datetime.now()
    events_added = 0
    
    for idx, (method_display, method_db) in enumerate(test_methods):
        # Créer un jam de test
        jam_id = f"jam-test-{method_db}-{uuid.uuid4().hex[:6]}"
        event_date = (base_date + timedelta(days=idx+1)).strftime('%Y-%m-%d')
        
        jam_event = {
            "id": jam_id,
            "venue_id": venue_id,
            "date": event_date,
            "start_time": "20:00",
            "equipment": ["Batterie", "Ampli"],
            "styles": ["Rock", "Blues"],
            "description": f"Jam de test - Méthode {method_display}",
            "title": f"Bœuf Test {method_display}",
            "payment_method": method_db,
            "amount": 50 + (idx * 10),
            "payment_status": "paid",
            "invoice_file": f"facture_{method_db}_001.pdf",
            "invoice_number": f"JAM-{method_display.upper()}-001",
            "created_at": datetime.now().isoformat()
        }
        
        await db.jams.insert_one(jam_event)
        events_added += 1
        print(f"✅ Jam ajouté : {method_display} ({jam_id})")
        
        # Créer un concert de test
        concert_id = f"concert-test-{method_db}-{uuid.uuid4().hex[:6]}"
        event_date = (base_date + timedelta(days=idx+10)).strftime('%Y-%m-%d')
        
        concert_event = {
            "id": concert_id,
            "venue_id": venue_id,
            "date": event_date,
            "start_time": "21:00",
            "end_time": "23:00",
            "description": f"Concert de test - Méthode {method_display}",
            "title": f"Concert Test {method_display}",
            "payment_method": method_db,
            "amount": 100 + (idx * 20),
            "payment_status": "paid",
            "invoice_file": f"facture_{method_db}_002.pdf",
            "invoice_number": f"CONCERT-{method_display.upper()}-001",
            "created_at": datetime.now().isoformat(),
            "venue_name": "Bar Test"
        }
        
        await db.concerts.insert_one(concert_event)
        events_added += 1
        print(f"✅ Concert ajouté : {method_display} ({concert_id})")
    
    print(f"\n🎉 {events_added} événements de test ajoutés avec succès !")
    print("\n📋 Méthodes de paiement maintenant disponibles pour les tests :")
    print("   - GUSO ✅")
    print("   - Facture ✅")
    print("   - Espèces ✅")
    print("   - Virement ✅")
    print("   - Chèque ✅")
    print("   - Promotion ✅")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(add_test_events())
