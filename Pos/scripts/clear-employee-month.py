#!/usr/bin/env python3
"""One-off: clear a staff member's time entries for a month and mark them as owner."""

from __future__ import annotations

import calendar
import sys
from datetime import date, datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

import pg8000.native


def load_db_url() -> str:
    env_path = Path(__file__).resolve().parents[1] / ".env"
    for line in env_path.read_text().splitlines():
        if line.startswith("DATABASE_URL="):
            return line.split("=", 1)[1].strip().strip('"').strip("'")
    raise SystemExit("DATABASE_URL not found")


def main() -> None:
    name_query = sys.argv[1] if len(sys.argv) > 1 else "alis"
    year = int(sys.argv[2]) if len(sys.argv) > 2 else date.today().year
    month = int(sys.argv[3]) if len(sys.argv) > 3 else date.today().month
    mark_owner = "--no-owner" not in sys.argv

    db_url = load_db_url()
    parsed = urlparse(db_url.replace("postgres://", "postgresql://", 1))
    conn = pg8000.native.Connection(
        user=parsed.username,
        password=parsed.password,
        host=parsed.hostname,
        port=parsed.port or 5432,
        database=parsed.path.lstrip("/"),
    )

    users = conn.run(
        'SELECT "id", "name", "isOwner" FROM "User" WHERE LOWER("name") LIKE :pattern',
        pattern=f"%{name_query.lower()}%",
    )
    if not users:
        raise SystemExit(f"No user found matching name: {name_query!r}")

    last_day = calendar.monthrange(year, month)[1]
    range_start = datetime(year, month, 1, 0, 0, 0, tzinfo=timezone.utc)
    range_end = datetime(year, month, last_day, 23, 59, 59, tzinfo=timezone.utc)

    for user_id, name, is_owner in users:
        deleted = conn.run(
            """
            DELETE FROM "TimeEntry"
            WHERE "userId" = :user_id
              AND "clockIn" >= :range_start
              AND "clockIn" <= :range_end
            RETURNING "id"
            """,
            user_id=user_id,
            range_start=range_start,
            range_end=range_end,
        )
        print(f"{name} ({user_id}): deleted {len(deleted)} time entries for {year}-{month:02d}")

        if mark_owner:
            conn.run(
                'UPDATE "User" SET "isOwner" = true WHERE "id" = :user_id',
                user_id=user_id,
            )
            print(f"{name}: marked as owner (no time tracking)")

    conn.close()


if __name__ == "__main__":
    main()
