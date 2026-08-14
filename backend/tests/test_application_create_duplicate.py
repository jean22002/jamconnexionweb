"""
Backend tests for POST /api/applications (Build 175 / 152.12).

Focus:
- Create application via `planning_slot_id` → 200
- Create application via new mobile Build 175 payload (concert_id + band fields) → 200
- Duplicate application → HTTP 409 with structured detail {message, code, existing_application_id}
- Missing slot_id → HTTP 422
- RBAC: venue POSTing /applications → HTTP 403
- Ensures backwards compatibility & no regression on cancellation flow (see test_cancellation_flow.py).
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


# ---------- Fixtures ----------

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
    assert r.status_code == 200, f"Login failed for {email}: {r.status_code} {r.text}"
    j = r.json()
    return j["token"], j["user"]


@pytest.fixture(scope="session")
def musician_auth():
    token, user = _login(MUSICIAN_EMAIL, MUSICIAN_PWD)
    return {"token": token, "user": user, "headers": {"Authorization": f"Bearer {token}"}}


@pytest.fixture(scope="session")
def venue_auth():
    token, user = _login(VENUE_EMAIL, VENUE_PWD)
    return {"token": token, "user": user, "headers": {"Authorization": f"Bearer {token}"}}


@pytest.fixture(scope="session")
def musician_profile(db, musician_auth):
    return db.musicians.find_one({"user_id": musician_auth["user"]["id"]}, {"_id": 0})


_created_slot_ids = []
_created_app_ids = []


def _future_date(offset_days=500):
    return (datetime.now(timezone.utc) + timedelta(days=offset_days)).strftime("%Y-%m-%d")


def _create_slot(db, venue_headers, date_str):
    # Cleanup any pre-existing slot on this date
    db.planning_slots.delete_many({"date": date_str})
    payload = {
        "date": date_str,
        "time": "20:00",
        "title": "TEST_CreateDuplicate",
        "music_styles": ["Rock"],
        "num_bands_needed": 1,
        "application_type": "bands",
        "is_open": True,
    }
    r = requests.post(f"{API}/planning", json=payload, headers=venue_headers, timeout=30)
    assert r.status_code == 200, f"Create slot failed: {r.status_code} {r.text}"
    slot = r.json()
    _created_slot_ids.append(slot["id"])
    return slot


# ---------- Tests ----------

class TestApplicationCreateDuplicate:

    def test_01_login_smoke(self, musician_auth, venue_auth):
        assert musician_auth["user"]["role"] == "musician"
        assert venue_auth["user"]["role"] == "venue"

    def test_02_create_with_planning_slot_id_ok(self, db, musician_auth, venue_auth, musician_profile):
        date = _future_date(501)
        slot = _create_slot(db, venue_auth["headers"], date)

        # Clean any prior application from this musician on this slot
        db.applications.delete_many({"planning_slot_id": slot["id"], "musician_id": musician_profile["id"]})

        band_name = musician_profile.get("pseudo") or "Solo"
        payload = {
            "planning_slot_id": slot["id"],
            "band_name": band_name,
            "band_type": "Solo",
            "message": "TEST create with planning_slot_id",
        }
        r = requests.post(f"{API}/applications", json=payload, headers=musician_auth["headers"], timeout=30)
        assert r.status_code in (200, 201), f"Expected 200/201, got {r.status_code}: {r.text}"
        body = r.json()
        assert body.get("planning_slot_id") == slot["id"]
        assert body.get("status") == "pending"
        assert body.get("id")
        _created_app_ids.append(body["id"])

        # Verify persistence
        saved = db.applications.find_one({"id": body["id"]})
        assert saved is not None
        assert saved["planning_slot_id"] == slot["id"]

    def test_03_duplicate_returns_409_structured(self, db, musician_auth, venue_auth, musician_profile):
        """Re-post SAME application → 409 with detail.code == APPLICATION_ALREADY_EXISTS."""
        # Reuse slot from test_02 by grabbing the last created
        assert _created_slot_ids, "Prerequisite test_02 must have created a slot"
        slot_id = _created_slot_ids[-1]

        existing = db.applications.find_one({
            "planning_slot_id": slot_id,
            "musician_id": musician_profile["id"],
        })
        assert existing is not None, "Prerequisite: an application must exist on this slot"
        existing_id = existing["id"]

        band_name = musician_profile.get("pseudo") or "Solo"
        payload = {
            "planning_slot_id": slot_id,
            "band_name": band_name,
            "band_type": "Solo",
            "message": "TEST duplicate",
        }
        r = requests.post(f"{API}/applications", json=payload, headers=musician_auth["headers"], timeout=30)
        assert r.status_code == 409, f"Expected 409, got {r.status_code}: {r.text}"
        detail = r.json().get("detail")
        assert isinstance(detail, dict), f"Expected structured detail dict, got {type(detail)}: {detail}"
        assert detail.get("code") == "APPLICATION_ALREADY_EXISTS"
        assert detail.get("existing_application_id") == existing_id
        assert "message" in detail

    def test_04_create_with_concert_id_mobile_build175_ok(self, db, musician_auth, venue_auth, musician_profile):
        """New mobile Build 175 payload: {concert_id, contact_email, band_id, band_name, band_type, members_count, message}"""
        date = _future_date(502)
        slot = _create_slot(db, venue_auth["headers"], date)

        # Clean
        db.applications.delete_many({"planning_slot_id": slot["id"], "musician_id": musician_profile["id"]})

        band_name = musician_profile.get("pseudo") or "Solo"
        payload = {
            "concert_id": slot["id"],  # legacy field name (mobile)
            "contact_email": MUSICIAN_EMAIL,
            "band_id": None,
            "band_name": band_name,
            "band_type": "Solo",
            "members_count": 1,
            "message": "TEST mobile Build 175 payload",
        }
        r = requests.post(f"{API}/applications", json=payload, headers=musician_auth["headers"], timeout=30)
        assert r.status_code in (200, 201), f"Expected 200/201, got {r.status_code}: {r.text}"
        body = r.json()
        assert body.get("planning_slot_id") == slot["id"], (
            f"Response must normalize to planning_slot_id, got: {body}"
        )
        # In DB: only planning_slot_id should be stored (concert_id popped)
        saved = db.applications.find_one({"id": body["id"]})
        assert saved is not None
        assert saved.get("planning_slot_id") == slot["id"]
        assert "concert_id" not in saved, "concert_id should be popped before insert"
        _created_app_ids.append(body["id"])

    def test_05_duplicate_via_concert_id_returns_409(self, db, musician_auth, musician_profile):
        """Re-post the mobile Build 175 payload → 409 structured."""
        slot_id = _created_slot_ids[-1]
        existing = db.applications.find_one({
            "planning_slot_id": slot_id,
            "musician_id": musician_profile["id"],
        })
        assert existing is not None
        existing_id = existing["id"]

        band_name = musician_profile.get("pseudo") or "Solo"
        payload = {
            "concert_id": slot_id,
            "contact_email": MUSICIAN_EMAIL,
            "band_name": band_name,
            "band_type": "Solo",
            "members_count": 1,
            "message": "TEST duplicate via concert_id",
        }
        r = requests.post(f"{API}/applications", json=payload, headers=musician_auth["headers"], timeout=30)
        assert r.status_code == 409, f"Expected 409, got {r.status_code}: {r.text}"
        detail = r.json().get("detail")
        assert isinstance(detail, dict)
        assert detail.get("code") == "APPLICATION_ALREADY_EXISTS"
        assert detail.get("existing_application_id") == existing_id

    def test_06_missing_slot_and_concert_returns_422(self, musician_auth, musician_profile):
        band_name = musician_profile.get("pseudo") or "Solo"
        payload = {
            "band_name": band_name,
            "band_type": "Solo",
            "message": "TEST no slot id",
        }
        r = requests.post(f"{API}/applications", json=payload, headers=musician_auth["headers"], timeout=30)
        assert r.status_code == 422, f"Expected 422, got {r.status_code}: {r.text}"
        text = r.text.lower()
        assert "missing" in text or "planning_slot_id" in text or "concert_id" in text

    def test_07_rbac_venue_cannot_post_application(self, db, venue_auth):
        # Venue tries to POST /applications → 403
        # Build a slot to have a valid target (though should not matter)
        date = _future_date(503)
        slot = _create_slot(db, venue_auth["headers"], date)
        payload = {
            "planning_slot_id": slot["id"],
            "band_name": "TEST_VenueTry",
            "band_type": "Solo",
            "message": "should be forbidden",
        }
        r = requests.post(f"{API}/applications", json=payload, headers=venue_auth["headers"], timeout=30)
        assert r.status_code == 403, f"Expected 403, got {r.status_code}: {r.text}"

    def test_08_cleanup(self, db):
        # Best-effort cleanup of TEST_ slots + associated applications
        if _created_slot_ids:
            db.applications.delete_many({"planning_slot_id": {"$in": _created_slot_ids}})
            db.planning_slots.delete_many({"id": {"$in": _created_slot_ids}})
