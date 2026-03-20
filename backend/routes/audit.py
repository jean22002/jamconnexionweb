"""
Audit Log System - Track user actions and system events
Captures critical actions for security, compliance, and debugging
"""
from fastapi import APIRouter, HTTPException, Depends, Header, Request
from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/audit", tags=["audit"])

# MongoDB database (will be injected)
db = None

def set_db(database):
    global db
    db = database

# Import auth helper
import jwt
import os

JWT_SECRET = os.environ.get('JWT_SECRET', 'default_secret')
JWT_ALGORITHM = "HS256"

async def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

async def get_admin_user(authorization: str = Header(None)):
    """Verify user is admin"""
    user = await get_current_user(authorization)
    
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    return user


# === AUDIT LOG CREATION ===

async def create_audit_log(
    user_id: str,
    user_role: str,
    action: str,
    resource_type: str,
    resource_id: Optional[str] = None,
    details: Optional[dict] = None,
    ip_address: Optional[str] = None,
    status: str = "success"
):
    """
    Create an audit log entry
    
    Args:
        user_id: ID of the user performing the action
        user_role: Role of the user (venue, musician, melomane, admin)
        action: Action performed (login, create, update, delete, etc.)
        resource_type: Type of resource affected (profile, event, planning_slot, etc.)
        resource_id: ID of the affected resource (optional)
        details: Additional details about the action (optional)
        ip_address: IP address of the user (optional)
        status: Status of the action (success, failed, error)
    """
    try:
        log_entry = {
            "user_id": user_id,
            "user_role": user_role,
            "action": action,
            "resource_type": resource_type,
            "resource_id": resource_id,
            "details": details or {},
            "ip_address": ip_address,
            "status": status,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        await db.audit_logs.insert_one(log_entry)
        logger.info(f"Audit log created: {user_id} - {action} - {resource_type}")
        
    except Exception as e:
        logger.error(f"Error creating audit log: {e}")
        # Don't raise exception to avoid breaking the main flow


# === AUDIT LOG QUERIES ===

class AuditLogQuery(BaseModel):
    user_id: Optional[str] = None
    user_role: Optional[str] = None
    action: Optional[str] = None
    resource_type: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    status: Optional[str] = None
    limit: int = 100
    skip: int = 0


@router.post("/logs/search")
async def search_audit_logs(
    query: AuditLogQuery,
    admin_user: dict = Depends(get_admin_user)
):
    """
    Search audit logs with filters (Admin only)
    """
    try:
        # Build MongoDB query
        mongo_query = {}
        
        if query.user_id:
            mongo_query["user_id"] = query.user_id
        
        if query.user_role:
            mongo_query["user_role"] = query.user_role
        
        if query.action:
            mongo_query["action"] = query.action
        
        if query.resource_type:
            mongo_query["resource_type"] = query.resource_type
        
        if query.status:
            mongo_query["status"] = query.status
        
        # Date range filter
        if query.start_date or query.end_date:
            date_filter = {}
            if query.start_date:
                date_filter["$gte"] = query.start_date
            if query.end_date:
                date_filter["$lte"] = query.end_date
            if date_filter:
                mongo_query["timestamp"] = date_filter
        
        # Count total
        total = await db.audit_logs.count_documents(mongo_query)
        
        # Fetch logs
        logs = await db.audit_logs.find(
            mongo_query,
            {"_id": 0}
        ).sort("timestamp", -1).skip(query.skip).limit(query.limit).to_list(query.limit)
        
        return {
            "total": total,
            "logs": logs,
            "page": query.skip // query.limit + 1,
            "per_page": query.limit
        }
        
    except Exception as e:
        logger.error(f"Error searching audit logs: {e}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.get("/logs/user/{user_id}")
async def get_user_audit_logs(
    user_id: str,
    limit: int = 50,
    admin_user: dict = Depends(get_admin_user)
):
    """
    Get audit logs for a specific user (Admin only)
    """
    try:
        logs = await db.audit_logs.find(
            {"user_id": user_id},
            {"_id": 0}
        ).sort("timestamp", -1).limit(limit).to_list(limit)
        
        return {"user_id": user_id, "logs": logs}
        
    except Exception as e:
        logger.error(f"Error fetching user audit logs: {e}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.get("/logs/recent")
async def get_recent_audit_logs(
    limit: int = 100,
    admin_user: dict = Depends(get_admin_user)
):
    """
    Get recent audit logs (Admin only)
    """
    try:
        logs = await db.audit_logs.find(
            {},
            {"_id": 0}
        ).sort("timestamp", -1).limit(limit).to_list(limit)
        
        return {"logs": logs}
        
    except Exception as e:
        logger.error(f"Error fetching recent audit logs: {e}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.get("/stats")
async def get_audit_stats(
    admin_user: dict = Depends(get_admin_user)
):
    """
    Get audit statistics (Admin only)
    """
    try:
        # Total logs
        total_logs = await db.audit_logs.count_documents({})
        
        # Logs by action
        logs_by_action = await db.audit_logs.aggregate([
            {"$group": {"_id": "$action", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 10}
        ]).to_list(10)
        
        # Logs by resource type
        logs_by_resource = await db.audit_logs.aggregate([
            {"$group": {"_id": "$resource_type", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 10}
        ]).to_list(10)
        
        # Failed actions
        failed_logs = await db.audit_logs.count_documents({"status": "failed"})
        error_logs = await db.audit_logs.count_documents({"status": "error"})
        
        # Most active users
        most_active_users = await db.audit_logs.aggregate([
            {"$group": {"_id": "$user_id", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 10}
        ]).to_list(10)
        
        return {
            "total_logs": total_logs,
            "failed_actions": failed_logs,
            "error_actions": error_logs,
            "by_action": [{"action": item["_id"], "count": item["count"]} for item in logs_by_action],
            "by_resource": [{"resource": item["_id"], "count": item["count"]} for item in logs_by_resource],
            "most_active_users": [{"user_id": item["_id"], "actions": item["count"]} for item in most_active_users]
        }
        
    except Exception as e:
        logger.error(f"Error fetching audit stats: {e}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


# === HELPER FUNCTION TO EXPORT ===

async def log_action(
    user_id: str,
    user_role: str,
    action: str,
    resource_type: str,
    resource_id: Optional[str] = None,
    details: Optional[dict] = None,
    request: Optional[Request] = None,
    status: str = "success"
):
    """
    Helper function to log actions from other routes
    Can be called from any route that needs audit logging
    """
    ip_address = None
    if request:
        ip_address = request.client.host if request.client else None
    
    await create_audit_log(
        user_id=user_id,
        user_role=user_role,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details,
        ip_address=ip_address,
        status=status
    )
