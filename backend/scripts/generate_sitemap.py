"""
Génère sitemap.xml + robots.txt STATIQUES dans frontend/public/
À relancer après chaque ajout/suppression d'article de blog.

Usage: cd /app/backend && python -m scripts.generate_sitemap
"""
import asyncio
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from dotenv import load_dotenv
load_dotenv(ROOT / ".env")

from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
PUBLIC_BASE_URL = os.environ.get("PUBLIC_BASE_URL", "https://jamconnexion.com")
PUBLIC_DIR = Path("/app/frontend/public")

STATIC_PAGES = [
    ("/", "1.0", "weekly"),
    ("/pricing", "0.8", "monthly"),
    ("/tarifs", "0.8", "monthly"),
    ("/faq", "0.7", "monthly"),
    ("/blog", "0.9", "daily"),
    ("/a-propos", "0.6", "monthly"),
    ("/cgu", "0.4", "yearly"),
    ("/cgv", "0.4", "yearly"),
    ("/cookies", "0.5", "yearly"),
    ("/auth", "0.6", "monthly"),
]


async def main():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]

    urls = []
    for path, priority, changefreq in STATIC_PAGES:
        urls.append(
            f"  <url>\n"
            f"    <loc>{PUBLIC_BASE_URL}{path}</loc>\n"
            f"    <changefreq>{changefreq}</changefreq>\n"
            f"    <priority>{priority}</priority>\n"
            f"  </url>"
        )

    cursor = db.blog_articles.find(
        {"published": True, "$or": [{"noindex": {"$exists": False}}, {"noindex": False}]},
        {"slug": 1, "published_at": 1, "updated_at": 1, "_id": 0},
    ).sort("published_at", -1)
    articles = await cursor.to_list(length=1000)
    for art in articles:
        lastmod = (art.get("updated_at") or art.get("published_at") or "")[:10]
        urls.append(
            f"  <url>\n"
            f"    <loc>{PUBLIC_BASE_URL}/blog/{art['slug']}</loc>\n"
            + (f"    <lastmod>{lastmod}</lastmod>\n" if lastmod else "")
            + f"    <changefreq>monthly</changefreq>\n"
            f"    <priority>0.7</priority>\n"
            f"  </url>"
        )

    sitemap_xml = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "\n".join(urls)
        + "\n</urlset>\n"
    )

    robots_txt = (
        "User-agent: *\n"
        "Allow: /\n"
        "Disallow: /musician\n"
        "Disallow: /melomane\n"
        "Disallow: /venue\n"
        f"\nSitemap: {PUBLIC_BASE_URL}/sitemap.xml\n"
    )

    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)
    (PUBLIC_DIR / "sitemap.xml").write_text(sitemap_xml, encoding="utf-8")
    (PUBLIC_DIR / "robots.txt").write_text(robots_txt, encoding="utf-8")

    print(f"✅ Écrit /app/frontend/public/sitemap.xml ({len(urls)} URLs)")
    print(f"✅ Écrit /app/frontend/public/robots.txt")
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
