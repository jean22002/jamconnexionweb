"""
Blog article model — Build 95.5
Pour conformité AdSense et SEO. Articles publics accessibles sans login.
"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class BlogArticle(BaseModel):
    id: str  # uuid4
    slug: str  # url-friendly
    title: str
    excerpt: str  # résumé court (160 chars max pour meta description)
    content: str  # markdown
    cover_emoji: str = "🎵"
    category: str  # ex: "Guides", "Statut", "Conseils"
    tags: List[str] = []
    author: str = "L'équipe Jam Connexion"
    reading_minutes: int = 5
    published: bool = True
    published_at: str  # ISO datetime
    updated_at: Optional[str] = None
    views: int = 0


class BlogArticleListItem(BaseModel):
    """Version allégée pour la liste (sans le contenu complet)."""
    id: str
    slug: str
    title: str
    excerpt: str
    cover_emoji: str
    category: str
    tags: List[str]
    reading_minutes: int
    published_at: str
