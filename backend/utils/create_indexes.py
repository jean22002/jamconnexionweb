"""
MongoDB Database Indexes Setup
Optimise les queries pour des performances maximales
"""
from motor.motor_asyncio import AsyncIOMotorClient
import os
import asyncio

# Configuration MongoDB
MONGO_URL = os.environ.get('MONGO_URL')
DB_NAME = os.environ.get('DB_NAME')


async def create_all_indexes():
    """
    Crée tous les indexes nécessaires pour optimiser les performances
    """
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print("🔍 Création des indexes MongoDB...")
    
    try:
        # ========== USERS ==========
        # Index pour recherche par email (login)
        await db.users.create_index("email", unique=True, name="idx_users_email")
        
        # Index pour recherche par ID
        await db.users.create_index("id", unique=True, name="idx_users_id")
        
        # Index pour recherche par rôle
        await db.users.create_index("role", name="idx_users_role")
        
        print("✅ Users indexes créés")
        
        # ========== MUSICIANS ==========
        # Index pour recherche par user_id
        await db.musicians.create_index("user_id", unique=True, name="idx_musicians_user_id")
        
        # Index pour recherche par ID
        await db.musicians.create_index("id", unique=True, name="idx_musicians_id")
        
        # Index géospatial pour recherche par proximité
        await db.musicians.create_index([("location", "2dsphere")], name="idx_musicians_location")
        
        # Index composé pour recherche par styles musicaux et ville
        await db.musicians.create_index(
            [("music_styles", 1), ("city", 1)],
            name="idx_musicians_styles_city"
        )
        
        # Index pour recherche par instruments
        await db.musicians.create_index("instruments", name="idx_musicians_instruments")
        
        print("✅ Musicians indexes créés")
        
        # ========== VENUES ==========
        # Index pour recherche par user_id
        await db.venues.create_index("user_id", unique=True, name="idx_venues_user_id")
        
        # Index pour recherche par ID
        await db.venues.create_index("id", unique=True, name="idx_venues_id")
        
        # Index géospatial
        await db.venues.create_index([("location", "2dsphere")], name="idx_venues_location")
        
        # Index pour recherche par ville
        await db.venues.create_index("city", name="idx_venues_city")
        
        # Index pour établissements avec abonnement actif
        await db.venues.create_index(
            [("subscription_status", 1), ("trial_end", 1)],
            name="idx_venues_subscription"
        )
        
        print("✅ Venues indexes créés")
        
        # ========== JAMS / CONCERTS / EVENTS ==========
        # JAMS
        await db.jams.create_index("id", unique=True, name="idx_jams_id")
        await db.jams.create_index("venue_id", name="idx_jams_venue_id")
        await db.jams.create_index([("date", -1)], name="idx_jams_date")
        await db.jams.create_index(
            [("venue_id", 1), ("date", -1)],
            name="idx_jams_venue_date"
        )
        
        # CONCERTS
        await db.concerts.create_index("id", unique=True, name="idx_concerts_id")
        await db.concerts.create_index("venue_id", name="idx_concerts_venue_id")
        await db.concerts.create_index([("date", -1)], name="idx_concerts_date")
        await db.concerts.create_index(
            [("venue_id", 1), ("date", -1)],
            name="idx_concerts_venue_date"
        )
        
        print("✅ Events indexes créés")
        
        # ========== MESSAGES ==========
        # Index pour récupérer les conversations d'un utilisateur
        await db.messages.create_index("id", unique=True, name="idx_messages_id")
        await db.messages.create_index(
            [("sender_id", 1), ("created_at", -1)],
            name="idx_messages_sender"
        )
        await db.messages.create_index(
            [("recipient_id", 1), ("created_at", -1)],
            name="idx_messages_recipient"
        )
        
        # Index composé pour recherche de conversation entre 2 users
        await db.messages.create_index(
            [("sender_id", 1), ("recipient_id", 1), ("created_at", -1)],
            name="idx_messages_conversation"
        )
        
        # Index pour messages non lus
        await db.messages.create_index(
            [("recipient_id", 1), ("read", 1)],
            name="idx_messages_unread"
        )
        
        print("✅ Messages indexes créés")
        
        # ========== APPLICATIONS (Candidatures) ==========
        await db.applications.create_index("id", unique=True, name="idx_applications_id")
        await db.applications.create_index(
            [("venue_id", 1), ("status", 1)],
            name="idx_applications_venue_status"
        )
        await db.applications.create_index(
            [("band_id", 1), ("status", 1)],
            name="idx_applications_band_status"
        )
        await db.applications.create_index(
            [("created_at", -1)],
            name="idx_applications_date"
        )
        
        print("✅ Applications indexes créés")
        
        # ========== REVIEWS (Avis) ==========
        await db.reviews.create_index("id", unique=True, name="idx_reviews_id")
        await db.reviews.create_index(
            [("reviewee_id", 1), ("rating", -1)],
            name="idx_reviews_reviewee"
        )
        await db.reviews.create_index("reviewer_id", name="idx_reviews_reviewer")
        await db.reviews.create_index(
            [("created_at", -1)],
            name="idx_reviews_date"
        )
        
        print("✅ Reviews indexes créés")
        
        # ========== NOTIFICATIONS ==========
        await db.notifications.create_index("id", unique=True, name="idx_notifications_id")
        await db.notifications.create_index(
            [("user_id", 1), ("read", 1), ("created_at", -1)],
            name="idx_notifications_user_unread"
        )
        
        print("✅ Notifications indexes créés")
        
        # ========== FRIENDS (Jacks) ==========
        await db.friends.create_index("id", unique=True, name="idx_friends_id")
        await db.friends.create_index(
            [("user1_id", 1), ("status", 1)],
            name="idx_friends_user1"
        )
        await db.friends.create_index(
            [("user2_id", 1), ("status", 1)],
            name="idx_friends_user2"
        )
        
        print("✅ Friends indexes créés")
        
        # ========== BANDS (Groupes) ==========
        await db.bands.create_index("id", unique=True, name="idx_bands_id")
        await db.bands.create_index("name", name="idx_bands_name")
        await db.bands.create_index("music_styles", name="idx_bands_styles")
        await db.bands.create_index(
            [("city", 1), ("music_styles", 1)],
            name="idx_bands_city_styles"
        )
        
        print("✅ Bands indexes créés")
        
        # ========== VENUE_SUBSCRIPTIONS (Abonnements aux établissements) ==========
        await db.venue_subscriptions.create_index(
            [("user_id", 1), ("venue_id", 1)],
            unique=True,
            name="idx_venue_subs_user_venue"
        )
        await db.venue_subscriptions.create_index("venue_id", name="idx_venue_subs_venue")
        
        print("✅ Venue subscriptions indexes créés")
        
        # ========== MELOMANES ==========
        await db.melomanes.create_index("user_id", unique=True, name="idx_melomanes_user_id")
        await db.melomanes.create_index("id", unique=True, name="idx_melomanes_id")
        
        print("✅ Melomanes indexes créés")
        
        print("\n🎉 Tous les indexes ont été créés avec succès !")
        
        # Afficher les statistiques
        collections = [
            'users', 'musicians', 'venues', 'jams', 'concerts',
            'messages', 'applications', 'reviews', 'notifications',
            'friends', 'bands', 'venue_subscriptions', 'melomanes'
        ]
        
        print("\n📊 Résumé des indexes par collection:")
        for collection_name in collections:
            indexes = await db[collection_name].list_indexes().to_list(None)
            print(f"  • {collection_name}: {len(indexes)} indexes")
        
    except Exception as e:
        print(f"❌ Erreur lors de la création des indexes: {e}")
        raise
    finally:
        client.close()


async def drop_all_indexes():
    """
    Supprime tous les indexes (sauf _id)
    ATTENTION: À utiliser avec précaution !
    """
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    collections = await db.list_collection_names()
    
    for collection_name in collections:
        try:
            # Récupérer tous les indexes
            indexes = await db[collection_name].list_indexes().to_list(None)
            
            # Supprimer tous sauf _id
            for index in indexes:
                if index['name'] != '_id_':
                    await db[collection_name].drop_index(index['name'])
                    print(f"✅ Index {index['name']} supprimé de {collection_name}")
                    
        except Exception as e:
            print(f"⚠️  Erreur sur {collection_name}: {e}")
    
    client.close()
    print("\n🎉 Tous les indexes ont été supprimés")


async def show_index_stats():
    """
    Affiche les statistiques d'utilisation des indexes
    """
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    collections = await db.list_collection_names()
    
    print("\n📊 Statistiques des Indexes MongoDB\n")
    
    for collection_name in collections:
        try:
            indexes = await db[collection_name].list_indexes().to_list(None)
            
            if len(indexes) > 1:  # Plus que juste _id
                print(f"\n🔹 Collection: {collection_name}")
                print(f"   Nombre d'indexes: {len(indexes)}")
                
                for index in indexes:
                    name = index.get('name', 'N/A')
                    keys = index.get('key', {})
                    unique = index.get('unique', False)
                    
                    print(f"   • {name}")
                    print(f"     Keys: {keys}")
                    if unique:
                        print(f"     Type: UNIQUE")
                        
        except Exception as e:
            print(f"⚠️  Erreur sur {collection_name}: {e}")
    
    client.close()


# Script principal
if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == "create":
            asyncio.run(create_all_indexes())
        elif command == "drop":
            print("⚠️  ATTENTION: Vous allez supprimer tous les indexes !")
            confirm = input("Tapez 'oui' pour confirmer: ")
            if confirm.lower() == 'oui':
                asyncio.run(drop_all_indexes())
        elif command == "stats":
            asyncio.run(show_index_stats())
        else:
            print("Usage: python create_indexes.py [create|drop|stats]")
    else:
        # Par défaut, créer les indexes
        asyncio.run(create_all_indexes())
