"""
Test du filtrage par méthode de paiement
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient

async def test_payment_methods():
    mongo_url = os.environ.get('MONGO_URL') or os.environ.get('MONGO_URL_PRODUCTION')
    db_name = os.environ.get('DB_NAME', 'test_database').strip('"')
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    venue_id = "venue-1771535930121"  # Bar Test
    
    print("🔍 Analyse des méthodes de paiement pour tous les événements\n")
    
    # Récupérer tous les événements
    jams = await db.jams.find({"venue_id": venue_id}, {"_id": 0}).to_list(1000)
    concerts = await db.concerts.find({"venue_id": venue_id}, {"_id": 0}).to_list(1000)
    karaokes = await db.karaoke.find({"venue_id": venue_id}, {"_id": 0}).to_list(1000)
    spectacles = await db.spectacle.find({"venue_id": venue_id}, {"_id": 0}).to_list(1000)
    
    all_events = jams + concerts + karaokes + spectacles
    
    print(f"📊 Total événements: {len(all_events)}\n")
    
    # Compter par méthode de paiement
    payment_methods = {}
    events_with_invoices = 0
    
    for event in all_events:
        method = event.get('payment_method') or 'Non défini'
        has_invoice = event.get('invoice_file') or event.get('invoice_url')
        
        if has_invoice:
            events_with_invoices += 1
            
        if method in payment_methods:
            payment_methods[method]['total'] += 1
            if has_invoice:
                payment_methods[method]['with_invoice'] += 1
        else:
            payment_methods[method] = {
                'total': 1,
                'with_invoice': 1 if has_invoice else 0
            }
    
    print(f"✅ Événements avec facture: {events_with_invoices}/{len(all_events)}\n")
    
    # Afficher par méthode
    print("📋 Répartition par méthode de paiement:")
    print("-" * 70)
    print(f"{'Méthode':<20} {'Total':<10} {'Avec facture':<15} {'%':<10}")
    print("-" * 70)
    
    for method, data in sorted(payment_methods.items()):
        pct = (data['with_invoice'] / data['total'] * 100) if data['total'] > 0 else 0
        print(f"{method:<20} {data['total']:<10} {data['with_invoice']:<15} {pct:.1f}%")
    
    print("-" * 70)
    
    # Tester le filtrage (comme dans l'API)
    print("\n🧪 Test du filtrage (case-insensitive):")
    print("-" * 70)
    
    test_filters = ["GUSO", "Facture", "Espèces", "Virement", "Chèque", "Promotion"]
    
    for filter_method in test_filters:
        count = 0
        for event in all_events:
            event_method = str(event.get('payment_method', '')).lower()
            filter_lower = filter_method.lower()
            has_invoice = event.get('invoice_file') or event.get('invoice_url')
            
            if event_method == filter_lower and has_invoice:
                count += 1
        
        status = "✅" if count > 0 else "❌"
        print(f"{status} {filter_method:<20} → {count} événement(s) avec facture")
    
    print("-" * 70)
    
    client.close()

if __name__ == "__main__":
    asyncio.run(test_payment_methods())
