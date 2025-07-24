#!/usr/bin/env python3
"""
PDF Export機能のテスト実行スクリプト
"""
import os
import sys
import subprocess
from pathlib import Path

# プロジェクトルートをPythonパスに追加
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

def run_tests():
    """テストを実行する"""
    os.environ["PYTHONPATH"] = str(project_root)
    
    # テストコマンド
    cmd = [
        "python", "-m", "pytest",
        "tests/",
        "-v",
        "--tb=short",
        "--cov=app",
        "--cov-report=term-missing",
        "--cov-report=html:htmlcov",
        "--cov-report=xml:coverage.xml"
    ]
    
    print("PDF Export機能のテスト実行開始...")
    print(f"プロジェクトルート: {project_root}")
    print(f"テストディレクトリ: {project_root}/tests")
    print(f"実行コマンド: {' '.join(cmd)}")
    print("-" * 60)
    
    try:
        result = subprocess.run(cmd, cwd=project_root, check=False)
        
        print("-" * 60)
        if result.returncode == 0:
            print("✅ すべてのテストが成功しました！")
        else:
            print("❌ 一部のテストが失敗しました。")
        
        print(f"終了コード: {result.returncode}")
        return result.returncode
        
    except Exception as e:
        print(f"❌ テスト実行中にエラーが発生しました: {e}")
        return 1

if __name__ == "__main__":
    exit_code = run_tests()
    sys.exit(exit_code)