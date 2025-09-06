python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt　（初回のみ）
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

また、env.examleをこぴーして、.envファイルとして保存する　（初回のみ）

これをやる