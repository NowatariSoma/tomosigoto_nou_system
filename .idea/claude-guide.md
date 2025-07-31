# Claude Code自動化システム

## 概要
このシステムは、GitHub IssuesをClaude Codeで自動的に解決するための2つのワークフローで構成されています。

## ワークフロー

### 1. Auto Issue Resolver
- **目的**: 未処理のIssueを見つけて@claudeメンションで処理を開始
- **実行タイミング**: JST 23:00-06:00の間、30分ごと
- **処理順序**: 
  1. 優先度順（high → middle → low → 未設定）
  2. 各優先度内では古い順

### 2. Claude Completion Checker
- **目的**: 処理の完了を確認し、未完了の場合は続行を促す
- **実行タイミング**: メインワークフローの15分後
- **機能**:
  - 10分経過後に応答を確認
  - 最大3回まで自動リトライ
  - PRの作成も完了判定に含む
  - **チェックボックスの完了状態を確認**

## 完了判定条件

処理が完了したと判定されるのは、以下の条件を**すべて**満たした場合：
1. Claudeからの応答がある、またはPRが作成されている
2. Issue内のすべてのチェックボックス（`- [ ]`）がチェック済み（`- [x]`）になっている

## ラベルシステム

| ラベル | 説明 |
|--------|------|
| `high`, `middle`, `low` | 優先度ラベル |
| `claude-code-requested` | Claude Codeに処理依頼済み |
| `claude-completed` | 処理完了 |
| `claude-error` | 最大リトライ後も未完了 |

## 処理フロー

```mermaid
graph TD
    A[新規Issue] --> B{優先度確認}
    B -->|high/middle/low| C[優先度付きキュー]
    B -->|なし| D[優先度なしキュー]
    C --> E[Auto Issue Resolver]
    D --> E
    E --> F[@claudeメンション]
    F --> G[claude-code-requestedラベル追加]
    G --> H[15分待機]
    H --> I[Completion Checker]
    I --> J{Claudeの応答<br/>またはPRあり？}
    J -->|Yes| JA{チェックボックス<br/>全て完了？}
    J -->|No| L{リトライ回数確認}
    JA -->|Yes| K[claude-completedラベル追加]
    JA -->|No| L
    L -->|3回未満| M[再度@claudeメンション]
    L -->|3回到達| N[claude-errorラベル追加]
    M --> H
```

## セットアップ

### 必要なシークレット
- `PERSONAL_ACCESS_TOKEN`: リポジトリへの書き込み権限を持つPAT

### 必要な権限
- Issues: write
- Pull requests: read
- Contents: read

## 注意事項
- Claude Codeが有効になっていることを確認
- @claudeメンションに反応するように設定されていることを確認
- 処理時間は Issue の複雑さによって変動
- チェックボックスを使用している場合、すべてのタスクが完了するまで`claude-completed`ラベルは付与されません

## チェックボックスの使用例

Issueの本文に以下のようなチェックボックスがある場合：
```markdown
## タスク
- [x] データベーススキーマの設計
- [ ] APIエンドポイントの実装
- [ ] テストの作成
- [ ] ドキュメントの更新
```

すべてのチェックボックスがチェック済み（`- [x]`）になるまで、処理は未完了と判定されます。
