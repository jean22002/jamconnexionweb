"""
Script de migration pour remplir les champs region et department des venues
à partir de leur code postal
"""
import os
from pymongo import MongoClient

# Mapping département -> région (basé sur france-locations.js)
DEPT_TO_REGION = {
    "01": "Auvergne-Rhône-Alpes",
    "02": "Hauts-de-France",
    "03": "Auvergne-Rhône-Alpes",
    "04": "Provence-Alpes-Côte d'Azur",
    "05": "Provence-Alpes-Côte d'Azur",
    "06": "Provence-Alpes-Côte d'Azur",
    "07": "Auvergne-Rhône-Alpes",
    "08": "Grand Est",
    "09": "Occitanie",
    "10": "Grand Est",
    "11": "Occitanie",
    "12": "Occitanie",
    "13": "Provence-Alpes-Côte d'Azur",
    "14": "Normandie",
    "15": "Auvergne-Rhône-Alpes",
    "16": "Nouvelle-Aquitaine",
    "17": "Nouvelle-Aquitaine",
    "18": "Centre-Val de Loire",
    "19": "Nouvelle-Aquitaine",
    "21": "Bourgogne-Franche-Comté",
    "22": "Bretagne",
    "23": "Nouvelle-Aquitaine",
    "24": "Nouvelle-Aquitaine",
    "25": "Bourgogne-Franche-Comté",
    "26": "Auvergne-Rhône-Alpes",
    "27": "Normandie",
    "28": "Centre-Val de Loire",
    "29": "Bretagne",
    "2A": "Corse",
    "2B": "Corse",
    "30": "Occitanie",
    "31": "Occitanie",
    "32": "Occitanie",
    "33": "Nouvelle-Aquitaine",
    "34": "Occitanie",
    "35": "Bretagne",
    "36": "Centre-Val de Loire",
    "37": "Centre-Val de Loire",
    "38": "Auvergne-Rhône-Alpes",
    "39": "Bourgogne-Franche-Comté",
    "40": "Nouvelle-Aquitaine",
    "41": "Centre-Val de Loire",
    "42": "Auvergne-Rhône-Alpes",
    "43": "Auvergne-Rhône-Alpes",
    "44": "Pays de la Loire",
    "45": "Centre-Val de Loire",
    "46": "Occitanie",
    "47": "Nouvelle-Aquitaine",
    "48": "Occitanie",
    "49": "Pays de la Loire",
    "50": "Normandie",
    "51": "Grand Est",
    "52": "Grand Est",
    "53": "Pays de la Loire",
    "54": "Grand Est",
    "55": "Grand Est",
    "56": "Bretagne",
    "57": "Grand Est",
    "58": "Bourgogne-Franche-Comté",
    "59": "Hauts-de-France",
    "60": "Hauts-de-France",
    "61": "Normandie",
    "62": "Hauts-de-France",
    "63": "Auvergne-Rhône-Alpes",
    "64": "Nouvelle-Aquitaine",
    "65": "Occitanie",
    "66": "Occitanie",
    "67": "Grand Est",
    "68": "Grand Est",
    "69": "Auvergne-Rhône-Alpes",
    "70": "Bourgogne-Franche-Comté",
    "71": "Bourgogne-Franche-Comté",
    "72": "Pays de la Loire",
    "73": "Auvergne-Rhône-Alpes",
    "74": "Auvergne-Rhône-Alpes",
    "75": "Île-de-France",
    "76": "Normandie",
    "77": "Île-de-France",
    "78": "Île-de-France",
    "79": "Nouvelle-Aquitaine",
    "80": "Hauts-de-France",
    "81": "Occitanie",
    "82": "Occitanie",
    "83": "Provence-Alpes-Côte d'Azur",
    "84": "Provence-Alpes-Côte d'Azur",
    "85": "Pays de la Loire",
    "86": "Nouvelle-Aquitaine",
    "87": "Nouvelle-Aquitaine",
    "88": "Grand Est",
    "89": "Bourgogne-Franche-Comté",
    "90": "Bourgogne-Franche-Comté",
    "91": "Île-de-France",
    "92": "Île-de-France",
    "93": "Île-de-France",
    "94": "Île-de-France",
    "95": "Île-de-France",
    "971": "Guadeloupe",
    "972": "Martinique",
    "973": "Guyane",
    "974": "La Réunion",
    "976": "Mayotte"
}


def get_department_from_postal_code(postal_code):
    """Extrait le code département d'un code postal"""
    if not postal_code:
        return None
    
    postal_code = str(postal_code).strip()
    
    # Corse (2A, 2B)
    if postal_code.startswith("20"):
        if postal_code[:3] in ["200", "201"]:
            return "2A"  # Corse-du-Sud
        else:
            return "2B"  # Haute-Corse
    
    # DOM-TOM (codes à 3 chiffres)
    if postal_code.startswith("97") or postal_code.startswith("98"):
        return postal_code[:3]
    
    # France métropolitaine (2 premiers chiffres)
    return postal_code[:2]


def migrate_venues():
    """Migre les données géographiques des venues"""
    MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    DB_NAME = os.environ.get('DB_NAME', 'test_database')
    
    client = MongoClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Trouver tous les venues sans region ou department
    venues_to_update = db.venues.find({
        "$or": [
            {"region": None},
            {"region": {"$exists": False}},
            {"department": None},
            {"department": {"$exists": False}}
        ],
        "postal_code": {"$ne": None, "$exists": True}
    })
    
    updated_count = 0
    skipped_count = 0
    
    for venue in venues_to_update:
        postal_code = venue.get("postal_code")
        if not postal_code:
            skipped_count += 1
            continue
        
        # Extraire le département
        department = get_department_from_postal_code(postal_code)
        if not department:
            print(f"❌ Cannot determine department for venue {venue.get('name')} (postal: {postal_code})")
            skipped_count += 1
            continue
        
        # Trouver la région
        region = DEPT_TO_REGION.get(department)
        if not region:
            print(f"⚠️  Unknown department {department} for venue {venue.get('name')}")
            skipped_count += 1
            continue
        
        # Mettre à jour le venue
        result = db.venues.update_one(
            {"id": venue["id"]},
            {"$set": {
                "department": department,
                "region": region
            }}
        )
        
        if result.modified_count > 0:
            print(f"✅ Updated {venue.get('name')}: {venue.get('city')} ({postal_code}) -> {department} / {region}")
            updated_count += 1
    
    print(f"\n📊 Migration terminée:")
    print(f"   - {updated_count} venues mis à jour")
    print(f"   - {skipped_count} venues ignorés")
    
    # Vérification finale
    total_venues = db.venues.count_documents({})
    venues_with_region = db.venues.count_documents({"region": {"$ne": None, "$exists": True}})
    print(f"\n✨ Résultat final:")
    print(f"   - Total venues: {total_venues}")
    print(f"   - Venues avec région: {venues_with_region}")
    print(f"   - Couverture: {(venues_with_region/total_venues*100):.1f}%")


if __name__ == "__main__":
    print("🚀 Démarrage de la migration des données géographiques des venues...\n")
    migrate_venues()
