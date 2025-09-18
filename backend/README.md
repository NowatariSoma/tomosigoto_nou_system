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