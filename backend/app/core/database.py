import psycopg2.pool
from psycopg2.extras import RealDictCursor

from app.core.config import settings

_pg_pool = None


def _get_pg_pool():
    global _pg_pool
    if _pg_pool is None:
        _pg_pool = psycopg2.pool.ThreadedConnectionPool(2, 20, settings.DATABASE_URL)
    return _pg_pool


class Conn:
    """psycopg2 コネクションのラッパー。RealDictCursor で辞書形式の結果を返す。"""

    def __init__(self):
        self._pool = _get_pg_pool()
        self._raw = self._pool.getconn()

    def execute(self, sql: str, params=()):
        cur = self._raw.cursor(cursor_factory=RealDictCursor)
        cur.execute(sql, params if params else None)
        return cur

    def commit(self):
        self._raw.commit()

    def rollback(self):
        self._raw.rollback()

    def close(self):
        self._pool.putconn(self._raw)

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type:
            self.rollback()
        else:
            self.commit()
        self.close()
        return False


def get_db() -> Conn:
    """FastAPI の Depends で使用する DB コネクション取得関数。"""
    conn = Conn()
    try:
        yield conn
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
