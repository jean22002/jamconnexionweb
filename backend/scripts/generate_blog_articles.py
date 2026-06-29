"""
Script de génération automatique des articles de blog via Claude Sonnet.
Build 95.5 — Pour qualifier AdSense (contenu original substantiel).

Usage: cd /app/backend && python -m scripts.generate_blog_articles
"""
import asyncio
import os
import sys
import uuid
import re
from datetime import datetime, timezone, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from dotenv import load_dotenv
load_dotenv(ROOT / ".env")

from motor.motor_asyncio import AsyncIOMotorClient
from emergentintegrations.llm.chat import LlmChat, UserMessage

EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY")
MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]

# 7 articles ciblés pour AdSense (SEO musique + statut intermittent + jam sessions)
ARTICLES_SPEC = [
    {
        "title": "Comment organiser une jam session réussie : le guide complet",
        "slug": "comment-organiser-jam-session-reussie",
        "emoji": "🎷",
        "category": "Guides",
        "tags": ["jam", "organisation", "musiciens", "live"],
        "reading_minutes": 8,
        "prompt": "un guide complet (1200-1400 mots) pour organiser une jam session réussie : choix du lieu, communication avec le bar/salle, listing des musiciens, gestion de la backline, ordre de passage, horaires, animation, gestion sonore basique, ambiance, et erreurs classiques à éviter. Public : musiciens amateurs et semi-pros français.",
    },
    {
        "title": "Trouver des musiciens à Paris (et partout en France) : 7 méthodes éprouvées",
        "slug": "trouver-musiciens-paris-france",
        "emoji": "🎸",
        "category": "Conseils",
        "tags": ["musiciens", "recrutement", "groupe", "réseau"],
        "reading_minutes": 7,
        "prompt": "article pratique (1100-1300 mots) listant 7 méthodes pour trouver des musiciens à Paris et partout en France : Jam Connexion (mentionner mais sobrement), forums spécialisés, écoles de musique, conservatoires, bars à jams, réseaux sociaux, petites annonces. Pour chaque méthode : avantages, inconvénients, public touché, conseils concrets.",
    },
    {
        "title": "Statut intermittent du spectacle : tout comprendre en 2026",
        "slug": "statut-intermittent-spectacle-comprendre",
        "emoji": "📋",
        "category": "Statut",
        "tags": ["intermittent", "statut", "Pôle Emploi", "musiciens"],
        "reading_minutes": 9,
        "prompt": "article informatif et complet (1300-1500 mots) sur le statut d'intermittent du spectacle en 2026 : conditions (507h sur 12 mois), démarches, salaires, annexe 10, indemnisation, cachet vs heures, déclarations Pôle Emploi, points de vigilance, ressources officielles. Public musiciens débutants ou en transition.",
    },
    {
        "title": "GUSO : comment ça marche pour les musiciens en 2026",
        "slug": "guso-comment-ca-marche-musiciens",
        "emoji": "📄",
        "category": "Statut",
        "tags": ["GUSO", "cachet", "déclaration", "URSSAF"],
        "reading_minutes": 7,
        "prompt": "guide pratique (1000-1200 mots) sur le GUSO (Guichet Unique du Spectacle Occasionnel) : qui peut/doit l'utiliser (employeurs occasionnels, bars, mairies), différence avec l'intermittence classique, démarches employeur, fiche de paie, cotisations, plafond de spectacles annuels, avantages et limites. Ton accessible.",
    },
    {
        "title": "Cachet ou facture : quel statut choisir pour vos prestations musicales ?",
        "slug": "cachet-ou-facture-statut-musicien",
        "emoji": "💼",
        "category": "Statut",
        "tags": ["cachet", "facture", "autoentrepreneur", "fiscalité"],
        "reading_minutes": 8,
        "prompt": "comparaison détaillée (1100-1300 mots) entre payer un musicien au cachet (intermittent/GUSO) et en facture (auto-entrepreneur/SASU). Avantages, inconvénients, cas d'usage, fiscalité, droits sociaux, démarches. Tableau comparatif final. Public musiciens débutant à intermédiaire.",
    },
    {
        "title": "Premier concert payant : la check-list complète du musicien débutant",
        "slug": "premier-concert-payant-checklist-musicien",
        "emoji": "🎤",
        "category": "Guides",
        "tags": ["concert", "débutant", "set-list", "préparation"],
        "reading_minutes": 7,
        "prompt": "check-list pratique (1000-1200 mots) pour préparer son premier concert payant : balance, set-list, communication, contrat, cachet/facture, matériel, partenariat salle, public, gestion du stress, points administratifs, exemples concrets. Ton motivant et bienveillant.",
    },
    {
        "title": "5 erreurs à éviter quand on contacte une salle de concert",
        "slug": "5-erreurs-eviter-contacter-salle-concert",
        "emoji": "🎶",
        "category": "Conseils",
        "tags": ["démarchage", "salle", "booking", "professionnalisme"],
        "reading_minutes": 6,
        "prompt": "article ciblé (900-1100 mots) sur les 5 erreurs les plus courantes commises par les musiciens débutants quand ils démarchent une salle de concert : email générique, dossier vide, manque de preuves (vidéos), prix non négociable, suivi absent. Pour chaque erreur : pourquoi c'est un problème, comment l'éviter, exemple de bonne pratique.",
    },
]


def estimate_reading_minutes(content: str) -> int:
    words = len(content.split())
    return max(3, round(words / 200))


async def generate_article(spec: dict) -> dict:
    """Génère le contenu markdown d'un article via Claude Sonnet."""
    system_msg = (
        "Tu es un rédacteur SEO spécialisé dans la musique vivante française. "
        "Tu écris des articles informatifs, originaux, sans bourrage de mots-clés, "
        "en français impeccable, structurés avec des sous-titres markdown (## et ###), "
        "des listes à puces (-), du gras (**mot**), et un ton bienveillant et "
        "expert. Tu n'inventes pas de chiffres précis (URLs, lois, statistiques) "
        "que tu n'es pas certain à 100%. Tu privilégies les conseils actionnables. "
        "Tu ne mets PAS de titre h1 (# Titre) car il sera ajouté automatiquement. "
        "Tu commences directement par un paragraphe d'introduction (sans titre), "
        "puis tu enchaînes avec des ## sections claires."
    )

    user_text = (
        f"Rédige {spec['prompt']}\n\n"
        f"Contraintes :\n"
        f"- Format markdown\n"
        f"- Pas de # titre h1 (sera ajouté automatiquement)\n"
        f"- Sous-titres ## et ###\n"
        f"- Listes à puces avec -\n"
        f"- Gras avec **mot**\n"
        f"- Ton expert mais accessible, public musiciens français\n"
        f"- 100% original, pas de copié-collé\n"
        f"- Conclure par une courte synthèse (~3 lignes)"
    )

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"blog-gen-{spec['slug']}-{uuid.uuid4().hex[:6]}",
        system_message=system_msg,
    ).with_model("anthropic", "claude-sonnet-4-6")

    print(f"  → Generating: {spec['title']}")
    response = await chat.send_message(UserMessage(text=user_text))
    content = response.strip() if response else ""

    if not content or len(content) < 500:
        raise RuntimeError(f"Generated content too short for {spec['slug']}")

    # Extraire 1ʳᵉ phrase pour excerpt si pas fourni
    first_para = next((p.strip() for p in content.split("\n\n") if p.strip() and not p.startswith("#")), "")
    excerpt = re.sub(r"\s+", " ", first_para)[:200].rstrip()
    if len(first_para) > 200:
        excerpt = excerpt.rsplit(" ", 1)[0] + "…"

    now = datetime.now(timezone.utc)
    # Espacer les dates de publication pour avoir un blog "vivant"
    published_at = (now - timedelta(days=ARTICLES_SPEC.index(spec) * 4)).isoformat()

    return {
        "id": str(uuid.uuid4()),
        "slug": spec["slug"],
        "title": spec["title"],
        "excerpt": excerpt,
        "content": content,
        "cover_emoji": spec["emoji"],
        "category": spec["category"],
        "tags": spec["tags"],
        "author": "L'équipe Jam Connexion",
        "reading_minutes": estimate_reading_minutes(content),
        "published": True,
        "published_at": published_at,
        "updated_at": None,
        "views": 0,
    }


async def main():
    if not EMERGENT_LLM_KEY:
        print("❌ EMERGENT_LLM_KEY manquante dans backend/.env")
        return
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]

    print(f"🎯 Génération de {len(ARTICLES_SPEC)} articles via Claude Sonnet 4.6…\n")

    for spec in ARTICLES_SPEC:
        try:
            # Skip si déjà en base
            existing = await db.blog_articles.find_one({"slug": spec["slug"]})
            if existing:
                print(f"  ✓ Skip (déjà existant): {spec['slug']}")
                continue
            article = await generate_article(spec)
            await db.blog_articles.insert_one(article)
            print(f"  ✅ Inséré: {spec['slug']} ({len(article['content'])} chars)")
        except Exception as e:
            print(f"  ❌ Erreur pour {spec['slug']}: {e}")

    # Récap
    total = await db.blog_articles.count_documents({"published": True})
    print(f"\n📊 Total articles publiés en base : {total}")
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
