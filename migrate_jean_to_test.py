"""
Script de migration des données du profil 'jean' vers le profil 'Test'
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import json
from datetime import datetime, timezone

async def migrate_profile():
    mongo_url = 'mongodb+srv://jean_jamconnexion:marcel22021983@customer-apps.xtch2ol.mongodb.net/test_database?retryWrites=true&w=majority'
    client = AsyncIOMotorClient(mongo_url)
    db = client['test_database']
    
    # IDs
    old_user_id = "c18b0954-33de-48bb-bff1-a330cd23ba23"
    old_musician_id = "fc5c0e8c-2684-45f6-bd4e-505eb63213b8"
    new_user_id = "fa1de398-8fee-4b1c-91b1-15b99aac68b7"
    new_musician_id = "4fb95ea4-46c6-45ef-9bf6-cb04babfae00"
    
    print("🔍 Récupération des données du profil 'jean'...")
    old_musician = await db.musicians.find_one({'user_id': old_user_id}, {'_id': 0})
    
    if not old_musician:
        print("❌ Profil 'jean' non trouvé!")
        client.close()
        return
    
    print(f"✅ Profil 'jean' trouvé avec {len(old_musician.get('bands', []))} groupe(s)")
    
    # Préparer les données à migrer
    migration_data = {
        'age': old_musician.get('age'),
        'profile_image': old_musician.get('profile_image'),
        'bio': old_musician.get('bio', ''),
        'instruments': old_musician.get('instruments', []),
        'music_styles': old_musician.get('music_styles', []),
        'experience_years': old_musician.get('experience_years', 0),
        'city': old_musician.get('city'),
        'department': old_musician.get('department'),
        'phone': old_musician.get('phone', ''),
        'website': old_musician.get('website', ''),
        'facebook': old_musician.get('facebook', ''),
        'instagram': old_musician.get('instagram', ''),
        'youtube': old_musician.get('youtube', ''),
        'bandcamp': old_musician.get('bandcamp', ''),
        'has_band': old_musician.get('has_band', False),
        'band': old_musician.get('band', {}),
        'concerts': old_musician.get('concerts', []),
        'experience_level': old_musician.get('experience_level'),
        'region': old_musician.get('region'),
        'bands': old_musician.get('bands', []),
        'solo_profile': old_musician.get('solo_profile', {}),
        'guso_number': old_musician.get('guso_number'),
        'is_guso_member': old_musician.get('is_guso_member', False),
        'temporary_city': old_musician.get('temporary_city'),
        'temporary_latitude': old_musician.get('temporary_latitude'),
        'temporary_location_enabled': old_musician.get('temporary_location_enabled', False),
        'temporary_location_expires': old_musician.get('temporary_location_expires'),
        'temporary_longitude': old_musician.get('temporary_longitude')
    }
    
    # Mettre à jour admin_id dans les groupes pour pointer vers le nouveau user_id
    if migration_data['bands']:
        for band in migration_data['bands']:
            if band.get('admin_id') == old_user_id:
                band['admin_id'] = new_user_id
                print(f"   ✓ admin_id du groupe '{band.get('name')}' mis à jour")
    
    print("\n📝 Mise à jour du profil 'Test' avec les données migrées...")
    result = await db.musicians.update_one(
        {'user_id': new_user_id},
        {'$set': migration_data}
    )
    
    if result.modified_count > 0:
        print("✅ Profil 'Test' mis à jour avec succès!")
    else:
        print("⚠️ Aucune modification apportée au profil")
    
    # Mettre à jour la collection bands pour que le groupe "toto" pointe vers le nouveau musician_id
    print("\n🔄 Mise à jour de la collection 'bands'...")
    band_id = "band_1774537131742_2653ae123"
    band_result = await db.bands.update_one(
        {'id': band_id},
        {'$set': {'leader_id': new_musician_id}}
    )
    
    if band_result.modified_count > 0:
        print(f"✅ Groupe 'toto' (ID: {band_id}) mis à jour - leader_id pointe maintenant vers le nouveau profil")
    else:
        print("⚠️ Le groupe n'a pas été modifié")
    
    # Vérification finale
    print("\n🔍 Vérification finale...")
    updated_musician = await db.musicians.find_one({'user_id': new_user_id}, {'_id': 0})
    
    print(f"\n=== PROFIL MIS À JOUR ===")
    print(f"Pseudo: {updated_musician.get('pseudo')}")
    print(f"Âge: {updated_musician.get('age')}")
    print(f"Ville: {updated_musician.get('city')}")
    print(f"Styles musicaux: {updated_musician.get('music_styles')}")
    print(f"Nombre de groupes: {len(updated_musician.get('bands', []))}")
    print(f"Nombre de concerts: {len(updated_musician.get('concerts', []))}")
    
    if updated_musician.get('bands'):
        for band in updated_musician['bands']:
            print(f"\n  Groupe: {band.get('name')}")
            print(f"  Admin ID: {band.get('admin_id')}")
            print(f"  Band ID: {band.get('band_id')}")
    
    # Vérifier la collection bands
    band = await db.bands.find_one({'id': band_id}, {'_id': 0})
    if band:
        print(f"\n=== GROUPE DANS COLLECTION BANDS ===")
        print(f"Nom: {band.get('name')}")
        print(f"Leader ID: {band.get('leader_id')}")
    
    client.close()
    print("\n✅ Migration terminée avec succès!")

if __name__ == "__main__":
    asyncio.run(migrate_profile())
