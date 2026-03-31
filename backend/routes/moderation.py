"""
Routes pour la gestion de la modération automatique
Permet aux établissements et admins de groupes de configurer les délais de modération
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime, timezone
import os
from motor.motor_asyncio import AsyncIOMotorClient

from utils.auth import get_current_user

router = APIRouter(prefix="/moderation", tags=["moderation"])

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL')
client = AsyncIOMotorClient(MONGO_URL)
db = client[os.environ.get('DB_NAME', 'jam_connexion')]

# Modèles Pydantic
class ModerationSettings(BaseModel):
    """Configuration des seuils de modération"""
    entity_type: Literal["venue", "band"]  # Type d'entité (établissement ou groupe)
    entity_id: str  # ID de l'établissement ou du groupe
    
    # Délais de modération (en heures)
    auto_approve_delay: Optional[int] = Field(default=24, description="Délai d'approbation automatique des contenus (heures)")
    auto_reject_delay: Optional[int] = Field(default=72, description="Délai de rejet automatique des contenus non modérés (heures)")
    review_required_delay: Optional[int] = Field(default=12, description="Délai avant revue obligatoire (heures)")
    
    # Paramètres additionnels
    require_manual_review: bool = Field(default=False, description="Toujours exiger une revue manuelle")
    enabled: bool = Field(default=True, description="Système de modération activé")
    
    # Métadonnées
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    created_by: Optional[str] = None


class ModerationSettingsUpdate(BaseModel):
    """Modèle pour la mise à jour des paramètres"""
    auto_approve_delay: Optional[int] = None
    auto_reject_delay: Optional[int] = None
    review_required_delay: Optional[int] = None
    require_manual_review: Optional[bool] = None
    enabled: Optional[bool] = None


# Routes

@router.get("/settings/{entity_type}/{entity_id}")
async def get_moderation_settings(
    entity_type: Literal["venue", "band"],
    entity_id: str,
    user: dict = Depends(get_current_user)
):
    """Récupère les paramètres de modération d'une entité"""
    
    # Vérifier les permissions
    if entity_type == "venue":
        venue = await db.venues.find_one({"id": entity_id}, {"_id": 0})
        if not venue or venue.get("user_id") != user["id"]:
            raise HTTPException(status_code=403, detail="Non autorisé")
    
    elif entity_type == "band":
        band = await db.bands.find_one({"id": entity_id}, {"_id": 0})
        if not band or band.get("admin_id") != user["id"]:
            raise HTTPException(status_code=403, detail="Non autorisé - Vous devez être admin du groupe")
    
    # Récupérer ou créer les paramètres par défaut
    settings = await db.moderation_settings.find_one(
        {"entity_type": entity_type, "entity_id": entity_id},
        {"_id": 0}
    )
    
    if not settings:
        # Créer les paramètres par défaut
        default_settings = {
            "entity_type": entity_type,
            "entity_id": entity_id,
            "auto_approve_delay": 24,
            "auto_reject_delay": 72,
            "review_required_delay": 12,
            "require_manual_review": False,
            "enabled": True,
            "created_at": datetime.now(timezone.utc),
            "created_by": user["id"]
        }
        await db.moderation_settings.insert_one(default_settings)
        return {**default_settings, "_id": None}
    
    return settings


@router.put("/settings/{entity_type}/{entity_id}")
async def update_moderation_settings(
    entity_type: Literal["venue", "band"],
    entity_id: str,
    settings_update: ModerationSettingsUpdate,
    user: dict = Depends(get_current_user)
):
    """Met à jour les paramètres de modération"""
    
    # Vérifier les permissions
    if entity_type == "venue":
        venue = await db.venues.find_one({"id": entity_id}, {"_id": 0})
        if not venue or venue.get("user_id") != user["id"]:
            raise HTTPException(status_code=403, detail="Non autorisé")
    
    elif entity_type == "band":
        band = await db.bands.find_one({"id": entity_id}, {"_id": 0})
        if not band or band.get("admin_id") != user["id"]:
            raise HTTPException(status_code=403, detail="Non autorisé - Vous devez être admin du groupe")
    
    # Préparer les données de mise à jour (seulement les champs non-null)
    update_data = {k: v for k, v in settings_update.dict().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="Aucune donnée à mettre à jour")
    
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    # Mettre à jour ou créer
    await db.moderation_settings.update_one(
        {"entity_type": entity_type, "entity_id": entity_id},
        {"$set": update_data},
        upsert=True
    )
    
    # Récupérer les paramètres mis à jour
    updated_settings = await db.moderation_settings.find_one(
        {"entity_type": entity_type, "entity_id": entity_id},
        {"_id": 0}
    )
    
    return {
        "success": True,
        "message": "Paramètres de modération mis à jour",
        "settings": updated_settings
    }


@router.post("/settings/{entity_type}/{entity_id}/reset")
async def reset_moderation_settings(
    entity_type: Literal["venue", "band"],
    entity_id: str,
    user: dict = Depends(get_current_user)
):
    """Réinitialise les paramètres de modération aux valeurs par défaut"""
    
    # Vérifier les permissions
    if entity_type == "venue":
        venue = await db.venues.find_one({"id": entity_id}, {"_id": 0})
        if not venue or venue.get("user_id") != user["id"]:
            raise HTTPException(status_code=403, detail="Non autorisé")
    
    elif entity_type == "band":
        band = await db.bands.find_one({"id": entity_id}, {"_id": 0})
        if not band or band.get("admin_id") != user["id"]:
            raise HTTPException(status_code=403, detail="Non autorisé")
    
    # Supprimer les paramètres existants
    await db.moderation_settings.delete_one(
        {"entity_type": entity_type, "entity_id": entity_id}
    )
    
    return {
        "success": True,
        "message": "Paramètres réinitialisés aux valeurs par défaut"
    }
