"""
セッション指導者関連のビジネスロジック
"""
from __future__ import annotations

from typing import Any
from uuid import UUID

from app.core.error_messages import ErrorMessage
from app.core.exceptions import APIException
from fastapi import HTTPException, status
from app.repositories.protocols import SessionInstructorRepositoryProtocol


class SessionInstructorService:
    """セッション指導者のビジネスロジックを実装するクラス"""

    def __init__(self, session_instructor_repository: SessionInstructorRepositoryProtocol):
        self.repository = session_instructor_repository

    def get_all_session_instructors(
        self,
        page: int = 1,
        per_page: int = 20,
        schedule_id: UUID | None = None,
        slot_order: int | None = None
    ) -> dict[str, Any]:
        """セッション指導者一覧を取得（ページネーション対応）"""
        offset = (page - 1) * per_page

        # 詳細情報付きで取得
        items = self.repository.find_all_with_details(
            limit=per_page,
            offset=offset,
            schedule_id=schedule_id,
            slot_order=slot_order
        )

        # 総件数を取得
        total = self.repository.count_all(
            schedule_id=schedule_id,
            slot_order=slot_order
        )

        total_pages = (total + per_page - 1) // per_page

        return {
            "items": items,
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": total_pages
        }

    def get_all_session_instructors_simple(
        self,
        schedule_id: UUID | None = None,
        slot_order: int | None = None
    ) -> list[dict[str, Any]]:
        """セッション指導者一覧を取得（シンプル版）"""
        # 詳細情報付きで全件取得
        items = self.repository.find_all_with_details(
            limit=1000,  # 十分大きな値を設定
            offset=0,
            schedule_id=schedule_id,
            slot_order=slot_order
        )

        return items

    def get_session_instructor(self, session_instructor_id: UUID) -> dict[str, Any]:
        """指定したIDのセッション指導者を取得"""
        session_instructor = self.repository.find_by_id(session_instructor_id)
        if not session_instructor:
            raise APIException(ErrorMessage.USER_NOT_FOUND)
        return session_instructor

    def get_session_instructors_by_schedule(self, schedule_id: UUID) -> list[dict[str, Any]]:
        """指定したスケジュールの指導者一覧を取得"""
        return self.repository.find_by_schedule(schedule_id)

    def get_session_instructors_by_schedule_and_slot(self, schedule_id: UUID, slot_order: int) -> list[dict[str, Any]]:
        """指定したスケジュールとコマの指導者一覧を取得"""
        return self.repository.find_by_schedule_and_slot(schedule_id, slot_order)

    def get_session_instructors_by_attendance(self, attendance_id: UUID) -> list[dict[str, Any]]:
        """指定した出席IDの指導者割り当て一覧を取得"""
        return self.repository.find_by_attendance_id(attendance_id)

    def create_session_instructor(self, session_instructor_data: dict[str, Any]) -> dict[str, Any]:
        """セッション指導者を作成"""
        # スケジュールと出席記録の存在確認
        self._validate_schedule_and_attendance(
            session_instructor_data["schedule_id"],
            session_instructor_data["attendance_id"],
            session_instructor_data.get("schedule_available_venue_id")
        )

        return self.repository.create(session_instructor_data)

    def create_session_instructors_bulk(
        self,
        schedule_id: UUID,
        slot_order: int,
        schedule_available_venue_id: UUID | None,
        attendance_ids: list[UUID]
    ) -> dict[str, Any]:
        """セッション指導者を一括作成"""
        created_items = []
        errors = []

        for attendance_id in attendance_ids:
            try:
                # 既存チェック
                existing = self.repository.find_by_schedule_slot_and_attendance(
                    schedule_id, slot_order, attendance_id
                )
                if existing:
                    errors.append(f"スケジュール {schedule_id}、コマ {slot_order}、出席 {attendance_id} の組み合わせは既に存在します")
                    continue

                # スケジュールと出席記録の存在確認
                self._validate_schedule_and_attendance(
                    schedule_id, attendance_id, schedule_available_venue_id
                )

                # 作成
                session_instructor_data = {
                    "schedule_id": schedule_id,
                    "slot_order": slot_order,
                    "schedule_available_venue_id": schedule_available_venue_id,
                    "attendance_id": attendance_id
                }
                created_item = self.repository.create(session_instructor_data)
                created_items.append(created_item)

            except Exception as e:
                errors.append(f"出席 {attendance_id}: {str(e)}")

        return {
            "created_count": len(created_items),
            "created_items": created_items,
            "errors": errors
        }

    def update_session_instructor(
        self,
        session_instructor_id: UUID,
        update_data: dict[str, Any]
    ) -> dict[str, Any]:
        """セッション指導者を更新"""
        # 存在確認
        existing = self.repository.find_by_id(session_instructor_id)
        if not existing:
            raise APIException(ErrorMessage.USER_NOT_FOUND)

        # スケジュールと出席記録の存在確認（更新される場合）
        if "schedule_id" in update_data or "attendance_id" in update_data or "schedule_available_venue_id" in update_data:
            schedule_id = update_data.get("schedule_id", existing["schedule_id"])
            attendance_id = update_data.get("attendance_id", existing["attendance_id"])
            schedule_available_venue_id = update_data.get("schedule_available_venue_id", existing.get("schedule_available_venue_id"))
            self._validate_schedule_and_attendance(schedule_id, attendance_id, schedule_available_venue_id)

        return self.repository.update(session_instructor_id, update_data)

    def delete_session_instructor(self, session_instructor_id: UUID) -> bool:
        """セッション指導者を削除"""
        print(f"DEBUG delete_session_instructor service: session_instructor_id={session_instructor_id}")
        existing = self.repository.find_by_id(session_instructor_id)
        print(f"DEBUG delete_session_instructor service: existing={existing}")
        if not existing:
            raise APIException(ErrorMessage.USER_NOT_FOUND)

        result = self.repository.delete(session_instructor_id)
        print(f"DEBUG delete_session_instructor service: delete result={result}")
        return result

    def delete_session_instructors_by_schedule(self, schedule_id: UUID) -> int:
        """指定したスケジュールの指導者割り当てをすべて削除"""
        return self.repository.delete_by_schedule(schedule_id)

    def delete_session_instructors_by_schedule_and_slot(self, schedule_id: UUID, slot_order: int) -> int:
        """指定したスケジュールとコマの指導者割り当てをすべて削除"""
        return self.repository.delete_by_schedule_and_slot(schedule_id, slot_order)

    def _validate_schedule_and_attendance(
        self,
        schedule_id: UUID,
        attendance_id: UUID,
        schedule_available_venue_id: UUID | None = None
    ):
        """スケジュールと出席記録の存在確認"""
        # スケジュールの存在確認
        schedule = self.repository.find_schedule_by_id(schedule_id)
        if not schedule:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="指定されたスケジュールが存在しません"
            )

        # 出席記録の存在確認
        attendance = self.repository.find_attendance_by_id(attendance_id)
        if not attendance:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="指定された出席記録が存在しません"
            )

        # スケジュールと出席記録のスケジュールが一致するかチェック
        if str(schedule_id) != attendance["practice_schedule_id"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="スケジュールと出席記録のスケジュールが一致しません"
            )

        # 利用可能会場の存在確認（指定されている場合）
        if schedule_available_venue_id:
            venue = self.repository.find_schedule_available_venue_by_id(schedule_available_venue_id)
            if not venue:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="指定された利用可能会場が存在しません"
                )

        return True

    def get_instructor_candidates(self, practice_schedule_id: UUID) -> list[dict[str, Any]]:
        """インストラクター候補を取得（出席記録ありかつis_instructorがtrueのユーザー）"""
        return self.repository.find_instructor_candidates(practice_schedule_id)

    def move_session_instructor(
        self,
        session_instructor_id: UUID,
        target_venue_id: UUID,
        target_slot_order: int
    ) -> dict[str, Any]:
        """インストラクターを別の会場・時限に移動"""
        # インストラクター情報を取得
        session_instructor = self.repository.find_by_id(session_instructor_id)
        if not session_instructor:
            raise APIException(ErrorMessage.USER_NOT_FOUND)

        schedule_id = session_instructor.get("schedule_id")

        # venue_idの変換（session_instructorsテーブルはschedule_available_venue_idを使用）
        # まず、schedule_available_venue_idとして直接検索
        schedule_available_venue = None
        try:
            if isinstance(target_venue_id, UUID):
                search_id = target_venue_id
            else:
                search_id = UUID(target_venue_id)

            schedule_available_venue = self.repository.find_schedule_available_venue_by_id(search_id)
        except Exception as e:
            print(f"DEBUG move_session_instructor: find_by_idエラー: {e}")

        if schedule_available_venue:
            actual_target_venue_id = schedule_available_venue.get("id")
        else:
            # 見つからない場合は、そのまま使用
            actual_target_venue_id = target_venue_id

        # 更新
        updated_data = {
            "schedule_available_venue_id": str(actual_target_venue_id),
            "slot_order": target_slot_order
        }

        updated_session_instructor = self.repository.update(session_instructor_id, updated_data)

        # 詳細情報を取得して返す（limit=1000で全件取得を試みる）
        detailed_instructors = self.repository.find_all_with_details(
            limit=1000,
            offset=0,
            schedule_id=schedule_id,
            slot_order=target_slot_order
        )
        print(f"DEBUG move_session_instructor: 詳細情報取得完了。件数={len(detailed_instructors)}, session_instructor_id={session_instructor_id}")

        # 更新したインストラクターを探して返す
        for instructor in detailed_instructors:
            instructor_id_str = instructor.get("id")
            target_id_str = str(session_instructor_id)
            print(f"DEBUG move_session_instructor: 比較 {instructor_id_str} === {target_id_str}")
            if instructor_id_str == target_id_str:
                print(f"DEBUG move_session_instructor: マッチしたインストラクター情報={instructor}")
                return instructor

        # 見つからなければ更新後のデータをそのまま返す
        print(f"DEBUG move_session_instructor: マッチするインストラクターが見つかりません。updated_session_instructorを返します={updated_session_instructor}")
        return updated_session_instructor
