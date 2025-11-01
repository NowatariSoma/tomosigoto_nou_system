# フロントエンドルーティング構造図

> **トモシゴト 能楽部練習表** - ページ＆モーダル依存関係マップ  
> バージョン: 3.0.0（ER図のみ） | 最終更新: 2025-11-01

---

## 👤 一般ユーザー向けマップ

**アクセス可能な機能**: 閲覧、確出席認、個人設定

```mermaid
graph TB
    subgraph Dashboard[ダッシュボード]
        Home["/ トップページ"]
    end
    
    subgraph ScheduleView[スケジュール閲覧]
        subgraph SchedulePage[📆 /schedule<br/>スケジュールページ]
            CalendarView[カレンダー表示]
            BottomSheet[🔲 BottomSheetSchedule<br/>日付詳細表示]
            ShowMoreModal[🔲 ShowMoreEventsModal<br/>イベント一覧]
            PracticeDetailModal[🔲 PracticeDetailModal<br/>練習詳細]
        end
        
        subgraph PracticeSlotsPage[📖 /practice-slots<br/>練習表ページ]
            DateNav[日付ナビゲーション]
            SlotTable[練習表テーブル]
            SlotInfo[練習情報表示]
        end
    end
    
    subgraph PerformanceView[演目閲覧]
        subgraph PerformancesPage[📝 /performances-list<br/>演目一覧ページ]
            FloraDisplay[演目表示]
            FloraSection[セクション別表示]
        end
    end
    
    subgraph AttendanceView[出席確認]
        subgraph AttendancePage[🕒 /attendance<br/>出席管理ページ]
            AttendList[出席一覧（閲覧のみ）]
        end
    end
    
    subgraph PersonalSettings[個人設定]
        subgraph AccountPage[👤 /account-setting<br/>アカウント設定ページ]
            AccountInfo[個人情報管理]
        end
    end
    
    %% ページ間の依存関係
    Home -.閲覧.-> CalendarView
    Home -.確認.-> SlotTable
    Home -.参照.-> FloraDisplay
    Home -.閲覧.-> AttendList
    CalendarView -.詳細確認.-> SlotTable
    
    %% モーダルの呼び出し関係
    CalendarView -->|日付クリック| BottomSheet
    BottomSheet -->|もっと見る| ShowMoreModal
    BottomSheet -->|練習詳細| PracticeDetailModal
```

---

## 👨‍💼 管理者向けマップ

**アクセス可能な機能**: 全機能（設定、編集、登録、削除、閲覧）

```mermaid
graph TB
    subgraph BaseSetup[基本設定グループ]
        subgraph RoomSettingsPage[🏢 /room-settings<br/>部屋設定ページ]
            RoomList[部屋一覧管理]
            RoomModal[🔲 RoomModal<br/>部屋新規作成/編集]
        end
        
        subgraph PartsSettingPage[🎭 /parts-setting<br/>舞台・パート登録ページ]
            PartsList[舞台・パート管理]
            StageModal[🔲 StageModal<br/>舞台新規作成/編集]
        end
    end
    
    subgraph MemberSetup[メンバー設定グループ]
        subgraph MemberAssignmentsPage[✅ /member-assignments-setting<br/>メンバー所属設定ページ]
            MemberList[メンバー所属管理]
            MemberRegModal[🔲 MemberRegistrationModal<br/>メンバー登録]
            MemberAssignModal[🔲 MemberAssignmentModal<br/>所属編集]
        end
    end
    
    subgraph ScheduleManagement[スケジュール管理グループ]
        subgraph PracticeSchedulePage[📅 /practice-schedule<br/>練習スケジュール登録ページ]
            ScheduleList[スケジュール管理]
            ScheduleForm[📝 PracticeScheduleForm<br/>スケジュール登録]
            RoomSelectModal[🔲 RoomSelectionModal<br/>部屋選択]
        end
        
        subgraph PracticeEditorPage[✏️ /practice-schedule-editor<br/>練習表編集ページ]
            EditorTable[練習表編集テーブル]
            SessionModal[🔲 SessionEditorModal<br/>セッション編集]
            InstructorModal[🔲 InstructorEditorModal<br/>講師編集]
            OptimizeModal[🔲 OptimizationModal<br/>最適化実行]
            TimeSlotModal[🔲 TimeSlotEditorModal<br/>時間枠編集]
        end
    end
    
    subgraph AttendanceManagement[出席管理グループ]
        subgraph AttendDetailPage["📋 /attendance/practice/{id}<br/>出席登録詳細ページ"]
            AttendForm[出席登録フォーム]
            AttendCard[出席カード管理]
        end
    end
    
    %% ページ間の依存関係
    RoomList -.部屋データ.-> ScheduleList
    PartsList -.パートデータ.-> MemberList
    MemberList -.メンバーデータ.-> ScheduleList
    ScheduleList -.スケジュール.-> EditorTable
    EditorTable -.確定.-> AttendForm
    
    %% モーダルの呼び出し関係
    RoomList -->|新規/編集| RoomModal
    PartsList -->|新規/編集| StageModal
    MemberList -->|登録| MemberRegModal
    MemberList -->|編集| MemberAssignModal
    ScheduleList -->|登録/編集| ScheduleForm
    ScheduleForm -->|部屋選択| RoomSelectModal
    EditorTable -->|セッション編集| SessionModal
    EditorTable -->|講師編集| InstructorModal
    EditorTable -->|最適化| OptimizeModal
    EditorTable -->|時間編集| TimeSlotModal
    
```
