# BACK-DB-001.4: 会場マスタ・利用可能時間テーブル設計 - 詳細実装計画

## 実装ファイル詳細

### `migrations/venue.sql`
**目的**: 会場マスター情報を格納するテーブルを定義するSQL

**主要内容**:
- `venues`テーブルの作成
- 主キー、ユニーク制約の設定
- インデックスの設定（名前、コード、位置情報等）
- RLSポリシーの設定
- トリガーの設定（更新日時自動更新等）

**SQLサンプル**:
```sql
CREATE TABLE venues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    address TEXT,
    latitude FLOAT,
    longitude FLOAT,
    venue_type VARCHAR(50) NOT NULL,
    capacity INTEGER,
    contact_info JSONB,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_venues_name ON venues(name);
CREATE INDEX idx_venues_code ON venues(code);
CREATE INDEX idx_venues_venue_type ON venues(venue_type);
CREATE INDEX idx_venues_location ON venues(latitude, longitude);
```

### `migrations/venue_attribute.sql`
**目的**: 会場の追加属性情報を格納するテーブルを定義するSQL

**主要内容**:
- `venue_attributes`テーブルの作成
- 主キー、外部キー制約の設定
- 複合ユニーク制約の設定（会場ID + 属性キー）
- インデックスの設定
- RLSポリシーの設定

**SQLサンプル**:
```sql
CREATE TABLE venue_attributes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    attribute_key VARCHAR(50) NOT NULL,
    attribute_value TEXT,
    attribute_type VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(venue_id, attribute_key)
);

CREATE INDEX idx_venue_attributes_venue_id ON venue_attributes(venue_id);
CREATE INDEX idx_venue_attributes_key ON venue_attributes(attribute_key);
```

### `migrations/availability_slot.sql`
**目的**: 会場の利用可能時間枠情報を格納するテーブルを定義するSQL

**主要内容**:
- `availability_slots`テーブルの作成
- 主キー、外部キー制約の設定
- 日付・時間に関するインデックスの設定
- 重複チェック制約の設定
- RLSポリシーの設定

**SQLサンプル**:
```sql
CREATE TABLE availability_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    slot_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'available',
    cost FLOAT,
    constraints JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (start_time < end_time)
);

CREATE INDEX idx_availability_slots_venue_id ON availability_slots(venue_id);
CREATE INDEX idx_availability_slots_date ON availability_slots(slot_date);
CREATE INDEX idx_availability_slots_venue_date ON availability_slots(venue_id, slot_date);
```

### `migrations/recurring_slot.sql`
**目的**: 会場の定期的な利用可能時間枠パターンを格納するテーブルを定義するSQL

**主要内容**:
- `recurring_slots`テーブルの作成
- 主キー、外部キー制約の設定
- 曜日と時間に関するインデックスの設定
- 有効期間の制約設定
- RLSポリシーの設定

**SQLサンプル**:
```sql
CREATE TABLE recurring_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    valid_from DATE NOT NULL,
    valid_until DATE,
    recurrence_rule TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (start_time < end_time),
    CHECK (valid_until IS NULL OR valid_from <= valid_until)
);

CREATE INDEX idx_recurring_slots_venue_id ON recurring_slots(venue_id);
CREATE INDEX idx_recurring_slots_day ON recurring_slots(day_of_week);
CREATE INDEX idx_recurring_slots_venue_day ON recurring_slots(venue_id, day_of_week);
```

### `app/models/venue.py`
**目的**: 会場関連のドメインモデルを定義するPythonファイル

**クラス/インターフェース**:
- `Venue`: 会場のドメインモデル
  - **継承/実装**: `pydantic.BaseModel`
  - **主要属性**:
    - `id: UUID` - 会場ID
    - `name: str` - 会場名
    - `code: str` - 会場コード
    - `address: Optional[str]` - 住所
    - `latitude: Optional[float]` - 緯度
    - `longitude: Optional[float]` - 経度
    - `venue_type: str` - 会場種別
    - `capacity: Optional[int]` - 収容人数
    - `contact_info: Dict[str, Any]` - 連絡先情報
    - `description: Optional[str]` - 説明
    - `is_active: bool` - 有効フラグ
    - `created_at: datetime` - 作成日時
    - `updated_at: datetime` - 更新日時
    - `attributes: List[VenueAttribute]` - 会場属性リスト
  - **主要メソッド**: 
    - `get_attribute(key: str) -> Optional[str]` - 指定したキーの属性値を取得
    - `has_attribute(key: str, value: str) -> bool` - 指定した属性が存在するか確認
    - `to_dict() -> dict` - 辞書形式に変換
    - `get_location() -> Tuple[float, float]` - 緯度・経度を取得
  - **依存クラス**: `VenueAttribute`

- `VenueAttribute`: 会場属性のドメインモデル
  - **継承/実装**: `pydantic.BaseModel`
  - **主要属性**:
    - `id: UUID` - 属性ID
    - `venue_id: UUID` - 会場ID参照
    - `attribute_key: str` - 属性キー
    - `attribute_value: str` - 属性値
    - `attribute_type: str` - 属性タイプ
    - `created_at: datetime` - 作成日時
    - `updated_at: datetime` - 更新日時
  - **主要メソッド**: 
    - `to_dict() -> dict` - 辞書形式に変換
  - **依存クラス**: なし

- `AvailabilitySlot`: 利用可能時間枠のドメインモデル
  - **継承/実装**: `pydantic.BaseModel`
  - **主要属性**:
    - `id: UUID` - 時間枠ID
    - `venue_id: UUID` - 会場ID参照
    - `slot_date: date` - 利用可能日
    - `start_time: time` - 開始時間
    - `end_time: time` - 終了時間
    - `status: str` - ステータス
    - `cost: Optional[float]` - 利用料金
    - `constraints: Dict[str, Any]` - 制約条件
    - `created_at: datetime` - 作成日時
    - `updated_at: datetime` - 更新日時
  - **主要メソッド**: 
    - `duration_minutes() -> int` - 時間枠の長さ（分）を計算
    - `is_available() -> bool` - 利用可能かどうか確認
    - `overlaps_with(other_slot: AvailabilitySlot) -> bool` - 他の時間枠と重複するか確認
    - `to_dict() -> dict` - 辞書形式に変換
  - **依存クラス**: なし

- `RecurringSlot`: 定期利用枠のドメインモデル
  - **継承/実装**: `pydantic.BaseModel`
  - **主要属性**:
    - `id: UUID` - 定期枠ID
    - `venue_id: UUID` - 会場ID参照
    - `day_of_week: int` - 曜日(0-6)
    - `start_time: time` - 開始時間
    - `end_time: time` - 終了時間
    - `valid_from: date` - 有効開始日
    - `valid_until: Optional[date]` - 有効終了日
    - `recurrence_rule: Optional[str]` - 繰り返しルール
    - `is_active: bool` - 有効フラグ
    - `created_at: datetime` - 作成日時
    - `updated_at: datetime` - 更新日時
  - **主要メソッド**: 
    - `duration_minutes() -> int` - 時間枠の長さ（分）を計算
    - `is_valid_on_date(target_date: date) -> bool` - 指定日に有効かどうか確認
    - `generate_slots(start_date: date, end_date: date) -> List[AvailabilitySlot]` - 期間内の実際の時間枠を生成
    - `to_dict() -> dict` - 辞書形式に変換
  - **依存クラス**: `AvailabilitySlot`

### `app/repositories/venue_repository.py`
**目的**: 会場関連データのデータアクセス層を実装するPythonファイル

**クラス/インターフェース**:
- `VenueRepository`: 会場データにアクセスするリポジトリクラス
  - **継承/実装**: なし
  - **主要属性**:
    - `_db_client` - データベースクライアント
    - `_logger` - ロガー
  - **主要メソッド**: 
    - `__init__(db_client)` - コンストラクタ
    - `get_venue(venue_id: UUID) -> Optional[Venue]` - 会場を取得
    - `get_venue_by_code(code: str) -> Optional[Venue]` - コードで会場を取得
    - `list_venues(filters: dict = None) -> List[Venue]` - 会場一覧を取得
    - `create_venue(venue_data: dict) -> Venue` - 会場を作成
    - `update_venue(venue_id: UUID, data: dict) -> Venue` - 会場を更新
    - `delete_venue(venue_id: UUID) -> bool` - 会場を削除
    - `get_venue_attributes(venue_id: UUID) -> List[VenueAttribute]` - 会場属性を取得
    - `add_venue_attribute(attribute_data: dict) -> VenueAttribute` - 会場属性を追加
    - `update_venue_attribute(attribute_id: UUID, data: dict) -> VenueAttribute` - 会場属性を更新
    - `delete_venue_attribute(attribute_id: UUID) -> bool` - 会場属性を削除
    - `get_availability_slots(venue_id: UUID, start_date: date, end_date: date) -> List[AvailabilitySlot]` - 利用可能時間枠を取得
    - `create_availability_slot(slot_data: dict) -> AvailabilitySlot` - 利用可能時間枠を作成
    - `update_availability_slot(slot_id: UUID, data: dict) -> AvailabilitySlot` - 利用可能時間枠を更新
    - `delete_availability_slot(slot_id: UUID) -> bool` - 利用可能時間枠を削除
    - `get_recurring_slots(venue_id: UUID) -> List[RecurringSlot]` - 定期利用枠を取得
    - `create_recurring_slot(slot_data: dict) -> RecurringSlot` - 定期利用枠を作成
    - `update_recurring_slot(slot_id: UUID, data: dict) -> RecurringSlot` - 定期利用枠を更新
    - `delete_recurring_slot(slot_id: UUID) -> bool` - 定期利用枠を削除
    - `generate_availability_from_recurring(venue_id: UUID, start_date: date, end_date: date) -> List[AvailabilitySlot]` - 定期枠から利用可能時間枠を生成
  - **依存クラス**: `Venue`, `VenueAttribute`, `AvailabilitySlot`, `RecurringSlot`

### `app/schemas/venue_schemas.py`
**目的**: API通信用の会場関連データスキーマを定義するPythonファイル

**クラス/インターフェース**:
- `VenueCreate`: 会場作成リクエストスキーマ
  - **継承/実装**: `pydantic.BaseModel`
  - **主要属性**:
    - `name: str` - 会場名
    - `code: str` - 会場コード
    - `address: Optional[str]` - 住所
    - `latitude: Optional[float]` - 緯度
    - `longitude: Optional[float]` - 経度
    - `venue_type: str` - 会場種別
    - `capacity: Optional[int]` - 収容人数
    - `contact_info: Optional[Dict[str, Any]]` - 連絡先情報
    - `description: Optional[str]` - 説明

- `VenueResponse`: 会場情報レスポンススキーマ
  - **継承/実装**: `pydantic.BaseModel`
  - **主要属性**:
    - `id: UUID` - 会場ID
    - `name: str` - 会場名
    - `code: str` - 会場コード
    - `address: Optional[str]` - 住所
    - `latitude: Optional[float]` - 緯度
    - `longitude: Optional[float]` - 経度
    - `venue_type: str` - 会場種別
    - `capacity: Optional[int]` - 収容人数
    - `contact_info: Dict[str, Any]` - 連絡先情報
    - `description: Optional[str]` - 説明
    - `is_active: bool` - 有効フラグ
    - `created_at: datetime` - 作成日時
    - `updated_at: datetime` - 更新日時
    - `attributes: List[VenueAttributeResponse]` - 会場属性リスト

- `VenueAttributeCreate`: 会場属性作成リクエストスキーマ
  - **継承/実装**: `pydantic.BaseModel`
  - **主要属性**:
    - `venue_id: UUID` - 会場ID
    - `attribute_key: str` - 属性キー
    - `attribute_value: str` - 属性値
    - `attribute_type: str` - 属性タイプ

- `VenueAttributeResponse`: 会場属性情報レスポンススキーマ
  - **継承/実装**: `pydantic.BaseModel`
  - **主要属性**:
    - `id: UUID` - 属性ID
    - `venue_id: UUID` - 会場ID
    - `attribute_key: str` - 属性キー
    - `attribute_value: str` - 属性値
    - `attribute_type: str` - 属性タイプ
    - `created_at: datetime` - 作成日時
    - `updated_at: datetime` - 更新日時

- `AvailabilitySlotCreate`: 利用可能時間枠作成リクエストスキーマ
  - **継承/実装**: `pydantic.BaseModel`
  - **主要属性**:
    - `venue_id: UUID` - 会場ID
    - `slot_date: date` - 利用可能日
    - `start_time: time` - 開始時間
    - `end_time: time` - 終了時間
    - `status: str` - ステータス
    - `cost: Optional[float]` - 利用料金
    - `constraints: Optional[Dict[str, Any]]` - 制約条件

- `AvailabilitySlotResponse`: 利用可能時間枠情報レスポンススキーマ
  - **継承/実装**: `pydantic.BaseModel`
  - **主要属性**:
    - `id: UUID` - 時間枠ID
    - `venue_id: UUID` - 会場ID
    - `venue_name: str` - 会場名
    - `slot_date: date` - 利用可能日
    - `start_time: time` - 開始時間
    - `end_time: time` - 終了時間
    - `status: str` - ステータス
    - `cost: Optional[float]` - 利用料金
    - `constraints: Dict[str, Any]` - 制約条件
    - `created_at: datetime` - 作成日時
    - `updated_at: datetime` - 更新日時

- `RecurringSlotCreate`: 定期利用枠作成リクエストスキーマ
  - **継承/実装**: `pydantic.BaseModel`
  - **主要属性**:
    - `venue_id: UUID` - 会場ID
    - `day_of_week: int` - 曜日(0-6)
    - `start_time: time` - 開始時間
    - `end_time: time` - 終了時間
    - `valid_from: date` - 有効開始日
    - `valid_until: Optional[date]` - 有効終了日
    - `recurrence_rule: Optional[str]` - 繰り返しルール

- `RecurringSlotResponse`: 定期利用枠情報レスポンススキーマ
  - **継承/実装**: `pydantic.BaseModel`
  - **主要属性**:
    - `id: UUID` - 定期枠ID
    - `venue_id: UUID` - 会場ID
    - `venue_name: str` - 会場名
    - `day_of_week: int` - 曜日(0-6)
    - `start_time: time` - 開始時間
    - `end_time: time` - 終了時間
    - `valid_from: date` - 有効開始日
    - `valid_until: Optional[date]` - 有効終了日
    - `recurrence_rule: Optional[str]` - 繰り返しルール
    - `is_active: bool` - 有効フラグ
    - `created_at: datetime` - 作成日時
    - `updated_at: datetime` - 更新日時

### `app/services/venue_service.py`
**目的**: 会場管理のビジネスロジックを実装するサービスクラスのPythonファイル

**クラス/インターフェース**:
- `VenueService`: 会場管理のビジネスロジックを実装するサービス
  - **継承/実装**: なし
  - **主要属性**:
    - `_venue_repository: VenueRepository` - 会場リポジトリ
    - `_logger` - ロガー
  - **主要メソッド**: 
    - `__init__(venue_repository: VenueRepository)` - コンストラクタ
    - `get_venue_details(venue_id: UUID) -> VenueResponse` - 会場詳細取得
    - `search_venues(search_params: dict) -> List[VenueResponse]` - 会場検索
    - `create_venue(venue_data: VenueCreate) -> VenueResponse` - 会場作成
    - `update_venue(venue_id: UUID, data: dict) -> VenueResponse` - 会場更新
    - `delete_venue(venue_id: UUID) -> bool` - 会場削除
    - `add_venue_attribute(attribute_data: VenueAttributeCreate) -> VenueAttributeResponse` - 会場属性追加
    - `update_venue_attribute(attribute_id: UUID, data: dict) -> VenueAttributeResponse` - 会場属性更新
    - `delete_venue_attribute(attribute_id: UUID) -> bool` - 会場属性削除
    - `get_availability_calendar(venue_id: UUID, year: int, month: int) -> Dict[date, List[AvailabilitySlotResponse]]` - 会場空き状況カレンダー取得
    - `create_availability_slot(slot_data: AvailabilitySlotCreate) -> AvailabilitySlotResponse` - 利用可能時間枠作成
    - `update_availability_slot(slot_id: UUID, data: dict) -> AvailabilitySlotResponse` - 利用可能時間枠更新
    - `delete_availability_slot(slot_id: UUID) -> bool` - 利用可能時間枠削除
    - `create_recurring_slot(slot_data: RecurringSlotCreate) -> RecurringSlotResponse` - 定期利用枠作成
    - `update_recurring_slot(slot_id: UUID, data: dict) -> RecurringSlotResponse` - 定期利用枠更新
    - `delete_recurring_slot(slot_id: UUID) -> bool` - 定期利用枠削除
    - `generate_slots_from_recurring(venue_id: UUID, start_date: date, end_date: date) -> List[AvailabilitySlotResponse]` - 定期枠から利用可能時間枠を生成
    - `check_venue_availability(venue_id: UUID, target_date: date, start_time: time, end_time: time) -> bool` - 会場の空き状況確認
    - `get_nearest_venues(latitude: float, longitude: float, radius_km: float = 5.0) -> List[VenueResponse]` - 位置情報に基づく近隣会場検索
  - **依存クラス**: `VenueRepository`, `VenueCreate`, `VenueResponse`, `VenueAttributeCreate`, `VenueAttributeResponse`, `AvailabilitySlotCreate`, `AvailabilitySlotResponse`, `RecurringSlotCreate`, `RecurringSlotResponse`

### `tests/models/test_venue_models.py`
**目的**: 会場モデルのユニットテストを実装するPythonファイル

**クラス/インターフェース**:
- `TestVenueModel`: 会場モデルのテストクラス
  - **継承/実装**: `unittest.TestCase`
  - **主要メソッド**: 
    - `setUp()` - テスト準備
    - `test_create_venue()` - 会場作成テスト
    - `test_get_attribute()` - 属性取得テスト
    - `test_has_attribute()` - 属性存在確認テスト
    - `test_to_dict()` - 辞書変換テスト
    - `test_get_location()` - 位置情報取得テスト

- `TestAvailabilitySlotModel`: 利用可能時間枠モデルのテストクラス
  - **継承/実装**: `unittest.TestCase`
  - **主要メソッド**: 
    - `setUp()` - テスト準備
    - `test_create_slot()` - 時間枠作成テスト
    - `test_duration_minutes()` - 時間計算テスト
    - `test_is_available()` - 利用可能確認テスト
    - `test_overlaps_with()` - 重複確認テスト

- `TestRecurringSlotModel`: 定期利用枠モデルのテストクラス
  - **継承/実装**: `unittest.TestCase`
  - **主要メソッド**: 
    - `setUp()` - テスト準備
    - `test_create_recurring_slot()` - 定期枠作成テスト
    - `test_is_valid_on_date()` - 日付有効性確認テスト
    - `test_generate_slots()` - 時間枠生成テスト

### `tests/repositories/test_venue_repository.py`
**目的**: 会場リポジトリのユニットテストを実装するPythonファイル

**クラス/インターフェース**:
- `TestVenueRepository`: 会場リポジトリのテストクラス
  - **継承/実装**: `unittest.TestCase`
  - **主要メソッド**: 
    - `setUp()` - テスト準備
    - `tearDown()` - テスト後処理
    - `test_get_venue()` - 会場取得テスト
    - `test_get_venue_by_code()` - コードによる会場取得テスト
    - `test_list_venues()` - 会場一覧取得テスト
    - `test_create_venue()` - 会場作成テスト
    - `test_update_venue()` - 会場更新テスト
    - `test_delete_venue()` - 会場削除テスト
    - `test_get_venue_attributes()` - 会場属性取得テスト
    - `test_add_venue_attribute()` - 会場属性追加テスト
    - `test_update_venue_attribute()` - 会場属性更新テスト
    - `test_delete_venue_attribute()` - 会場属性削除テスト
    - `test_get_availability_slots()` - 利用可能時間枠取得テスト
    - `test_create_availability_slot()` - 利用可能時間枠作成テスト
    - `test_update_availability_slot()` - 利用可能時間枠更新テスト
    - `test_delete_availability_slot()` - 利用可能時間枠削除テスト
    - `test_get_recurring_slots()` - 定期利用枠取得テスト
    - `test_create_recurring_slot()` - 定期利用枠作成テスト
    - `test_update_recurring_slot()` - 定期利用枠更新テスト
    - `test_delete_recurring_slot()` - 定期利用枠削除テスト
    - `test_generate_availability_from_recurring()` - 定期枠からの時間枠生成テスト 