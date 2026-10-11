"""Build 217 — Plateaux musicaux.

Un plateau regroupe plusieurs projets (groupes, solos, duos, GUSO) pour une
soirée collective proposée à un établissement. L'admin crée le plateau,
invite des projets ; chaque invité accepte ou refuse. Dès que tous les
membres ont accepté, le plateau devient "active". Les plateaux avec des
places vacantes sont visibles dans "Intégrer un plateau".
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime, timezone


# ─── Statuts ─────────────────────────────────────────────────────────────
PlateauStatus = Literal["pending", "active", "incomplete", "cancelled"]
MemberStatus = Literal["pending", "accepted", "rejected"]
# Référence d'un projet : band_id si groupe inline, musician_id sinon
ProjectKind = Literal["band", "solo"]


class PlateauMember(BaseModel):
    """Un projet (groupe, solo, duo, GUSO) membre d'un plateau."""
    user_id: str                       # user_id du musicien propriétaire du projet
    musician_id: str                   # musician.id (profil musicien)
    project_kind: ProjectKind = "band" # "band" ou "solo"
    band_id: Optional[str] = None      # band inline id (si project_kind="band")
    project_name: str                  # Nom affiché (band_name ou pseudo musicien)
    music_styles: List[str] = []       # Styles du projet
    photo: Optional[str] = None        # Photo du projet (band photo ou profile_image)
    status: MemberStatus = "pending"
    invited_at: str
    responded_at: Optional[str] = None


class Plateau(BaseModel):
    id: str
    admin_user_id: str
    admin_musician_id: str
    admin_name: str                       # pseudo de l'admin (dénormalisé pour perf)
    title: str
    description: Optional[str] = ""
    max_members: int = Field(default=4, ge=2, le=6)
    members: List[PlateauMember] = []
    status: PlateauStatus = "pending"
    # Géo (dénormalisée depuis l'admin pour les filtres)
    country: Optional[str] = None
    region: Optional[str] = None
    department: Optional[str] = None
    city: Optional[str] = None
    created_at: str
    updated_at: str


class PlateauMemberInput(BaseModel):
    """Payload de sélection d'un projet lors de la création."""
    musician_id: str
    project_kind: ProjectKind = "band"
    band_id: Optional[str] = None


class AdminProjectInput(BaseModel):
    """Build 229 — projet avec lequel l'admin entre dans le plateau (défaut : solo)."""
    project_kind: ProjectKind = "solo"
    band_id: Optional[str] = None


class PlateauCreateInput(BaseModel):
    title: str
    description: Optional[str] = ""
    max_members: int = Field(default=4, ge=2, le=6)
    invited_members: List[PlateauMemberInput] = []
    admin_project: Optional[AdminProjectInput] = None


class PlateauUpdateInput(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    max_members: Optional[int] = Field(default=None, ge=2, le=6)


class PlateauInviteInput(BaseModel):
    members: List[PlateauMemberInput]


class PlateauRespondInput(BaseModel):
    """Réponse d'un membre invité OU réponse de l'admin à une demande d'intégration."""
    accept: bool
    musician_id: Optional[str] = None  # Pour l'admin, précise le candidat concerné


class PlateauJoinRequestInput(BaseModel):
    """Demande d'intégration : un musicien propose son projet à un plateau ouvert."""
    musician_id: str
    project_kind: ProjectKind = "band"
    band_id: Optional[str] = None


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()
