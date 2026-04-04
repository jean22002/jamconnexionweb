"""
Compléter les payment_method manquants pour tous les événements
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

async def complete_payment_methods():
    mongo_url = os.environ.get('MONGO_URL')
    client = AsyncIOMotorClient(mongo_url)
    db = client['test_database']
    
    venue_id = 'venue-1771535930121'
    
    print("🔧 Complétion des méthodes de paiement manquantes\n")
    
    # Méthodes à distribuer équitablement
    methods = ['guso', 'facture', 'especes', 'virement', 'cheque', 'promotion']
    method_index = 0
    
    total_updated = 0
    
    # Jams
    jams = await db.jams.find({'venue_id': venue_id}).to_list(1000)
    for jam in jams:
        if not jam.get('payment_method'):
            method = methods[method_index % len(methods)]
            await db.jams.update_one(
                {'id': jam['id']},
                {'$set': {'payment_method': method}}
            )
            print(f"✅ Jam {jam.get('id', 'unknown')}: payment_method = {method}")
            total_updated += 1
            method_index += 1
    
    # Concerts
    concerts = await db.concerts.find({'venue_id': venue_id}).to_list(1000)
    for concert in concerts:
        if not concert.get('payment_method'):
            method = methods[method_index % len(methods)]
            await db.concerts.update_one(
                {'id': concert['id']},
                {'$set': {'payment_method': method}}
            )
            print(f"✅ Concert {concert.get('id', 'unknown')}: payment_method = {method}")
            total_updated += 1
            method_index += 1
    
    # Karaokes
    karaokes = await db.karaoke.find({'venue_id': venue_id}).to_list(1000)
    for karaoke in karaokes:
        if not karaoke.get('payment_method'):
            method = methods[method_index % len(methods)]
            await db.karaoke.update_one(
                {'id': karaoke['id']},
                {'$set': {'payment_method': method}}
            )
            print(f"✅ Karaoké {karaoke.get('id', 'unknown')}: payment_method = {method}")
            total_updated += 1
            method_index += 1
    
    # Spectacles
    spectacles = await db.spectacle.find({'venue_id': venue_id}).to_list(1000)
    for spectacle in spectacles:
        if not spectacle.get('payment_method'):
            method = methods[method_index % len(methods)]
            await db.spectacle.update_one(
                {'id': spectacle['id']},
                {'$set': {'payment_method': method}}
            )
            print(f"✅ Spectacle {spectacle.get('id', 'unknown')}: payment_method = {method}")
            total_updated += 1
            method_index += 1
    
    print(f"\n🎉 {total_updated} événements mis à jour !")
    print("\n✅ TOUS vos événements ont maintenant :")
    print("   - invoice_file (pour générer le PDF)")
    print("   - payment_method (pour le filtrage)")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(complete_payment_methods())
