from typing import Any, Dict, List
from uuid import UUID

from app.api.deps import get_current_user, get_session_instructor_repository
from app.schemas.practice_schedules import (
    SessionInstructorBase,
    SessionInstructorCreate,
    SessionInstructorResponse,
)
from app.repositories.practice_schedule_repository import SessionInstructorRepository
from fastapi import APIRouter, Depends, HTTPException

router = APIRouter()
