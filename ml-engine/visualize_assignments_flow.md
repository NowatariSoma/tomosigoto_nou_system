## visualize_assignments.py フロー図（Mermaid）

`scripts/visualize_assignments.py` の処理フローを日本語で図示しています。ランダム実行パスとモデル使用パス、環境生成、推論ループ、画像保存までをカバーします。

```mermaid
flowchart TD
  Start["スクリプト実行"] --> Main["main()"]
  Main --> Args["引数解析: --model, --random"]

  Args -->|"--random" 指定| Rand["ランダムスケジュール生成・同時刻同場面は1部屋のみ"]
  Rand --> Names["パート名(20)定義"]
  Names --> Save1["可視化保存 save_visualization"]

  Save1 --> HM["ヒートマップ作成 create_schedule_heatmap"]
  Save1 --> TL["タイムライン作成 create_timeline_view"]
  HM --> SaveHM["ヒートマップPNG保存 outputs/visualizations"]
  TL --> SaveTL["タイムラインPNG保存 outputs/visualizations"]

  Args -->|それ以外| LAV["モデル読み込みと可視化 load_and_visualize_model"]

  LAV --> ModelCheck{"指定モデルパスは存在？"}
  ModelCheck -->|はい| LoadPath["PPO.load(指定パス)"]
  ModelCheck -->|いいえ| FindDefault{"既定パスからモデル探索"}
  FindDefault -->|見つかった| LoadDefault["PPO.load(発見パス)"]
  FindDefault -->|見つからない| NoModel["model=None(ランダム行動)"]

  LAV --> LoadCfg["設定読込 env.yaml・reward.yaml"]
  LoadCfg --> MergeCfg["報酬設定を環境設定に統合"]
  MergeCfg --> CreateEnv["環境生成(動的観測・マスキング有効)"]
  CreateEnv --> Unwrap["ラッパー解除して base_env 取得"]
  Unwrap --> Parts["base_env からパート名取得・日本語化"]
  Parts --> Reset["環境リセット・max_steps 取得"]

  Reset --> Loop{"終了 or 最大ステップに到達？"}
  Loop -->|いいえ| Act{"モデルあり？"}
  Act -->|はい| Predict["予測 action=model.predict(..., deterministic=True)"]
  Act -->|いいえ| RandomAct["ランダム action サンプル"]
  Predict --> Step["env.step 実行・ステップ加算"]
  RandomAct --> Step
  Step --> Loop

  Loop -->|はい| Post["スケジュールを base_env から取得"]
  Post --> Rate["完了率を計算(メソッド/フォールバック)"]
  Rate --> Save2["可視化保存 save_visualization"]
  Save2 --> Stats1["報酬統計を出力(可能なら)"]
  Stats1 --> Stats2["パート別割当統計を出力"]
  Stats2 --> End["終了"]

  subgraph 可視化処理
    direction TB
    HM
    TL
    SaveHM
    SaveTL
  end
```

- 出力先: `outputs/visualizations`
  - ヒートマップ: `schedule_heatmap_YYYYMMDD_HHMMSS.png`
  - タイムライン: `schedule_timeline_YYYYMMDD_HHMMSS.png`
