# 能の練習表作成システム

強化学習（PPO）を使用して能の練習スケジュールを自動生成するAIシステムです。場面ベースの設計により、従来の「人」を割り当てる方式から「場面」を割り当てる方式に変更し、より柔軟で実用的な練習スケジュールの生成を実現します。

## 🎯 概要

このシステムは以下の特徴を持ちます：

- **場面ベース設計**: シテ、ワキ、地謡、楽器などの場面を基本単位としたスケジュール作成
- **動的環境生成**: エピソードごとにランダムな環境設定で学習
- **柔軟な制約管理**: 監督制約や設備制約を段階的に制御可能
- **高効率学習**: PPOアルゴリズムによる安定した学習
- **再現性確保**: 固定シード値による学習結果の再現性

## 📋 現在の設定

### 環境設定

```yaml
# 基本設定
max_rooms: 10               # 最大部屋数
max_scenes: 20              # 最大場面数
max_timeslots: 4            # 最大時間帯数
max_people: 60              # 最大人数

# 動的範囲（エピソードごとにランダム生成）
dynamic_ranges:
  scenes: [19, 20]          # 場面数範囲
  rooms: [6, 8]             # 部屋数範囲
  people: [55, 60]          # 人数範囲
```

### モデル設定

```yaml
# PPO設定
policy: "MultiInputPolicy"
learning_rate: 0.0003       # SB3既定の学習率
total_timesteps: 20000000   # 2000万ステップ
n_steps: 512
batch_size: 2048
n_epochs: 6
n_envs: 32
device: "cuda"

# ネットワーク構造
policy_kwargs:
  net_arch:
    pi: [256, 128]          # ポリシーネットワーク
    vf: [256, 128]          # 価値関数ネットワーク
```

### 報酬設定

```yaml
# 基本報酬
basic_rewards:
  new_assignment: 1.0       # 新規割り当て
  reassignment: -1.0        # 移動ペナルティ
  repeat_action: -8.0       # 重複行動ペナルティ
  step_penalty: -0.05       # ステップペナルティ

# 完了報酬
completion_rewards:
  scene_completion: 1.0     # 場面完了ボーナス
```

## 🎭 場面設定

システムでは以下の場面テンプレートを使用：

### 主要役柄
- **シテ**: 優先度5、主要な役柄
- **ワキ**: 優先度4、脇役
- **舞囃子**: 優先度4、舞と囃子の組み合わせ

### 歌・謡
- **地謡**: 優先度3、地謡
- **謡**: 優先度3、謡
- **一調〜八調**: 優先度2、調子の異なる謡

### 楽器
- **笛**: 優先度3、能管
- **小鼓**: 優先度2、小鼓
- **大鼓**: 優先度2、大鼓
- **太鼓**: 優先度2、太鼓
- **囃子**: 優先度3、囃子全般
- **地拍子**: 優先度2、地拍子

### 舞
- **仕舞**: 優先度3、仕舞

## 🏢 部屋設定

以下の部屋テンプレートを使用：

- **大ホール**: 容量30人、優先度5
- **中ホール**: 容量20人、優先度4
- **稽古場**: 容量25人、優先度4
- **リハーサル室**: 容量22人、優先度4
- **練習室A/B/C**: 容量15人、優先度3
- **小ホール**: 容量12人、優先度3
- **多目的室**: 容量18人、優先度3
- **楽器練習室**: 容量10人、優先度2

## 🚀 使用方法

### 1. 環境セットアップ

```bash
# 仮想環境を作成
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# または
venv\Scripts\activate     # Windows

# 依存関係をインストール
pip install -r requirements.txt
```

### 2. 学習実行

```bash
# 設定ファイルを使用した学習
PYTHONPATH=. python src/training/train.py
```

### 3. 設定のカスタマイズ

各設定ファイルを編集して、学習パラメータを調整できます：

- `configs/model/model.yaml`: モデル設定
- `configs/environment/env.yaml`: 環境設定
- `configs/reward/reward.yaml`: 報酬設定

## 📁 プロジェクト構造

```
tomosigoto-nou-ai/
├── configs/                    # 設定ファイル群
│   ├── environment/
│   │   └── env.yaml           # 環境設定
│   ├── model/
│   │   └── model.yaml         # モデル設定
│   └── reward/
│       └── reward.yaml        # 報酬設定
├── src/                        # ソースコード
│   ├── environment/            # 環境クラス
│   ├── rewards/                # 報酬関数
│   ├── training/               # 学習処理
│   └── utils/                  # ユーティリティ
├── models/                     # 学習済みモデル
│   ├── base_model/            # ベースモデル
│   ├── scene_based_system/    # シーンベースシステム
│   └── continued/             # 継続学習モデル
├── logs/                       # 学習ログ
├── ppo_tensorboard_logs/      # TensorBoardログ
└── result/                     # 学習結果
```

## 📊 学習結果

### 利用可能なモデル

- **`base_model10000000.zip`**: 1000万ステップ学習済みベースモデル
- **`scene_based_system_model_8000000_steps.zip`**: 800万ステップ学習済みシーンベースシステム
- **`scene_based_system_model_16000000_steps.zip`**: 1600万ステップ学習済みシーンベースシステム

### 学習メトリクス

- **成功率**: 全エピソードの成功割合
- **平均報酬**: エピソード平均報酬
- **平均エピソード長**: エピソード平均ステップ数
- **場面完了率**: 全場面の割り当て完了度

## 🔧 カスタマイズ

### 場面の追加・変更

`configs/environment/env.yaml`の`scene_templates`セクションを編集：

```yaml
scene_templates:
  - name: "新しい場面"
    category: "カテゴリ"
    priority: 3
```

### 部屋の追加・変更

`configs/environment/env.yaml`の`room_templates`セクションを編集：

```yaml
room_templates:
  - name: "新しい部屋"
    capacity: 20
    priority: 3
```

### 学習パラメータの調整

`configs/model/model.yaml`で学習率やバッチサイズを調整：

```yaml
learning_rate: 0.0001        # 学習率を下げる
batch_size: 1024             # バッチサイズを小さくする
```

## 🐛 トラブルシューティング

### よくある問題

1. **メモリ不足**
   - `batch_size`を小さくする
   - `max_scenes`や`max_rooms`を減らす

2. **学習が収束しない**
   - `learning_rate`を調整
   - 報酬関数の重みを調整

3. **CUDAエラー**
   - `device: "cpu"`に変更してCPU学習を試す

## 📝 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 🤝 貢献

バグ報告や機能提案は、GitHubのIssuesでお知らせください。

## 📞 サポート

技術的な質問やサポートが必要な場合は、プロジェクトのIssuesページをご利用ください。