"""Test E2E plateaux : chat groupe + notif links + candidature plateau."""
import asyncio, os, json, uuid
import httpx
import bcrypt
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv("/app/backend/.env")
load_dotenv("/app/frontend/.env")

API = os.environ["REACT_APP_BACKEND_URL"] + "/api"

async def login(email, pwd):
    async with httpx.AsyncClient(timeout=20) as cl:
        r = await cl.post(f"{API}/auth/login", json={"email": email, "password": pwd})
        d = r.json()
        return d.get("token") or d.get("access_token")

async def main():
    c = AsyncIOMotorClient(os.environ["MONGO_URL"])[os.environ["DB_NAME"]]
    await c.plateaus.delete_many({"title": {"$regex": "^Test"}})
    await c.conversations.delete_many({"type": "plateau_group"})

    # Admin
    tok1 = await login("test@gmail.com", "test")
    print("  admin tok ok:", bool(tok1))

    # Trouve un 2e musicien et reset son mdp
    other = await c.musicians.find_one({"user_id": {"$ne": "6185ef48-e65e-42da-a05c-fcc590c076f3"}})
    other_user = await c.users.find_one({"id": other["user_id"]})
    pwd = bcrypt.hashpw(b"test123", bcrypt.gensalt()).decode()
    await c.users.update_one({"id": other["user_id"]}, {"$set": {"password": pwd}})
    tok2 = await login(other_user["email"], "test123")
    print(f"  other ({other_user['email']}) tok ok:", bool(tok2))

    async with httpx.AsyncClient(timeout=20) as cl:
        H1 = {"Authorization": f"Bearer {tok1}"}
        H2 = {"Authorization": f"Bearer {tok2}"}

        # 1. Create plateau (max=2 → admin + 1 autre)
        r = await cl.post(f"{API}/plateaus", headers=H1, json={
            "title": "Test Candidature E2E",
            "description": "",
            "max_members": 2,
            "invited_members": [{"musician_id": other["id"], "project_kind": "solo"}],
        })
        p = r.json()
        pid = p["id"]
        print(f"  1️⃣  created plateau {pid[:8]}... status={p['status']} members={len(p['members'])}")

        # 2. Other accepte
        r = await cl.post(f"{API}/plateaus/{pid}/respond", headers=H2, json={"accept": True})
        print(f"  2️⃣  respond: {r.json()}")

        # 3. Conv créée ?
        conv = await c.conversations.find_one({"plateau_id": pid})
        print(f"  3️⃣  conversation groupe créée: {bool(conv)} type={conv['type'] if conv else None} participants={len(conv['participants']) if conv else 0}")

        # 4. Candidature plateau à un slot ouvert
        r = await cl.get(f"{API}/planning", headers=H1)
        slots = r.json()
        slot_id = slots[0]["id"] if slots else None
        print(f"  4️⃣  slot cible: {slot_id[:8] if slot_id else None}...")
        if slot_id:
            r = await cl.post(f"{API}/applications", headers=H1, json={
                "planning_slot_id": slot_id, "plateau_id": pid,
            })
            d = r.json()
            print(f"      app_id={d.get('id')} band_type={d.get('band_type')} plateau_title={d.get('plateau_title')} members={len(d.get('plateau_members',[]))}")

            # 5. 409 dup
            r2 = await cl.post(f"{API}/applications", headers=H1, json={
                "planning_slot_id": slot_id, "plateau_id": pid,
            })
            print(f"  5️⃣  duplicate HTTP={r2.status_code} (attendu 409)")

        # 6. Notifs link
        print("  6️⃣  notifs plateau avec link :")
        async for n in c.notifications.find({"type": {"$regex": "^plateau_"}, "link": {"$ne": None}}, {"_id":0,"type":1,"link":1}).sort("created_at",-1).limit(5):
            print(f"       {n['type']} → {n['link']}")

        # Cleanup
        await cl.delete(f"{API}/plateaus/{pid}", headers=H1)
        if slot_id:
            await c.applications.delete_many({"plateau_id": pid})
        print("  🧹 cleanup done")

asyncio.run(main())
