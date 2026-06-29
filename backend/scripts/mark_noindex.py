"""Marque Bordeaux + Toulouse en noindex pour réduire le risque doorway abuse Google."""
import asyncio, os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    db = AsyncIOMotorClient(os.environ['MONGO_URL'])[os.environ['DB_NAME']]
    res = await db.blog_articles.update_many(
        {'slug': {'$in': ['bordeaux-guide-musicien-live', 'toulouse-integrer-scene-musicale']}},
        {'$set': {'noindex': True}}
    )
    print(f'Articles marqués noindex: {res.modified_count}')

asyncio.run(main())
