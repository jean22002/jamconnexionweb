"""
Routes Blog publiques — Build 95.5
GET /api/blog → liste des articles publiés
GET /api/blog/{slug} → article complet (incrémente views)

Aucune authentification requise. Indexées pour SEO + AdSense.
"""
from fastapi import APIRouter, HTTPException
from typing import List
import os
from motor.motor_asyncio import AsyncIOMotorClient

router = APIRouter(prefix="/blog", tags=["Blog"])

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]


def _strip_mongo(doc: dict) -> dict:
    if doc and "_id" in doc:
        doc.pop("_id", None)
    return doc


@router.get("")
async def list_articles():
    """Liste publique des articles, du plus récent au plus ancien."""
    cursor = db.blog_articles.find(
        {"published": True},
        {
            "content": 0,  # ne pas renvoyer le contenu complet en liste
            "_id": 0,
        },
    ).sort("published_at", -1)
    articles = await cursor.to_list(length=100)
    return {"articles": articles, "total": len(articles)}


@router.get("/{slug}")
async def get_article(slug: str):
    """Récupère un article par son slug + incrémente le compteur de vues."""
    article = await db.blog_articles.find_one({"slug": slug, "published": True})
    if not article:
        raise HTTPException(status_code=404, detail="Article introuvable")
    # Incrément vues (best effort, on ne bloque pas)
    try:
        await db.blog_articles.update_one({"slug": slug}, {"$inc": {"views": 1}})
    except Exception:
        pass
    return _strip_mongo(article)
