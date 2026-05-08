"""
Health monitoring daemon and API.

Pings critical API endpoints every 5 minutes and sends an email alert via
Resend when an endpoint goes DOWN, plus a recovery email when it goes back UP.
Anti-spam: only one alert email per state transition (no repeated alerts).

Exposes:
    GET /api/health/detailed  → real-time status of all monitored endpoints

Environment:
    HEALTH_ALERT_EMAIL  default: bugjamconnexion@gmail.com
    HEALTH_BACKEND_URL  default: http://localhost:8001 (internal pings)
"""
from fastapi import APIRouter
from datetime import datetime, timezone
import asyncio
import os
import logging
import httpx

from utils.email import send_email

router = APIRouter()
logger = logging.getLogger(__name__)

ALERT_EMAIL = os.environ.get("HEALTH_ALERT_EMAIL", "bugjamconnexion@gmail.com")
INTERNAL_BACKEND_URL = os.environ.get("HEALTH_BACKEND_URL", "http://localhost:8001")
CHECK_INTERVAL_SECONDS = 300  # 5 minutes
REQUEST_TIMEOUT = 10.0

# Critical endpoints to monitor (path, expected_status, description)
# Note: endpoints requiring auth are pinged WITHOUT token. We expect HTTP 401
# which proves the route + auth layer are alive. If it returns 500, the
# backend is broken (this is exactly what we want to catch).
MONITORED_ENDPOINTS = [
    # === Endpoints publics (web + mobile) ===
    ("/api/jams", 200, "Liste des bœufs musicaux"),
    ("/api/concerts", 200, "Liste des concerts"),
    ("/api/melomanes/", 200, "Liste des mélomanes"),
    ("/api/venues", 200, "Liste des établissements"),
    ("/api/musicians", 200, "Liste des musiciens"),
    ("/api/bands", 200, "Liste des groupes"),
    ("/api/karaoke", 200, "Liste des karaokés"),
    ("/api/spectacle", 200, "Liste des spectacles"),
    ("/api/stats/counts", 200, "Stats globales"),
    ("/api/config", 200, "Configuration publique"),

    # === Endpoints critiques mobile (test 401 = auth marche, 500 = bug) ===
    ("/api/auth/me", 401, "[Mobile] Auth — décodage JWT"),
    ("/api/musicians/me/participations", 401, "[Mobile] Page principale musicien"),
    ("/api/notifications", 401, "[Mobile] Notifications push"),
    ("/api/messages/inbox", 401, "[Mobile] Messagerie"),
    ("/api/online-status/mode", 401, "[Mobile] Statut en ligne"),
]

# In-memory state of each endpoint. Key = path, value = dict.
_state = {
    path: {
        "path": path,
        "description": desc,
        "expected_status": expected,
        "status": "unknown",       # "up" | "down" | "unknown"
        "http_status": None,
        "latency_ms": None,
        "last_checked_at": None,
        "last_change_at": None,
        "last_error": None,
    }
    for path, expected, desc in MONITORED_ENDPOINTS
}
_summary = {
    "last_run_at": None,
    "next_run_at": None,
    "total_checks": 0,
    "total_alerts_sent": 0,
}


async def _check_one(client: httpx.AsyncClient, path: str, expected: int):
    url = f"{INTERNAL_BACKEND_URL}{path}"
    started = datetime.now(timezone.utc)
    try:
        resp = await client.get(url, timeout=REQUEST_TIMEOUT)
        latency_ms = int((datetime.now(timezone.utc) - started).total_seconds() * 1000)
        ok = resp.status_code == expected
        return {
            "ok": ok,
            "http_status": resp.status_code,
            "latency_ms": latency_ms,
            "error": None if ok else f"HTTP {resp.status_code}",
        }
    except Exception as exc:
        latency_ms = int((datetime.now(timezone.utc) - started).total_seconds() * 1000)
        return {
            "ok": False,
            "http_status": None,
            "latency_ms": latency_ms,
            "error": str(exc)[:300],
        }


async def _send_alert_email(subject: str, html: str):
    try:
        sent = await send_email(ALERT_EMAIL, subject, html)
        if sent:
            _summary["total_alerts_sent"] += 1
            logger.info(f"Health alert email sent to {ALERT_EMAIL}: {subject}")
        else:
            logger.error(f"Health alert email FAILED to send: {subject}")
    except Exception as exc:
        logger.error(f"Exception while sending health alert email: {exc}")


def _format_alert_html(transitions, kind: str):
    """kind = 'down' or 'up'."""
    color = "#dc2626" if kind == "down" else "#16a34a"
    title = "🚨 Endpoints DOWN" if kind == "down" else "✅ Endpoints récupérés"
    rows = ""
    for t in transitions:
        rows += f"""
        <tr style="border-bottom:1px solid #e5e7eb">
            <td style="padding:8px;font-family:monospace">{t['path']}</td>
            <td style="padding:8px">{t['description']}</td>
            <td style="padding:8px;color:{color};font-weight:600">{t.get('http_status') or 'timeout'}</td>
            <td style="padding:8px;color:#6b7280;font-size:12px">{t.get('error') or 'OK'}</td>
        </tr>
        """
    return f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <h2 style="color:{color};margin-bottom:8px">{title}</h2>
        <p style="color:#4b5563">Jam Connexion — Healthcheck Monitor</p>
        <p style="color:#6b7280;font-size:13px">
            {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}
        </p>
        <table style="width:100%;border-collapse:collapse;margin-top:16px;background:#fafafa">
            <thead style="background:#f3f4f6">
                <tr>
                    <th style="padding:8px;text-align:left">Endpoint</th>
                    <th style="padding:8px;text-align:left">Description</th>
                    <th style="padding:8px;text-align:left">Statut</th>
                    <th style="padding:8px;text-align:left">Détail</th>
                </tr>
            </thead>
            <tbody>{rows}</tbody>
        </table>
        <p style="color:#6b7280;font-size:12px;margin-top:24px">
            Dashboard santé : <a href="https://www.jamconnexion.com/api/health/detailed">/api/health/detailed</a>
        </p>
    </div>
    """


async def run_health_check_once():
    """Run one full pass over all monitored endpoints, update state, send alerts."""
    transitioned_down = []
    transitioned_up = []

    async with httpx.AsyncClient() as client:
        results = await asyncio.gather(
            *[_check_one(client, path, expected) for path, expected, _ in MONITORED_ENDPOINTS]
        )

    now_iso = datetime.now(timezone.utc).isoformat()
    for (path, expected, _desc), result in zip(MONITORED_ENDPOINTS, results):
        prev = _state[path]
        new_status = "up" if result["ok"] else "down"
        prev_status = prev["status"]

        prev["http_status"] = result["http_status"]
        prev["latency_ms"] = result["latency_ms"]
        prev["last_error"] = result["error"]
        prev["last_checked_at"] = now_iso

        if new_status != prev_status:
            prev["status"] = new_status
            prev["last_change_at"] = now_iso
            # Only send alert when transitioning AWAY from "unknown" or between up/down.
            # Skip the very first run that goes from "unknown" to "up" (no point).
            if prev_status != "unknown" or new_status == "down":
                snapshot = {
                    "path": path,
                    "description": prev["description"],
                    "http_status": result["http_status"],
                    "error": result["error"],
                }
                if new_status == "down":
                    transitioned_down.append(snapshot)
                else:
                    transitioned_up.append(snapshot)

    _summary["last_run_at"] = now_iso
    _summary["total_checks"] += 1

    # One email per batch (groups multiple endpoints if several flipped at once)
    if transitioned_down:
        await _send_alert_email(
            subject=f"🚨 [Jam Connexion] {len(transitioned_down)} endpoint(s) DOWN",
            html=_format_alert_html(transitioned_down, "down"),
        )
    if transitioned_up:
        await _send_alert_email(
            subject=f"✅ [Jam Connexion] {len(transitioned_up)} endpoint(s) récupéré(s)",
            html=_format_alert_html(transitioned_up, "up"),
        )

    return {
        "transitioned_down": transitioned_down,
        "transitioned_up": transitioned_up,
    }


async def health_monitor_loop():
    """Forever loop: run a check every CHECK_INTERVAL_SECONDS seconds."""
    logger.info(
        f"🩺 Health monitor started — pinging {len(MONITORED_ENDPOINTS)} endpoints every "
        f"{CHECK_INTERVAL_SECONDS}s. Alerts → {ALERT_EMAIL}"
    )
    # Slight delay so the FastAPI app is fully ready before first ping
    await asyncio.sleep(15)
    while True:
        try:
            await run_health_check_once()
        except Exception as exc:
            logger.error(f"Health monitor iteration failed: {exc}")
        await asyncio.sleep(CHECK_INTERVAL_SECONDS)


# ============= API =============

@router.get("/health/detailed")
async def health_detailed():
    """Real-time status of every monitored endpoint."""
    endpoints = list(_state.values())
    healthy = sum(1 for e in endpoints if e["status"] == "up")
    unhealthy = sum(1 for e in endpoints if e["status"] == "down")
    return {
        "overall_status": "healthy" if unhealthy == 0 else "degraded",
        "healthy_count": healthy,
        "unhealthy_count": unhealthy,
        "total_count": len(endpoints),
        "summary": _summary,
        "endpoints": endpoints,
        "monitored_at": datetime.now(timezone.utc).isoformat(),
    }


@router.post("/health/run-now")
async def health_run_now():
    """Manually trigger a healthcheck run (debug)."""
    result = await run_health_check_once()
    return {"ok": True, **result}
