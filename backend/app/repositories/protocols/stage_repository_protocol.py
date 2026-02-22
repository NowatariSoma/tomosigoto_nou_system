from __future__ import annotations

from typing import Any, Protocol, runtime_checkable
from uuid import UUID


@runtime_checkable
class StageRepositoryProtocol(Protocol):
    """StageRepository Protocol"""

    async def find_by_id(self, stage_id: UUID) -> dict[str, Any] | None: ...
    async def exists(self, stage_id: UUID) -> bool: ...
