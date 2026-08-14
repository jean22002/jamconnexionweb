"""
Backend tests for Build 152.14 — Pydantic extra='ignore' on:
- PlanningSlot (input)
- PlanningSlotResponse (response, no _id leak)
- ConcertApplication (input)
"""
import os
import pytest
import requests
from datetime import datetime, timedelta, timezone
from pymongo import MongoClient

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://collapsible-map.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

MUSICIAN_EMAIL = "test@gmail.com"
MUSICIAN_PWD = "test"
VENUE_EMAIL = "bar@gmail.com"
VENUE_PWD = "test"


@pytest.fixture(scope="session")
def db():
    mongo_url = os.environ.get("MONGO_URL")
    if not mongo_url:
        env_path = "/app/backend/.env"
        if os.path.exists(env_path):
            with open(env_path) as f:
                for line in f:
                    if line.startswith("MONGO_URL="):
                        mongo_url = line.split("=", 1)[1].strip().strip('"')
                        os.environ["MONGO_URL"] = mongo_url
                        break
    db_name = os.environ.get("DB_NAME", "test_database")
    return MongoClient(mongo_url)[db_name]


def _login(email, pwd):
    r = requests.post(f"{API}/auth/login", json={"email": email, "password": pwd}, timeout=30)
    assert r.status_code == 200, r.text
    j = r.json()
    return j["token"], j["user"]


@pytest.fixture(scope="session")
def venue_auth():
    token, user = _login(VENUE_EMAIL, VENUE_PWD)
    return {"token": token, "user": user, "headers": {"Authorization": f"Bearer {token}"}}


@pytest.fixture(scope="session")
def musician_auth():
    token, user = _login(MUSICIAN_EMAIL, MUSICIAN_PWD)
    return {"token": token, "user": user, "headers": {"Authorization": f"Bearer {token}"}}


@pytest.fixture(scope="session")
def musician_profile(db, musician_auth):
    return db.musicians.find_one({"user_id": musician_auth["user"]["id"]}, {"_id": 0})


_created_slot_ids = []
_created_app_ids = []


def _future_date(offset=800):
    return (datetime.now(timezone.utc) + timedelta(days=offset)).strftime("%Y-%m-%d")


class TestPlanningSlotNoLeak:
    """Build 152.14 — verify no _id leak + extra='ignore' behaviour."""

    def test_01_post_planning_no_id_leak(self, db, venue_auth):
        date = _future_date(801)
        db.planning_slots.delete_many({"date": date})
        payload = {
            "date": date,
            "time": "20:00",
            "title": "TEST_NoLeak",
            "music_styles": ["Rock"],
            "num_bands_needed": 1,
            "application_type": "bands",
            "is_open": True,
        }
        r = requests.post(f"{API}/planning", json=payload, headers=venue_auth["headers"], timeout=30)
        assert r.status_code == 200, r.text
        body = r.json()
        assert "_id" not in body, f"_id leaked in POST /planning response: {body}"
        assert "id" in body
        _created_slot_ids.append(body["id"])

    def test_02_get_venue_planning_no_id_leak(self, venue_auth, db):
        venue = db.venues.find_one({"user_id": venue_auth["user"]["id"]}, {"_id": 0})
        assert venue is not None
        r = requests.get(f"{API}/venues/{venue['id']}/planning", headers=venue_auth["headers"], timeout=30)
        assert r.status_code == 200, r.text
        slots = r.json()
        assert isinstance(slots, list)
        for s in slots:
            assert "_id" not in s, f"_id leaked in GET /venues/.../planning: {s}"

    def test_03_put_planning_no_id_leak(self, venue_auth, db):
        assert _created_slot_ids
        slot_id = _created_slot_ids[-1]
        existing = db.planning_slots.find_one({"id": slot_id}, {"_id": 0})
        assert existing is not None
        payload = {
            "date": existing["date"],
            "time": existing.get("time", "20:00"),
            "title": "TEST_NoLeak_Updated",
            "music_styles": existing.get("music_styles", ["Rock"]),
            "num_bands_needed": existing.get("num_bands_needed", 1),
            "application_type": existing.get("application_type", "bands"),
            "is_open": existing.get("is_open", True),
        }
        r = requests.put(f"{API}/planning/{slot_id}", json=payload, headers=venue_auth["headers"], timeout=30)
        if r.status_code == 405:
            r = requests.patch(f"{API}/planning/{slot_id}", json=payload, headers=venue_auth["headers"], timeout=30)
        assert r.status_code == 200, f"{r.status_code} {r.text}"
        body = r.json()
        assert "_id" not in body, f"_id leaked in PUT /planning/{{id}} response: {body}"
        assert body.get("title") == "TEST_NoLeak_Updated"

    def test_04_post_planning_ignores_unknown_field(self, db, venue_auth):
        date = _future_date(802)
        db.planning_slots.delete_many({"date": date})
        payload = {
            "date": date,
            "time": "21:00",
            "title": "TEST_UnknownField",
            "music_styles": ["Jazz"],
            "num_bands_needed": 1,
            "application_type": "bands",
            "is_open": True,
            "injected_field": "hacker_value",
            "another_evil": {"nested": "payload"},
        }
        r = requests.post(f"{API}/planning", json=payload, headers=venue_auth["headers"], timeout=30)
        assert r.status_code == 200, r.text
        body = r.json()
        _created_slot_ids.append(body["id"])
        assert "injected_field" not in body
        assert "another_evil" not in body
        # Verify DB does NOT persist unknown fields
        saved = db.planning_slots.find_one({"id": body["id"]})
        assert saved is not None
        assert "injected_field" not in saved, f"injected_field persisted in DB: {saved}"
        assert "another_evil" not in saved

    def test_05_post_application_ignores_unknown_field(self, db, venue_auth, musician_auth, musician_profile):
        # Create a fresh slot
        date = _future_date(803)
        db.planning_slots.delete_many({"date": date})
        slot_payload = {
            "date": date,
            "time": "20:00",
            "title": "TEST_AppUnknown",
            "music_styles": ["Rock"],
            "num_bands_needed": 1,
            "application_type": "bands",
            "is_open": True,
        }
        r = requests.post(f"{API}/planning", json=slot_payload, headers=venue_auth["headers"], timeout=30)
        assert r.status_code == 200
        slot_id = r.json()["id"]
        _created_slot_ids.append(slot_id)

        db.applications.delete_many({"planning_slot_id": slot_id, "musician_id": musician_profile["id"]})

        band_name = musician_profile.get("pseudo") or "Solo"
        payload = {
            "planning_slot_id": slot_id,
            "band_name": band_name,
            "band_type": "Solo",
            "message": "TEST unknown field",
            "hacker_field": "value",
            "evil_nested": {"foo": "bar"},
        }
        r = requests.post(f"{API}/applications", json=payload, headers=musician_auth["headers"], timeout=30)
        assert r.status_code in (200, 201), r.text
        body = r.json()
        assert "hacker_field" not in body
        assert "evil_nested" not in body
        assert "_id" not in body
        _created_app_ids.append(body["id"])

        saved = db.applications.find_one({"id": body["id"]})
        assert saved is not None
        assert "hacker_field" not in saved, f"hacker_field persisted: {saved}"
        assert "evil_nested" not in saved

    def test_06_planning_still_accepts_known_fields(self, db, venue_auth):
        """Regression: extra='ignore' must not break known fields like has_meals, meals_count etc."""
        date = _future_date(804)
        db.planning_slots.delete_many({"date": date})
        payload = {
            "date": date,
            "time": "22:00",
            "title": "TEST_KnownFields",
            "music_styles": ["Rock"],
            "num_bands_needed": 2,
            "application_type": "bands",
            "is_open": True,
            "has_catering": True,
            "catering_drinks": 4,
            "has_meals": True,
            "meals_count": 3,
            "has_accommodation": True,
            "accommodation_capacity": 2,
            "formation_type": "Trio",
            "max_musicians": 3,
            "is_guso": False,
        }
        r = requests.post(f"{API}/planning", json=payload, headers=venue_auth["headers"], timeout=30)
        assert r.status_code == 200, r.text
        body = r.json()
        _created_slot_ids.append(body["id"])
        assert body["has_catering"] is True
        assert body["catering_drinks"] == 4
        assert body["has_meals"] is True
        assert body["meals_count"] == 3
        assert body["formation_type"] == "Trio"
        assert body["max_musicians"] == 3
        assert "_id" not in body


@pytest.fixture(scope="session", autouse=True)
def _cleanup(db):
    yield
    try:
        if _created_app_ids:
            db.applications.delete_many({"id": {"$in": _created_app_ids}})
        if _created_slot_ids:
            db.planning_slots.delete_many({"id": {"$in": _created_slot_ids}})
    except Exception as e:
        print(f"cleanup error: {e}")
