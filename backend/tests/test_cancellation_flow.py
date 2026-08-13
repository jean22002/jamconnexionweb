"""
Backend tests for the cancellation validation flow (Build 152.6).

Endpoints covered:
- POST /api/applications/{id}/cancel
- POST /api/applications/{id}/cancellation/validate
- GET  /api/applications/received/cancellation-requests
"""
import os
import uuid
import time
import pytest
import requests
from datetime import datetime, timedelta, timezone
from pymongo import MongoClient

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://collapsible-map.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME", "test_database")

MUSICIAN_EMAIL = "test@gmail.com"
MUSICIAN_PWD = "test"
VENUE_EMAIL = "bar@gmail.com"
VENUE_PWD = "test"


# ---------- Fixtures ----------

@pytest.fixture(scope="session")
def db():
    if not MONGO_URL:
        # Try to read from backend/.env
        env_path = "/app/backend/.env"
        if os.path.exists(env_path):
            with open(env_path) as f:
                for line in f:
                    if line.startswith("MONGO_URL="):
                        url = line.split("=", 1)[1].strip().strip('"')
                        os.environ["MONGO_URL"] = url
                        break
    client = MongoClient(os.environ["MONGO_URL"])
    return client[DB_NAME]


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


@pytest.fixture(scope="session")
def venue_profile(db, venue_auth):
    return db.venues.find_one({"user_id": venue_auth["user"]["id"]}, {"_id": 0})


# Track created slot IDs so we can cleanup at the end
_created_slot_ids = []
_created_app_ids = []


def _create_slot(venue_headers, date_str, num_bands_needed=1):
    payload = {
        "date": date_str,
        "time": "20:00",
        "title": "TEST_CancelFlow",
        "music_styles": ["Rock"],
        "num_bands_needed": num_bands_needed,
        "application_type": "bands",
        "is_open": True,
    }
    r = requests.post(f"{API}/planning", json=payload, headers=venue_headers, timeout=30)
    assert r.status_code == 200, f"Create slot failed: {r.status_code} {r.text}"
    slot = r.json()
    _created_slot_ids.append(slot["id"])
    return slot


def _apply(musician_headers, slot_id):
    r = requests.post(f"{API}/planning/{slot_id}/apply", headers=musician_headers, timeout=30)
    assert r.status_code == 200, f"Apply failed: {r.status_code} {r.text}"
    app_id = r.json()["application_id"]
    _created_app_ids.append(app_id)
    return app_id


def _accept(venue_headers, app_id):
    r = requests.post(f"{API}/applications/{app_id}/accept", headers=venue_headers, timeout=30)
    assert r.status_code == 200, f"Accept failed: {r.status_code} {r.text}"
    return r.json()


def _unique_date(offset_days):
    """Generate a unique-ish future date offset by days."""
    # Use ~2 years in the future + random microsecond offset in days to avoid clashes
    base = datetime.now(timezone.utc) + timedelta(days=400 + offset_days)
    return base.strftime("%Y-%m-%d")


# ---------- Tests ----------

class TestCancellationFlow:

    def test_01_login_smoke(self, musician_auth, venue_auth):
        assert musician_auth["user"]["role"] == "musician"
        assert venue_auth["user"]["role"] == "venue"

    def test_02_cancel_pending_deletes_immediately(self, db, musician_auth, venue_auth):
        date = _unique_date(1)
        # cleanup any existing slot for that date
        db.planning_slots.delete_many({"date": date})
        slot = _create_slot(venue_auth["headers"], date)
        app_id = _apply(musician_auth["headers"], slot["id"])

        r = requests.post(f"{API}/applications/{app_id}/cancel",
                          json={}, headers=musician_auth["headers"], timeout=30)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body.get("success") is True
        assert body.get("action") == "deleted"

        # Verify persistence: application removed
        gone = db.applications.find_one({"id": app_id})
        assert gone is None, "Application should be deleted from DB"

    def test_03_cancel_accepted_marks_requested(self, db, musician_auth, venue_auth, musician_profile):
        date = _unique_date(2)
        db.planning_slots.delete_many({"date": date})
        slot = _create_slot(venue_auth["headers"], date, num_bands_needed=1)
        app_id = _apply(musician_auth["headers"], slot["id"])
        _accept(venue_auth["headers"], app_id)

        # Verify slot is now closed
        s = db.planning_slots.find_one({"id": slot["id"]})
        assert s["is_open"] is False

        r = requests.post(f"{API}/applications/{app_id}/cancel",
                          json={"reason": "Empêchement"},
                          headers=musician_auth["headers"], timeout=30)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["success"] is True
        assert body["action"] == "cancellation_requested"

        # DB checks
        app_doc = db.applications.find_one({"id": app_id})
        assert app_doc["status"] == "accepted", "status should remain accepted"
        assert app_doc["cancellation_status"] == "requested"
        assert app_doc.get("cancellation_reason") == "Empêchement"
        assert "cancellation_requested_at" in app_doc
        # ISO parse
        datetime.fromisoformat(app_doc["cancellation_requested_at"])

        # Store for reuse in later tests
        pytest.shared_accepted_app_id = app_id
        pytest.shared_accepted_slot_id = slot["id"]

    def test_03b_get_applications_my_exposes_cancellation_fields(self, musician_auth):
        app_id = pytest.shared_accepted_app_id
        r = requests.get(f"{API}/applications/my", headers=musician_auth["headers"], timeout=30)
        assert r.status_code == 200, r.text
        apps = r.json()
        assert isinstance(apps, list)
        target = next((a for a in apps if a["id"] == app_id), None)
        assert target is not None, "cancelled-requested app not returned by /applications/my"
        assert target.get("cancellation_status") == "requested"
        assert target.get("cancellation_reason") == "Empêchement"
        assert target.get("cancellation_requested_at") is not None

    def test_04_cancel_already_requested_returns_400(self, musician_auth):
        app_id = getattr(pytest, "shared_accepted_app_id", None)
        assert app_id is not None
        r = requests.post(f"{API}/applications/{app_id}/cancel",
                          json={}, headers=musician_auth["headers"], timeout=30)
        assert r.status_code == 400, r.text
        detail = r.json().get("detail", "")
        assert "attente" in detail.lower() or "déjà" in detail.lower()

    def test_05_cancel_other_musician_forbidden(self, db, musician_auth, venue_auth):
        """Insert a fake application belonging to another musician and try to cancel it."""
        date = _unique_date(3)
        db.planning_slots.delete_many({"date": date})
        slot = _create_slot(venue_auth["headers"], date)

        fake_app_id = f"TEST_fake_{uuid.uuid4()}"
        db.applications.insert_one({
            "id": fake_app_id,
            "planning_slot_id": slot["id"],
            "musician_id": "TEST_other_musician_id_xyz",
            "musician_name": "Other Musician",
            "band_name": "Other Band",
            "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        _created_app_ids.append(fake_app_id)

        r = requests.post(f"{API}/applications/{fake_app_id}/cancel",
                          json={}, headers=musician_auth["headers"], timeout=30)
        assert r.status_code == 403, r.text

    def test_06_venue_cannot_cancel(self, venue_auth):
        # Fake app id — role check happens BEFORE lookup
        r = requests.post(f"{API}/applications/anything/cancel",
                          json={}, headers=venue_auth["headers"], timeout=30)
        assert r.status_code == 403, r.text

    def test_07_venue_lists_pending_cancellations(self, venue_auth):
        r = requests.get(f"{API}/applications/received/cancellation-requests",
                         headers=venue_auth["headers"], timeout=30)
        assert r.status_code == 200, r.text
        body = r.json()
        assert "applications" in body
        assert "count" in body
        assert body["count"] >= 1
        # our accepted app should be there
        ids = [a["id"] for a in body["applications"]]
        assert getattr(pytest, "shared_accepted_app_id") in ids
        # enrichment
        found = next(a for a in body["applications"] if a["id"] == pytest.shared_accepted_app_id)
        assert "slot_date" in found and found["slot_date"] is not None
        assert "musician_pseudo" in found

    def test_08_musician_cannot_list_cancellations(self, musician_auth):
        r = requests.get(f"{API}/applications/received/cancellation-requests",
                         headers=musician_auth["headers"], timeout=30)
        assert r.status_code == 403

    def test_09_musician_cannot_validate(self, musician_auth):
        app_id = pytest.shared_accepted_app_id
        r = requests.post(f"{API}/applications/{app_id}/cancellation/validate",
                          json={"approve": True}, headers=musician_auth["headers"], timeout=30)
        assert r.status_code == 403

    def test_10_venue_approve_cancellation(self, db, venue_auth, musician_auth, venue_profile):
        app_id = pytest.shared_accepted_app_id
        slot_id = pytest.shared_accepted_slot_id

        r = requests.post(f"{API}/applications/{app_id}/cancellation/validate",
                          json={"approve": True, "message": "Pas de souci, à bientôt !"},
                          headers=venue_auth["headers"], timeout=30)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["success"] is True
        assert body["action"] == "approved"

        # DB checks
        app_doc = db.applications.find_one({"id": app_id})
        assert app_doc["status"] == "cancelled"
        assert app_doc["cancellation_status"] == "approved"
        assert app_doc.get("cancellation_message") == "Pas de souci, à bientôt !"
        assert "cancellation_resolved_at" in app_doc
        datetime.fromisoformat(app_doc["cancellation_resolved_at"])

        # Slot should be reopened
        slot = db.planning_slots.find_one({"id": slot_id})
        assert slot["is_open"] is True, "Slot should have been reopened"

        # Notification 'cancellation_approved' should exist for musician
        musician = db.musicians.find_one({"user_id": musician_auth["user"]["id"]})
        notif = db.notifications.find_one({
            "user_id": musician_auth["user"]["id"],
            "type": "cancellation_approved",
        })
        assert notif is not None, "Missing cancellation_approved notification"

    def test_11_venue_refuse_cancellation(self, db, musician_auth, venue_auth):
        # Setup: new slot, new application, accept it, request cancel, then refuse
        date = _unique_date(4)
        db.planning_slots.delete_many({"date": date})
        slot = _create_slot(venue_auth["headers"], date, num_bands_needed=1)
        app_id = _apply(musician_auth["headers"], slot["id"])
        _accept(venue_auth["headers"], app_id)

        r = requests.post(f"{API}/applications/{app_id}/cancel",
                          json={"reason": "Test refuse"},
                          headers=musician_auth["headers"], timeout=30)
        assert r.status_code == 200

        # Refuse
        r = requests.post(f"{API}/applications/{app_id}/cancellation/validate",
                          json={"approve": False, "message": "Non désolé"},
                          headers=venue_auth["headers"], timeout=30)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["action"] == "refused"

        app_doc = db.applications.find_one({"id": app_id})
        assert app_doc["status"] == "accepted", "status should stay accepted on refuse"
        assert app_doc["cancellation_status"] == "refused"
        assert app_doc.get("cancellation_message") == "Non désolé"

        # Notification 'cancellation_refused' should exist
        notif = db.notifications.find_one({
            "user_id": musician_auth["user"]["id"],
            "type": "cancellation_refused",
        })
        assert notif is not None, "Missing cancellation_refused notification"

    def test_12_validate_no_pending_request_400(self, db, musician_auth, venue_auth):
        """Validate on an accepted app that has NO cancellation_status='requested' → 400."""
        date = _unique_date(5)
        db.planning_slots.delete_many({"date": date})
        slot = _create_slot(venue_auth["headers"], date)
        app_id = _apply(musician_auth["headers"], slot["id"])
        _accept(venue_auth["headers"], app_id)

        r = requests.post(f"{API}/applications/{app_id}/cancellation/validate",
                          json={"approve": True}, headers=venue_auth["headers"], timeout=30)
        assert r.status_code == 400, r.text

    def test_13_venue_b_cannot_validate_venue_a_app(self, db, venue_auth):
        """Insert a fake app on a slot owned by a fake venue → real venue gets 403."""
        fake_venue_id = f"TEST_fake_venue_{uuid.uuid4()}"
        fake_slot_id = f"TEST_fake_slot_{uuid.uuid4()}"
        fake_app_id = f"TEST_fake_app_{uuid.uuid4()}"
        db.planning_slots.insert_one({
            "id": fake_slot_id,
            "venue_id": fake_venue_id,
            "date": _unique_date(999),
            "is_open": True,
            "num_bands_needed": 1,
        })
        db.applications.insert_one({
            "id": fake_app_id,
            "planning_slot_id": fake_slot_id,
            "musician_id": "TEST_x",
            "status": "accepted",
            "cancellation_status": "requested",
            "cancellation_requested_at": datetime.now(timezone.utc).isoformat(),
        })
        _created_app_ids.append(fake_app_id)
        _created_slot_ids.append(fake_slot_id)

        r = requests.post(f"{API}/applications/{fake_app_id}/cancellation/validate",
                          json={"approve": True}, headers=venue_auth["headers"], timeout=30)
        assert r.status_code == 403, r.text

    def test_14_cancellation_requested_notification_exists(self, db, venue_auth):
        """When a musician requests cancellation, venue receives 'cancellation_requested' notif."""
        # tests 03 and 11 both trigger this
        notif = db.notifications.find_one({
            "user_id": venue_auth["user"]["id"],
            "type": "cancellation_requested",
        })
        assert notif is not None, "Missing cancellation_requested notification for venue"


# ---------- Cleanup ----------

@pytest.fixture(scope="session", autouse=True)
def _cleanup(db):
    yield
    try:
        if _created_app_ids:
            db.applications.delete_many({"id": {"$in": _created_app_ids}})
        if _created_slot_ids:
            db.planning_slots.delete_many({"id": {"$in": _created_slot_ids}})
        # Remove any concerts created from accept
        db.concerts.delete_many({"planning_slot_id": {"$in": _created_slot_ids}})
    except Exception as e:
        print(f"cleanup error: {e}")
