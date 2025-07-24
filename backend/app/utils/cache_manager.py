import os
import time
import json
import hashlib
from io import BytesIO
from typing import Optional, Tuple, Dict
from pathlib import Path


class CacheManager:
    """生成されたPDFファイルのキャッシュを管理するクラス"""
    
    def __init__(self, cache_dir: str = None, max_age: int = 3600):
        """
        キャッシュマネージャーの初期化
        
        Args:
            cache_dir: キャッシュディレクトリのパス（Noneの場合は./cacheを使用）
            max_age: キャッシュの有効期限（秒）
        """
        self.cache_dir = Path(cache_dir or "./cache")
        self.max_age = max_age
        
        # キャッシュディレクトリを作成
        self.cache_dir.mkdir(exist_ok=True)
        (self.cache_dir / "metadata").mkdir(exist_ok=True)
    
    def get_cached_file(self, key: str) -> Optional[Tuple[BytesIO, Dict]]:
        """
        キャッシュされたファイルを取得
        
        Args:
            key: キャッシュキー
            
        Returns:
            キャッシュされたファイルとメタデータのタプル、または None
        """
        file_path = self._generate_file_path(key)
        metadata = self._get_file_metadata(key)
        
        if not file_path.exists() or not metadata:
            return None
        
        # 期限切れチェック
        if self._is_expired(metadata):
            self._remove_cache_file(key)
            return None
        
        try:
            with open(file_path, 'rb') as f:
                file_data = BytesIO(f.read())
            return file_data, metadata
        except Exception:
            return None
    
    def cache_file(self, key: str, file_data: BytesIO, metadata: Dict) -> Dict:
        """
        ファイルをキャッシュに保存
        
        Args:
            key: キャッシュキー
            file_data: ファイルデータ
            metadata: メタデータ
            
        Returns:
            キャッシュ情報
        """
        file_path = self._generate_file_path(key)
        
        # メタデータにタイムスタンプを追加
        cache_metadata = {
            **metadata,
            'cached_at': time.time(),
            'expires_at': time.time() + self.max_age,
            'key': key
        }
        
        try:
            # ファイルを保存
            with open(file_path, 'wb') as f:
                f.write(file_data.getvalue())
            
            # メタデータを保存
            self._save_metadata(key, cache_metadata)
            
            return cache_metadata
        except Exception as e:
            raise Exception(f"キャッシュファイルの保存に失敗しました: {str(e)}")
    
    def invalidate_cache(self, pattern: str) -> int:
        """
        指定パターンのキャッシュを無効化
        
        Args:
            pattern: 無効化するキャッシュのパターン
            
        Returns:
            削除されたファイル数
        """
        deleted_count = 0
        
        try:
            # メタデータディレクトリの全ファイルをチェック
            metadata_dir = self.cache_dir / "metadata"
            for metadata_file in metadata_dir.glob("*.json"):
                key = metadata_file.stem
                if pattern in key:
                    self._remove_cache_file(key)
                    deleted_count += 1
        except Exception:
            pass
        
        return deleted_count
    
    def clean_expired_files(self) -> int:
        """
        期限切れファイルの削除
        
        Returns:
            削除されたファイル数
        """
        deleted_count = 0
        
        try:
            metadata_dir = self.cache_dir / "metadata"
            for metadata_file in metadata_dir.glob("*.json"):
                key = metadata_file.stem
                metadata = self._get_file_metadata(key)
                
                if metadata and self._is_expired(metadata):
                    self._remove_cache_file(key)
                    deleted_count += 1
        except Exception:
            pass
        
        return deleted_count
    
    def _generate_file_path(self, key: str) -> Path:
        """キャッシュファイルパス生成"""
        # キーをハッシュ化してファイル名にする
        hash_key = hashlib.md5(key.encode()).hexdigest()
        return self.cache_dir / f"{hash_key}.pdf"
    
    def _get_file_metadata(self, key: str) -> Optional[Dict]:
        """ファイルメタデータ取得"""
        hash_key = hashlib.md5(key.encode()).hexdigest()
        metadata_path = self.cache_dir / "metadata" / f"{hash_key}.json"
        
        if not metadata_path.exists():
            return None
        
        try:
            with open(metadata_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            return None
    
    def _save_metadata(self, key: str, metadata: Dict) -> None:
        """メタデータ保存"""
        hash_key = hashlib.md5(key.encode()).hexdigest()
        metadata_path = self.cache_dir / "metadata" / f"{hash_key}.json"
        
        with open(metadata_path, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, ensure_ascii=False, indent=2, default=str)
    
    def _is_expired(self, metadata: Dict) -> bool:
        """期限切れ確認"""
        expires_at = metadata.get('expires_at', 0)
        return time.time() > expires_at
    
    def _remove_cache_file(self, key: str) -> None:
        """キャッシュファイルとメタデータを削除"""
        hash_key = hashlib.md5(key.encode()).hexdigest()
        
        # PDFファイルを削除
        pdf_path = self.cache_dir / f"{hash_key}.pdf"
        if pdf_path.exists():
            pdf_path.unlink()
        
        # メタデータファイルを削除
        metadata_path = self.cache_dir / "metadata" / f"{hash_key}.json"
        if metadata_path.exists():
            metadata_path.unlink()