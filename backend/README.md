仮想環境のファイルを作る
python -m venv venv

仮想環境に必要モジュールをインストールする
pip install -r requirements.txt

これより下を毎回やる

仮想環境に入る
source venv/bin/activate

APIを立ち上げる
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

プロセス閉じる時は、コントロール＋C

python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt　（初回のみ）
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

また、env.examleをこぴーして、.envファイルとして保存する　（初回のみ）

これをやる


roomsettings関連フォルダ内のコーディング、型定義に習うようにする
コードは確認すること
