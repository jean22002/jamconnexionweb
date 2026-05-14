"""
Accounting router - Système de comptabilité pour les établissements
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request
from typing import List, Optional
from datetime import datetime, timezone
import os
import shutil
from uuid import uuid4

router = APIRouter()

# MongoDB - sera injecté par set_db()
db = None

def set_db(database):
    global db
    db = database

# Import utilities
from utils import get_current_user


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
    payment_method: Optional[str] = None,  # facture, guso, promotion, all
    payment_mode: Optional[str] = None,    # especes, cheque, virement, all
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
    
    # Filtre par mode de paiement
    if payment_mode and payment_mode != "all":
        match_filter["payment_mode"] = payment_mode
    
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


@router.get("/export-invoices.zip")
async def export_invoices_zip(
    request: Request,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    period: Optional[str] = None,       # "2025", "2025-03", "all" — alternative aux dates
    payment_method: Optional[str] = None,  # facture, guso, promotion
    payment_mode: Optional[str] = None,    # especes, cheque, virement
    event_type: Optional[str] = None,      # concert, jam, karaoke, spectacle
    current_user: dict = Depends(get_current_user),
):
    """
    Export ZIP de toutes les factures filtrées (alias de
    /api/venues/me/accounting/invoices/download avec une convention de noms
    de paramètres adaptée au mobile).
    
    Filtres :
      - period="2025" → toute l'année 2025
      - period="2025-03" → mars 2025
      - date_from/date_to → fenêtre personnalisée (prioritaire si fourni)
    """
    from routes.venues import download_venue_invoices_zip
    from datetime import datetime as _dt
    
    # Mapper period → year ou start_date/end_date
    year = None
    start_date = date_from
    end_date = date_to
    
    if period and not (date_from or date_to):
        if period == "all":
            pass  # On laisse tout passer (l'endpoint par défaut prendra year courant)
            # Pour ratisser large, on met dates très larges
            start_date = "2000-01-01"
            end_date = "2099-12-31"
        elif len(period) == 4 and period.isdigit():
            year = int(period)
        elif len(period) == 7 and period[4] == "-":
            try:
                y, m = period.split("-")
                y, m = int(y), int(m)
                # Dernier jour du mois
                from calendar import monthrange
                last_day = monthrange(y, m)[1]
                start_date = f"{y}-{m:02d}-01"
                end_date = f"{y}-{m:02d}-{last_day:02d}"
            except (ValueError, IndexError):
                raise HTTPException(status_code=400, detail="period invalide. Formats acceptés: YYYY, YYYY-MM, 'all'")
        else:
            raise HTTPException(status_code=400, detail="period invalide. Formats acceptés: YYYY, YYYY-MM, 'all'")
    
    if date_from and date_to:
        try:
            if _dt.fromisoformat(date_from) > _dt.fromisoformat(date_to):
                raise HTTPException(status_code=400, detail="date_from doit être <= date_to")
        except ValueError:
            raise HTTPException(status_code=400, detail="Format de date invalide (attendu YYYY-MM-DD)")
    
    return await download_venue_invoices_zip(
        request=request,
        year=year,
        event_type=event_type or "all",
        payment_status="all",
        payment_method=payment_method or "all",
        payment_mode=payment_mode or "all",
        start_date=start_date,
        end_date=end_date,
        current_user=current_user,
    )
