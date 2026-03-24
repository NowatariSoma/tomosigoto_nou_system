from typing import Any

from app.core.database import Conn


class VenueRepository:

    def __init__(self, conn: Conn):
        self.conn = conn
        self.table_name = "venues"

    def find_all(self) -> list[dict[str, Any]]:
        rows = self.conn.execute("SELECT * FROM venues").fetchall()
        return [dict(r) for r in rows]

    def find_by_id(self, venue_id) -> dict[str, Any] | None:
        row = self.conn.execute(
            "SELECT * FROM venues WHERE id = %s",
            (str(venue_id),),
        ).fetchone()
        return dict(row) if row else None

    def create(self, venue_data) -> dict[str, Any]:
        columns = list(venue_data.keys())
        values = [venue_data[c] for c in columns]
        placeholders = ", ".join(["%s"] * len(columns))
        col_str = ", ".join(columns)
        cur = self.conn.execute(
            f"INSERT INTO venues ({col_str}) VALUES ({placeholders}) RETURNING *",
            values,
        )
        self.conn.commit()
        return dict(cur.fetchone())

    def update(self, venue_id, venue_data) -> dict[str, Any] | None:
        if not venue_data:
            return self.find_by_id(venue_id)
        set_clause = ", ".join([f"{k} = %s" for k in venue_data.keys()])
        values = list(venue_data.values()) + [str(venue_id)]
        cur = self.conn.execute(
            f"UPDATE venues SET {set_clause} WHERE id = %s RETURNING *",
            values,
        )
        self.conn.commit()
        row = cur.fetchone()
        return dict(row) if row else None

    def delete(self, venue_id) -> bool:
        self.conn.execute("DELETE FROM venues WHERE id = %s", (str(venue_id),))
        self.conn.commit()
        return True
