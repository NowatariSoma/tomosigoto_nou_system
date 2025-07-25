"""
バージョン管理ユーティリティモジュール

マイグレーションファイルのバージョン管理に関するユーティリティ機能を提供します。
バージョンの解析、比較、生成、検証などを行います。
"""
import re
from datetime import datetime
from typing import Optional
import logging


class VersionUtil:
    """バージョン管理ユーティリティクラス
    
    マイグレーションファイルのバージョン管理に関する静的メソッドを提供します。
    以下の形式のバージョンをサポートします：
    - タイムスタンプ形式: 20250101000000
    - セマンティックバージョン: 1.0.0
    - 連番形式: 001, 002, ...
    """
    
    # バージョン形式の正規表現パターン
    TIMESTAMP_PATTERN = re.compile(r'^(\d{14})_.*\.sql$')
    SEMANTIC_PATTERN = re.compile(r'^v?(\d+\.\d+\.\d+)_.*\.sql$')
    SEQUENTIAL_PATTERN = re.compile(r'^(\d{3,})_.*\.sql$')
    
    # タイムスタンプバージョンの正規表現（検証用）
    TIMESTAMP_VALIDATION_PATTERN = re.compile(r'^\d{14}$')
    SEMANTIC_VALIDATION_PATTERN = re.compile(r'^\d+\.\d+\.\d+$')
    SEQUENTIAL_VALIDATION_PATTERN = re.compile(r'^\d+$')
    
    @staticmethod
    def parse_version(filename: str) -> Optional[str]:
        """ファイル名からバージョンを抽出
        
        Args:
            filename (str): マイグレーションファイル名
            
        Returns:
            Optional[str]: 抽出されたバージョン文字列、無効な場合はNone
        """
        if not isinstance(filename, str):
            return None
        
        # タイムスタンプ形式をチェック
        match = VersionUtil.TIMESTAMP_PATTERN.match(filename)
        if match:
            return match.group(1)
        
        # セマンティックバージョン形式をチェック
        match = VersionUtil.SEMANTIC_PATTERN.match(filename)
        if match:
            return match.group(1)
        
        # 連番形式をチェック
        match = VersionUtil.SEQUENTIAL_PATTERN.match(filename)
        if match:
            return match.group(1)
        
        # いずれの形式にも一致しない場合
        logging.debug(f"Invalid migration filename format: {filename}")
        return None
    
    @staticmethod
    def compare_versions(ver1: str, ver2: str) -> int:
        """バージョンを比較
        
        Args:
            ver1 (str): 比較対象のバージョン1
            ver2 (str): 比較対象のバージョン2
            
        Returns:
            int: ver1 < ver2 なら -1、ver1 > ver2 なら 1、同じなら 0
        """
        if ver1 == ver2:
            return 0
        
        # 両方がタイムスタンプ形式の場合
        if (VersionUtil.TIMESTAMP_VALIDATION_PATTERN.match(ver1) and 
            VersionUtil.TIMESTAMP_VALIDATION_PATTERN.match(ver2)):
            return VersionUtil._compare_timestamp_versions(ver1, ver2)
        
        # 両方がセマンティックバージョン形式の場合
        if (VersionUtil.SEMANTIC_VALIDATION_PATTERN.match(ver1) and 
            VersionUtil.SEMANTIC_VALIDATION_PATTERN.match(ver2)):
            return VersionUtil._compare_semantic_versions(ver1, ver2)
        
        # 両方が連番形式の場合
        if (VersionUtil.SEQUENTIAL_VALIDATION_PATTERN.match(ver1) and 
            VersionUtil.SEQUENTIAL_VALIDATION_PATTERN.match(ver2)):
            return VersionUtil._compare_sequential_versions(ver1, ver2)
        
        # 異なる形式の場合は文字列として比較
        logging.warning(f"Comparing different version formats: {ver1} vs {ver2}")
        return -1 if ver1 < ver2 else 1
    
    @staticmethod
    def generate_version() -> str:
        """新しいタイムスタンプバージョンを生成
        
        Returns:
            str: YYYYMMDDHHmmss形式のバージョン文字列
        """
        now = datetime.now()
        return now.strftime("%Y%m%d%H%M%S")
    
    @staticmethod
    def extract_timestamp(version: str) -> Optional[datetime]:
        """バージョンからタイムスタンプを抽出
        
        Args:
            version (str): タイムスタンプ形式のバージョン
            
        Returns:
            Optional[datetime]: 抽出された日時、無効な場合はNone
        """
        if not VersionUtil.TIMESTAMP_VALIDATION_PATTERN.match(version):
            return None
        
        try:
            return datetime.strptime(version, "%Y%m%d%H%M%S")
        except ValueError:
            logging.debug(f"Invalid timestamp format: {version}")
            return None
    
    @staticmethod
    def is_valid_version(version: str) -> bool:
        """バージョンの有効性を検証
        
        Args:
            version (str): 検証対象のバージョン
            
        Returns:
            bool: 有効な場合True
        """
        if not isinstance(version, str) or not version:
            return False
        
        # タイムスタンプ形式の検証
        if VersionUtil.TIMESTAMP_VALIDATION_PATTERN.match(version):
            return VersionUtil._is_valid_timestamp(version)
        
        # セマンティックバージョン形式の検証
        if VersionUtil.SEMANTIC_VALIDATION_PATTERN.match(version):
            return True  # 正規表現に一致すれば有効
        
        # 連番形式の検証
        if VersionUtil.SEQUENTIAL_VALIDATION_PATTERN.match(version):
            return True  # 正規表現に一致すれば有効
        
        return False
    
    @staticmethod
    def format_version(major: int, minor: int, patch: int) -> str:
        """セマンティックバージョンを書式設定
        
        Args:
            major (int): メジャーバージョン
            minor (int): マイナーバージョン
            patch (int): パッチバージョン
            
        Returns:
            str: 書式設定されたセマンティックバージョン
            
        Raises:
            ValueError: 無効な入力値の場合
        """
        if major < 0 or minor < 0 or patch < 0:
            raise ValueError("バージョン番号は0以上の整数である必要があります")
        
        return f"{major}.{minor}.{patch}"
    
    @staticmethod
    def _compare_timestamp_versions(ver1: str, ver2: str) -> int:
        """タイムスタンプバージョンの比較
        
        Args:
            ver1 (str): タイムスタンプバージョン1
            ver2 (str): タイムスタンプバージョン2
            
        Returns:
            int: 比較結果
        """
        # タイムスタンプは文字列として比較可能
        if ver1 < ver2:
            return -1
        elif ver1 > ver2:
            return 1
        else:
            return 0
    
    @staticmethod
    def _compare_semantic_versions(ver1: str, ver2: str) -> int:
        """セマンティックバージョンの比較
        
        Args:
            ver1 (str): セマンティックバージョン1
            ver2 (str): セマンティックバージョン2
            
        Returns:
            int: 比較結果
        """
        def parse_semantic(version: str) -> tuple:
            """セマンティックバージョンをタプルに変換"""
            return tuple(map(int, version.split('.')))
        
        v1_parts = parse_semantic(ver1)
        v2_parts = parse_semantic(ver2)
        
        if v1_parts < v2_parts:
            return -1
        elif v1_parts > v2_parts:
            return 1
        else:
            return 0
    
    @staticmethod
    def _compare_sequential_versions(ver1: str, ver2: str) -> int:
        """連番バージョンの比較
        
        Args:
            ver1 (str): 連番バージョン1
            ver2 (str): 連番バージョン2
            
        Returns:
            int: 比較結果
        """
        v1_num = int(ver1)
        v2_num = int(ver2)
        
        if v1_num < v2_num:
            return -1
        elif v1_num > v2_num:
            return 1
        else:
            return 0
    
    @staticmethod
    def _is_valid_timestamp(timestamp: str) -> bool:
        """タイムスタンプの有効性を詳細検証
        
        Args:
            timestamp (str): 検証対象のタイムスタンプ
            
        Returns:
            bool: 有効な場合True
        """
        if len(timestamp) != 14:
            return False
        
        try:
            # 年月日時分秒の各部分を抽出
            year = int(timestamp[0:4])
            month = int(timestamp[4:6])
            day = int(timestamp[6:8])
            hour = int(timestamp[8:10])
            minute = int(timestamp[10:12])
            second = int(timestamp[12:14])
            
            # 基本的な範囲チェック
            if not (1900 <= year <= 9999):
                return False
            if not (1 <= month <= 12):
                return False
            if not (1 <= day <= 31):
                return False
            if not (0 <= hour <= 23):
                return False
            if not (0 <= minute <= 59):
                return False
            if not (0 <= second <= 59):
                return False
            
            # 実際の日時として有効かチェック
            datetime(year, month, day, hour, minute, second)
            return True
            
        except (ValueError, TypeError):
            return False


# 便利な関数のエイリアス
parse_version = VersionUtil.parse_version
compare_versions = VersionUtil.compare_versions
generate_version = VersionUtil.generate_version
extract_timestamp = VersionUtil.extract_timestamp
is_valid_version = VersionUtil.is_valid_version
format_version = VersionUtil.format_version