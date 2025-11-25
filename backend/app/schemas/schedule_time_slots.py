"""
スケジュール時間スロット関連のスキーマ定義
"""
from datetime import datetime, time
from typing import Optional, Union
from pydantic import BaseModel, Field, field_serializer, field_validator
from uuid import UUID


class ScheduleTimeSlotBase(BaseModel):
    """スケジュール時間スロットの基本スキーマ"""
    schedule_id: UUID = Field(..., description="練習スケジュールID")
    slot_order: int = Field(..., description="時間スロットの順序（上から何個目か）", gt=0)
    start_time: time = Field(..., description="時間スロットの開始時刻")
    end_time: time = Field(..., description="時間スロットの終了時刻")
    
    @field_validator('start_time', 'end_time', mode='before')
    @classmethod
    def parse_time(cls, v: Union[str, time]) -> time:
        """文字列（HH:MM、HH:MM:SS、タイムスタンプ形式）をtime型に変換"""
        if isinstance(v, time):
            return v
        
        if isinstance(v, str):
            # タイムスタンプ形式（06:34:10.554Z）の場合
            if "Z" in v or "T" in v:
                try:
                    # ISO 8601形式をパース
                    dt = datetime.fromisoformat(v.replace("Z", "+00:00"))
                    return dt.time()
                except:
                    # パースに失敗した場合は、時刻部分を抽出
                    if "T" in v:
                        time_part = v.split("T")[1].split("Z")[0].split("+")[0].split("-")[0]
                    else:
                        time_part = v.split("Z")[0]
                    # HH:MM:SS.microseconds から time オブジェクトを作成
                    time_parts = time_part.split(":")
                    if len(time_parts) >= 2:
                        hour = int(time_parts[0])
                        minute = int(time_parts[1])
                        second = int(time_parts[2].split(".")[0]) if len(time_parts) > 2 else 0
                        return time(hour, minute, second)
            
            # HH:MM または HH:MM:SS 形式
            time_parts = v.split(":")
            if len(time_parts) >= 2:
                hour = int(time_parts[0])
                minute = int(time_parts[1])
                second = int(time_parts[2]) if len(time_parts) > 2 else 0
                return time(hour, minute, second)
        
        raise ValueError(f"無効な時刻形式: {v}")
    
    @field_serializer('start_time', 'end_time')
    def serialize_time(self, value: time) -> str:
        """time型をHH:MM形式の文字列に変換"""
        return value.strftime("%H:%M")


class ScheduleTimeSlotCreate(ScheduleTimeSlotBase):
    """スケジュール時間スロット作成用スキーマ"""
    pass


class ScheduleTimeSlotUpdate(BaseModel):
    """スケジュール時間スロット更新用スキーマ"""
    schedule_id: Optional[UUID] = Field(None, description="練習スケジュールID")
    slot_order: Optional[int] = Field(None, description="時間スロットの順序（上から何個目か）", gt=0)
    start_time: Optional[time] = Field(None, description="時間スロットの開始時刻")
    end_time: Optional[time] = Field(None, description="時間スロットの終了時刻")
    
    @field_validator('start_time', 'end_time', mode='before')
    @classmethod
    def parse_time(cls, v: Union[str, time, None]) -> Optional[time]:
        """文字列（HH:MM、HH:MM:SS、タイムスタンプ形式）をtime型に変換"""
        if v is None:
            return None
        return ScheduleTimeSlotBase.parse_time(v)


class ScheduleTimeSlotResponse(ScheduleTimeSlotBase):
    """スケジュール時間スロットレスポンス用スキーマ"""
    id: UUID = Field(..., description="スケジュール時間スロットID")
    created_at: datetime = Field(..., description="作成日時")
    updated_at: datetime = Field(..., description="更新日時")

    class Config:
        from_attributes = True


class ScheduleTimeSlotBulkCreate(BaseModel):
    """スケジュール時間スロット一括作成用スキーマ"""
    schedule_id: UUID = Field(..., description="練習スケジュールID")
    time_slots: list[dict] = Field(..., description="時間スロット情報一覧")
    # time_slots の構造例:
    # [
    #   {
    #     "slot_order": 1,
    #     "start_time": "09:00",
    #     "end_time": "10:00"
    #   },
    #   {
    #     "slot_order": 2,
    #     "start_time": "10:00",
    #     "end_time": "11:00"
    #   }
    # ]


class ScheduleTimeSlotBulkResponse(BaseModel):
    """スケジュール時間スロット一括作成レスポンス用スキーマ"""
    created_count: int = Field(..., description="作成された件数")
    created_items: list[ScheduleTimeSlotResponse] = Field(..., description="作成されたスケジュール時間スロット一覧")
    errors: list[str] = Field(default_factory=list, description="エラー一覧")

