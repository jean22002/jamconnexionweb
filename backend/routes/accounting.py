"""
Accounting router - Système de comptabilité pour les établissements
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from typing import List, Optional
from datetime import datetime, timezone
import os
import shutil
from uuid import uuid4

router = APIRouter()

# MongoDB
from motor.motor_asyncio import AsyncIOMotorClient
MONGO_URL = os.environ.get('MONGO_URL')
DB_NAME = os.environ.get('DB_NAME', 'jamconnexion')
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# JWT
import jwt
JWT_SECRET = os.environ.get('JWT_SECRET', 'default_secret')
JWT_ALGORITHM = "HS256"

async def get_current_user(authorization: str = None):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization")
    try:
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except:
        raise HTTPException(status_code=401, detail="Invalid token")


@router.post("/upload-invoice")
async def upload_invoice(
    file: UploadFile = File(...),
    event_id: str = Form(...),
    event_type: str = Form(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload une facture pour un événement (PDF ou Image)"""
    
    # Vérifier que c'est un établissement
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venues can upload invoices")
    
    # Vérifier le type de fichier
    allowed_types = ["application/pdf", "image/jpeg", "image/png", "image/jpg"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Only PDF and images (JPG, PNG) are allowed")
    
    # Vérifier la taille (max 5 Mo)
    file_size = 0
    chunk_size = 1024 * 1024  # 1 Mo
    temp_file = await file.read()
    file_size = len(temp_file)
    
    if file_size > 5 * 1024 * 1024:  # 5 Mo
        raise HTTPException(status_code=400, detail="File too large (max 5 Mo)")
    
    # Générer un nom unique
    file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'pdf'
    unique_filename = f"{uuid4()}.{file_extension}"
    
    # Créer le dossier si nécessaire
    upload_dir = "/app/backend/uploads/invoices"
    os.makedirs(upload_dir, exist_ok=True)
    
    # Sauvegarder le fichier
    file_path = f"{upload_dir}/{unique_filename}"
    with open(file_path, "wb") as f:
        f.write(temp_file)
    
    # Chemin relatif pour stockage en DB
    relative_path = f"/api/uploads/invoices/{unique_filename}"
    
    # Mettre à jour l'événement
    collection_map = {
        "jam": "jams",
        "concert": "concerts",
        "karaoke": "karaoke",
        "spectacle": "spectacle"
    }
    
    collection_name = collection_map.get(event_type)
    if not collection_name:
        raise HTTPException(status_code=400, detail="Invalid event type")
    
    result = await db[collection_name].update_one(
        {"id": event_id},
        {"$set": {"invoice_file": relative_path, "invoice_uploaded_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    
    return {
        "message": "Invoice uploaded successfully",
        "file_path": relative_path,
        "filename": file.filename
    }


@router.get("/events")
async def get_accounting_events(
    payment_method: Optional[str] = None,  # facture, guso, all
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    payment_status: Optional[str] = None,  # paid, pending, cancelled, all
    current_user: dict = Depends(get_current_user)
):
    """Récupérer tous les événements pour la comptabilité avec filtres"""
    
    # Vérifier que c'est un établissement
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venues can access accounting")
    
    # Récupérer le venue_id
    venue = await db.venues.find_one({"user_id": current_user["id"]}, {"_id": 0, "id": 1})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue profile not found")
    
    venue_id = venue["id"]
    
    # Construire les filtres
    match_filter = {"venue_id": venue_id}
    
    # Filtre par date
    if start_date or end_date:
        date_filter = {}
        if start_date:
            date_filter["$gte"] = start_date
        if end_date:
            date_filter["$lte"] = end_date
        match_filter["date"] = date_filter
    
    # Filtre par méthode de paiement
    if payment_method and payment_method != "all":
        match_filter["payment_method"] = payment_method
    
    # Filtre par statut de paiement
    if payment_status and payment_status != "all":
        match_filter["payment_status"] = payment_status
    
    # Récupérer les événements de toutes les collections
    all_events = []
    
    # Jams
    jams = await db.jams.find(match_filter, {"_id": 0}).to_list(1000)
    for jam in jams:
        jam["event_type"] = "jam"
        jam["event_type_label"] = "Bœuf"
        all_events.append(jam)
    
    # Concerts
    concerts = await db.concerts.find(match_filter, {"_id": 0}).to_list(1000)
    for concert in concerts:
        concert["event_type"] = "concert"
        concert["event_type_label"] = "Concert"
        all_events.append(concert)
    
    # Karaoke
    karaokes = await db.karaoke.find(match_filter, {"_id": 0}).to_list(1000)
    for karaoke in karaokes:
        karaoke["event_type"] = "karaoke"
        karaoke["event_type_label"] = "Karaoké"
        all_events.append(karaoke)
    
    # Spectacles
    spectacles = await db.spectacle.find(match_filter, {"_id": 0}).to_list(1000)
    for spectacle in spectacles:
        spectacle["event_type"] = "spectacle"
        spectacle["event_type_label"] = "Spectacle"
        all_events.append(spectacle)
    
    # Enrichir avec les participants
    for event in all_events:
        participants = await db.event_participations.find({
            "event_id": event["id"],
            "active": True
        }, {"_id": 0}).to_list(100)
        
        event["participants"] = []
        for participant in participants:
            user = await db.users.find_one({"id": participant.get("user_id")}, {"_id": 0, "role": 1})
            if user and user["role"] == "musician":
                musician = await db.musicians.find_one(
                    {"user_id": participant.get("user_id")},
                    {"_id": 0, "pseudo": 1, "payment_methods": 1}
                )
                if musician:
                    event["participants"].append({
                        "name": musician.get("pseudo", "Musicien"),
                        "payment_methods": musician.get("payment_methods", [])
                    })
    
    # Trier par date
    all_events.sort(key=lambda x: x.get("date", ""), reverse=True)
    
    return {"events": all_events}


@router.put("/events/{event_id}/payment-status")
async def update_payment_status(
    event_id: str,
    event_type: str,
    payment_status: str,
    current_user: dict = Depends(get_current_user)
):
    """Mettre à jour le statut de paiement d'un événement"""
    
    if current_user["role"] != "venue":
        raise HTTPException(status_code=403, detail="Only venues can update payment status")
    
    if payment_status not in ["paid", "pending", "cancelled"]:
        raise HTTPException(status_code=400, detail="Invalid payment status")
    
    collection_map = {
        "jam": "jams",
        "concert": "concerts",
        "karaoke": "karaoke",
        "spectacle": "spectacle"
    }
    
    collection_name = collection_map.get(event_type)
    if not collection_name:
        raise HTTPException(status_code=400, detail="Invalid event type")
    
    result = await db[collection_name].update_one(
        {"id": event_id},
        {"$set": {"payment_status": payment_status, "payment_updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    
    return {"message": "Payment status updated", "payment_status": payment_status}
