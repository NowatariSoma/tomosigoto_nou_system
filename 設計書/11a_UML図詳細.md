# UML図詳細

## 1. 概要

本ドキュメントでは、練習表自動生成システムの設計において使用するUML図について詳細に説明します。UML（Unified Modeling Language）は、システムの構造や振る舞いを視覚的に表現するための標準言語であり、本システムの設計においては主に以下の図を活用します。

- クラス図：システムの静的構造を表現
- シーケンス図：オブジェクト間の相互作用を時系列で表現
- アクティビティ図：処理の流れを表現
- 状態遷移図：オブジェクトの状態変化を表現

各図はMermaid記法を用いて記述し、実装時の参照や関係者間のコミュニケーションに活用します。

## 2. クラス図

### 2.1 ドメインモデル概念図

ドメインモデルの中核となる概念を表現したクラス図です。システムの主要な概念とその関係性を表現しています。

```mermaid
classDiagram
    class 練習メニュー {
        -メニューID: UUID
        -名称: String
        -所要時間: int
        -難易度: Enum
        +作成()
        +編集()
        +削除()
    }
    
    class 選手 {
        -選手ID: UUID
        -氏名: String
        -ポジション: Enum
        -技術レベル: Enum
        +登録()
        +情報更新()
    }
    
    class 練習カテゴリ {
        -カテゴリID: UUID
        -カテゴリ名: String
        -説明: String
        +作成()
        +編集()
    }
    
    class チーム {
        -チームID: UUID
        -チーム名: String
        -監督: String
        -創設日: Date
        +選手追加()
        +選手削除()
    }
    
    class 練習表 {
        -練習表ID: UUID
        -作成日: Date
        -ステータス: Enum
        +生成()
        +保存()
        +公開()
    }
    
    class 練習表明細 {
        -明細ID: UUID
        -順序: int
        -実施時間: int
        +追加()
        +並べ替え()
    }
    
    練習メニュー "1" -- "0..*" 練習表明細
    練習カテゴリ "1" -- "0..*" 練習メニュー
    チーム "1" -- "0..*" 選手
    チーム "1" -- "0..*" 練習表
    練習表 "1" -- "1..*" 練習表明細
```

### 2.2 詳細クラス図（練習表管理）

練習表管理に関わるコンポーネントの詳細設計を表現したクラス図です。実装レベルでの設計を示しています。

```mermaid
classDiagram
    class Schedule {
        -id: UUID
        -teamId: UUID
        -practiceDate: LocalDate
        -createdBy: UUID
        -status: ScheduleStatus
        -createdAt: LocalDateTime
        -updatedAt: LocalDateTime
        +create(teamId, date): Schedule
        +publish(): void
        +cancel(): void
        +revise(): Schedule
    }
    
    class ScheduleDetail {
        -id: UUID
        -scheduleId: UUID
        -menuId: UUID
        -sequence: int
        -executionTime: int
        +changeSequence(newSeq): void
        +updateExecutionTime(time): void
    }
    
    class ScheduleStatus {
        <<enumeration>>
        DRAFT
        PUBLISHED
        REVISING
        CANCELED
    }
    
    class Menu {
        -id: UUID
        -name: String
        -duration: int
        -difficulty: DifficultyLevel
        -categoryId: UUID
        -description: String
        +createMenu(): Menu
        +updateDuration(duration): void
        +changeDifficulty(level): void
    }
    
    class MenuCategory {
        -id: UUID
        -name: String
        -description: String
        +createCategory(): MenuCategory
        +updateDescription(desc): void
    }
    
    class DifficultyLevel {
        <<enumeration>>
        LOW
        MEDIUM
        HIGH
    }
    
    class ScheduleRepository {
        +findById(id): Schedule
        +findByTeam(teamId): List~Schedule~
        +findByDateRange(start, end): List~Schedule~
        +save(schedule): Schedule
        +delete(id): void
    }
    
    class MenuRepository {
        +findById(id): Menu
        +findByCategory(categoryId): List~Menu~
        +findByDifficulty(level): List~Menu~
        +save(menu): Menu
        +delete(id): void
    }
    
    class ScheduleFactory {
        +generateSchedule(params): Schedule
        +optimizeSchedule(schedule): Schedule
    }
    
    Schedule "1" -- "1..*" ScheduleDetail
    Schedule -- ScheduleStatus
    Menu -- DifficultyLevel
    Menu "0..*" -- "1" MenuCategory
    ScheduleDetail "0..*" -- "1" Menu
    ScheduleRepository -- Schedule : manages >
    MenuRepository -- Menu : manages >
    ScheduleFactory -- Schedule : creates >
```

### 2.3 詳細クラス図（ユーザー管理）

ユーザー管理に関わるコンポーネントの詳細設計を表現したクラス図です。

```mermaid
classDiagram
    class User {
        -id: UUID
        -username: String
        -email: String
        -passwordHash: String
        -role: UserRole
        -lastLogin: LocalDateTime
        -createdAt: LocalDateTime
        +authenticate(password): boolean
        +changePassword(newPassword): void
        +updateProfile(profile): void
    }
    
    class UserRole {
        <<enumeration>>
        ADMIN
        COACH
        PLAYER
        VIEWER
    }
    
    class Team {
        -id: UUID
        -name: String
        -coach: UUID
        -foundedAt: LocalDate
        -location: String
        +addPlayer(playerId): void
        +removePlayer(playerId): void
        +changeCoach(coachId): void
    }
    
    class Player {
        -id: UUID
        -userId: UUID
        -teamId: UUID
        -position: Position
        -skillLevel: SkillLevel
        -joinedAt: LocalDate
        +changePosition(position): void
        +updateSkillLevel(level): void
    }
    
    class Position {
        <<enumeration>>
        GOALKEEPER
        DEFENDER
        MIDFIELDER
        FORWARD
    }
    
    class SkillLevel {
        <<enumeration>>
        BEGINNER
        INTERMEDIATE
        ADVANCED
        PROFESSIONAL
    }
    
    class UserRepository {
        +findById(id): User
        +findByUsername(username): User
        +findByEmail(email): User
        +save(user): User
        +delete(id): void
    }
    
    class TeamRepository {
        +findById(id): Team
        +findByCoach(coachId): List~Team~
        +save(team): Team
        +delete(id): void
    }
    
    class PlayerRepository {
        +findById(id): Player
        +findByTeam(teamId): List~Player~
        +findByPosition(position): List~Player~
        +save(player): Player
        +delete(id): void
    }
    
    User -- UserRole
    Player "0..*" -- "1" Team
    Player -- Position
    Player -- SkillLevel
    Player "1" -- "1" User
    Team "0..*" -- "1" User : coached by
    UserRepository -- User : manages >
    TeamRepository -- Team : manages >
    PlayerRepository -- Player : manages >
```

## 3. シーケンス図

### 3.1 練習表生成プロセス

練習表生成の一連の流れを表現したシーケンス図です。ユーザーからの要求がどのように処理されるかを示しています。

```mermaid
sequenceDiagram
    actor User as コーチ
    participant UI as 練習表生成UI
    participant Controller as ScheduleController
    participant UseCase as ScheduleGenerationUseCase
    participant Factory as ScheduleFactory
    participant Service as ScheduleService
    participant Repo as ScheduleRepository
    participant MenuRepo as MenuRepository
    
    User->>UI: 練習表生成要求
    UI->>Controller: 生成パラメータ送信
    Controller->>UseCase: execute(params)
    
    UseCase->>MenuRepo: 適切なメニュー検索
    MenuRepo-->>UseCase: メニュー一覧
    
    UseCase->>Factory: generateSchedule(params, menus)
    
    Factory->>Factory: メニュー選択アルゴリズム実行
    Factory->>Factory: 時間配分最適化
    Factory->>Factory: 練習表オブジェクト構築
    
    Factory-->>UseCase: 生成された練習表
    
    UseCase->>Service: 練習表保存
    Service->>Repo: save(schedule)
    Repo-->>Service: 保存確認
    Service-->>UseCase: 保存結果
    
    UseCase-->>Controller: 生成結果
    Controller-->>UI: 練習表データ返却
    UI-->>User: 練習表表示
```

### 3.2 練習表編集プロセス

練習表の編集プロセスを表現したシーケンス図です。

```mermaid
sequenceDiagram
    actor User as コーチ
    participant UI as 練習表編集UI
    participant Controller as ScheduleController
    participant UseCase as ScheduleEditUseCase
    participant Service as ScheduleService
    participant Repo as ScheduleRepository
    participant MenuRepo as MenuRepository
    
    User->>UI: 練習表編集要求
    UI->>Controller: 練習表ID送信
    Controller->>UseCase: findSchedule(id)
    
    UseCase->>Repo: findById(id)
    Repo-->>UseCase: 練習表データ
    
    UseCase-->>Controller: 練習表データ
    Controller-->>UI: 編集用データ返却
    UI-->>User: 編集フォーム表示
    
    User->>UI: 編集内容入力
    UI->>Controller: 更新データ送信
    Controller->>UseCase: updateSchedule(id, updates)
    
    UseCase->>Repo: findById(id)
    Repo-->>UseCase: 現在の練習表
    
    alt メニューの変更あり
        UseCase->>MenuRepo: findById(menuId)
        MenuRepo-->>UseCase: メニューデータ
    end
    
    UseCase->>Service: 練習表更新
    Service->>Repo: save(updatedSchedule)
    Repo-->>Service: 更新確認
    Service-->>UseCase: 更新結果
    
    UseCase-->>Controller: 更新結果
    Controller-->>UI: 結果通知
    UI-->>User: 更新完了通知
```

### 3.3 練習表公開プロセス

練習表の公開プロセスを表現したシーケンス図です。

```mermaid
sequenceDiagram
    actor User as コーチ
    participant UI as 練習表管理UI
    participant Controller as ScheduleController
    participant UseCase as SchedulePublishUseCase
    participant Service as ScheduleService
    participant Repo as ScheduleRepository
    participant NotifService as NotificationService
    participant TeamRepo as TeamRepository
    
    User->>UI: 練習表公開要求
    UI->>Controller: 公開指示(scheduleId)
    Controller->>UseCase: publishSchedule(id)
    
    UseCase->>Repo: findById(id)
    Repo-->>UseCase: 練習表データ
    
    UseCase->>Service: publish(schedule)
    Service->>Repo: save(publishedSchedule)
    Repo-->>Service: 保存確認
    
    Service->>TeamRepo: findById(schedule.teamId)
    TeamRepo-->>Service: チーム情報
    
    Service->>NotifService: notifyTeamMembers(team, schedule)
    NotifService-->>Service: 通知完了
    
    Service-->>UseCase: 公開結果
    UseCase-->>Controller: 公開結果
    Controller-->>UI: 結果通知
    UI-->>User: 公開完了通知
```

## 4. アクティビティ図

### 4.1 練習表生成アルゴリズム

練習表生成の処理フローを表現したアクティビティ図です。

```mermaid
stateDiagram-v2
    [*] --> 生成パラメータ受信
    生成パラメータ受信 --> パラメータ検証
    
    パラメータ検証 --> チームデータ取得
    パラメータ検証 --> 制約条件抽出
    
    チームデータ取得 --> メニュー候補取得
    制約条件抽出 --> メニュー候補取得
    
    メニュー候補取得 --> メニュー選択アルゴリズム実行
    メニュー選択アルゴリズム実行 --> 初期練習表生成
    
    初期練習表生成 --> 制約チェック
    
    state 制約チェック {
        [*] --> 時間制約確認
        時間制約確認 --> 難易度バランス確認
        難易度バランス確認 --> カテゴリバランス確認
        カテゴリバランス確認 --> [*]
    }
    
    制約チェック --> 制約条件満足判定
    
    state if_制約満足 <<choice>>
    制約条件満足判定 --> if_制約満足
    
    if_制約満足 --> 練習表保存: 制約満足
    if_制約満足 --> 最適化パラメータ調整: 制約未満足
    
    最適化パラメータ調整 --> メニュー再選択
    メニュー再選択 --> 制約チェック
    
    state if_繰り返し <<choice>>
    最適化パラメータ調整 --> if_繰り返し
    if_繰り返し --> 現状最良解採用: 繰り返し回数超過
    if_繰り返し --> メニュー再選択: 繰り返し継続
    
    現状最良解採用 --> 練習表保存
    
    練習表保存 --> 練習表返却
    練習表返却 --> [*]
```

### 4.2 練習メニュー最適化プロセス

練習メニューの最適化プロセスを表現したアクティビティ図です。

```mermaid
stateDiagram-v2
    [*] --> チーム情報取得
    チーム情報取得 --> 選手スキルレベル分析
    選手スキルレベル分析 --> 練習目的確認
    練習目的確認 --> 時間制約確認
    
    時間制約確認 --> メニュー候補抽出
    
    state メニュー候補抽出 {
        [*] --> カテゴリ別候補選定
        カテゴリ別候補選定 --> 難易度フィルタリング
        難易度フィルタリング --> 時間的制約適用
        時間的制約適用 --> 優先順位付け
        優先順位付け --> [*]
    }
    
    メニュー候補抽出 --> 組み合わせ最適化
    
    state 組み合わせ最適化 {
        [*] --> 初期組み合わせ生成
        初期組み合わせ生成 --> スコア計算
        スコア計算 --> 改善探索
        改善探索 --> スコア再計算
        
        state if_改善可能 <<choice>>
        スコア再計算 --> if_改善可能
        if_改善可能 --> 改善探索: 改善の余地あり
        if_改善可能 --> [*]: これ以上改善なし
    }
    
    組み合わせ最適化 --> 順序最適化
    
    state 順序最適化 {
        [*] --> 初期順序決定
        初期順序決定 --> 運動生理学的制約適用
        運動生理学的制約適用 --> 前後関係制約適用
        前後関係制約適用 --> [*]
    }
    
    順序最適化 --> 最終練習表作成
    最終練習表作成 --> [*]
```

## 5. 状態遷移図

### 5.1 練習表の状態遷移

練習表が持つ状態とその遷移を表現した状態遷移図です。

```mermaid
stateDiagram-v2
    [*] --> 作成中: 新規作成
    作成中 --> 下書き: 保存
    下書き --> 編集中: 編集開始
    編集中 --> 下書き: 保存
    下書き --> 公開中: 公開
    公開中 --> 編集中: 改訂
    編集中 --> 公開中: 再公開
    公開中 --> 下書き: 一時保留
    公開中 --> キャンセル済: キャンセル
    下書き --> キャンセル済: 破棄
    キャンセル済 --> [*]: 削除
    公開中 --> アーカイブ済: アーカイブ
    アーカイブ済 --> [*]: 削除
```

### 5.2 ユーザーアカウントの状態遷移

ユーザーアカウントの状態とその遷移を表現した状態遷移図です。

```mermaid
stateDiagram-v2
    [*] --> 未登録: システム導入
    未登録 --> 仮登録: 招待送信
    仮登録 --> アクティブ: 登録完了
    仮登録 --> 期限切れ: 招待期限経過
    期限切れ --> 仮登録: 再招待
    アクティブ --> 停止中: アカウント停止
    停止中 --> アクティブ: 停止解除
    アクティブ --> ロック中: ログイン失敗多数
    ロック中 --> アクティブ: ロック解除
    アクティブ --> 削除済: アカウント削除
    削除済 --> [*]: 完全削除
```

### 5.3 チームメンバーシップの状態遷移

チームメンバーシップの状態とその遷移を表現した状態遷移図です。

```mermaid
stateDiagram-v2
    [*] --> 招待中: メンバー招待
    招待中 --> 所属中: 招待承認
    招待中 --> 招待却下: 招待拒否/期限切れ
    招待却下 --> 招待中: 再招待
    所属中 --> 休止中: 一時休止
    休止中 --> 所属中: 復帰
    所属中 --> 卒業/転出: 卒業処理/転出処理
    休止中 --> 卒業/転出: 卒業処理/転出処理
    卒業/転出 --> [*]: 記録保持期間経過
``` 